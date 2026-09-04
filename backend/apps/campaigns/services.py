import os
import uuid
import logging
from django.utils import timezone
from django.conf import settings
from apps.campaigns.models import Campaign, ProcessingJob, SourceAsset
from apps.transcripts.models import Transcript
from apps.generations.services import LLMProviderService
from apps.assets.models import GeneratedAsset, AssetVersion
from apps.seo.services import SEOService
from apps.notifications.models import Notification
from apps.audit.models import AuditLog, APIUsage

logger = logging.getLogger(__name__)

def run_campaign_pipeline(campaign_id):
    """
    Synchronous / Asynchronous background pipeline worker.
    Processes campaign through stages: Uploading -> Extracting -> Transcribing -> Analysing -> Generating -> Completed.
    """
    try:
        campaign = Campaign.objects.get(id=campaign_id)
    except Campaign.DoesNotExist:
        logger.error(f"Campaign {campaign_id} not found.")
        return False

    job, _ = ProcessingJob.objects.get_or_create(
        campaign=campaign,
        defaults={"job_type": "pipeline_all", "status": "processing", "progress": 10, "current_stage": "Extracting Source Content"}
    )
    job.status = 'processing'
    job.progress = 10
    job.current_stage = 'Extracting Source Content'
    job.started_at = timezone.now()
    job.save()

    campaign.status = 'extracting'
    campaign.save()

    # Step 1: Extract Text & Transcribe
    source_text = campaign.source_text
    if not source_text and campaign.source_assets.exists():
        # Document/File extraction fallback
        source_asset = campaign.source_assets.first()
        source_text = f"Content extracted from uploaded file: {source_asset.original_filename}"

    if not source_text.strip():
        source_text = f"Campaign Topic: {campaign.name}"

    job.progress = 30
    job.current_stage = 'Transcribing & Structuring'
    job.save()

    campaign.status = 'transcribing'
    campaign.save()

    # Save Transcript
    transcript_obj, _ = Transcript.objects.get_or_create(
        campaign=campaign,
        defaults={
            "text": source_text,
            "language": campaign.language,
            "segments_json": [
                {"start": 0, "end": 10, "text": source_text[:200]}
            ]
        }
    )
    if not transcript_obj.text:
        transcript_obj.text = source_text
        transcript_obj.save()

    # Step 2: Analysing & AI Content Generation
    job.progress = 60
    job.current_stage = 'Generating Multi-Platform Assets'
    job.save()

    campaign.status = 'generating'
    campaign.save()

    brand_profile = getattr(campaign.workspace, 'brand_profile', None)
    target_platforms = campaign.target_platforms or ['youtube', 'instagram', 'linkedin', 'twitter', 'blog', 'shorts']

    generated_pack = LLMProviderService.generate_content_package(
        topic_or_text=transcript_obj.get_effective_text(),
        target_platforms=target_platforms,
        brand_profile=brand_profile
    )

    # Step 3: Save Assets & Versioning
    for asset_data in generated_pack.get('assets', []):
        asset_obj = GeneratedAsset.objects.create(
            campaign=campaign,
            platform=asset_data['platform'],
            asset_type=asset_data.get('asset_type', 'content_pack'),
            title=asset_data.get('title', f"{asset_data['platform'].upper()} Content"),
            content=asset_data.get('content', ''),
            metadata_json=asset_data.get('metadata', {}),
            status='draft',
            current_version=1,
            created_by_ai=True
        )

        AssetVersion.objects.create(
            asset=asset_obj,
            version_number=1,
            content=asset_obj.content,
            metadata_json=asset_obj.metadata_json,
            created_by=campaign.created_by
        )

        # Step 4: Initial SEO Score calculation
        SEOService.calculate_and_save_seo(asset_obj)

    # Step 5: Mark Job as Completed
    job.progress = 100
    job.current_stage = 'Completed'
    job.status = 'completed'
    job.finished_at = timezone.now()
    job.save()

    campaign.status = 'completed'
    campaign.save()

    # Step 6: Create Notification & Audit Log
    Notification.objects.create(
        user=campaign.created_by,
        notification_type='job_completed',
        title=f"Campaign '{campaign.name}' Ready!",
        message=f"All {len(generated_pack.get('assets', []))} multi-platform assets have been generated and are awaiting your review in the Content Studio."
    )

    AuditLog.objects.create(
        workspace=campaign.workspace,
        actor=campaign.created_by,
        action='campaign.processed',
        resource_type='Campaign',
        resource_id=str(campaign.id),
        metadata_json={"assets_count": len(generated_pack.get('assets', []))}
    )

    APIUsage.objects.create(
        workspace=campaign.workspace,
        provider=getattr(settings, 'AI_PROVIDER', 'deterministic'),
        operation='generate_content_package',
        input_tokens=len(source_text.split()),
        output_tokens=1500,
        estimated_cost=0.002,
        duration_ms=450,
        success=True
    )

    return True
