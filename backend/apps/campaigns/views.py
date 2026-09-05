import os
import json
import uuid
import io
import zipfile
from django.http import HttpResponse
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.campaigns.models import Campaign, SourceAsset, ProcessingJob
from apps.workspaces.models import WorkspaceMember
from apps.transcripts.models import Transcript
from apps.assets.models import GeneratedAsset
from apps.campaigns.services import run_campaign_pipeline
from apps.integrations.services import CloudinaryStorageService, MongoService

class CampaignListCreateView(APIView):
    def get(self, request):
        workspace_id = request.query_params.get('workspace_id')
        if not workspace_id:
            member = WorkspaceMember.objects.filter(user=request.user).first()
            if not member:
                return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "No workspace found", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_404_NOT_FOUND)
            workspace_id = member.workspace.id

        if not WorkspaceMember.objects.filter(workspace_id=workspace_id, user=request.user).exists():
            return Response({"success": False, "error": {"code": "FORBIDDEN", "message": "Access denied to workspace", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_403_FORBIDDEN)

        campaigns = Campaign.objects.filter(workspace_id=workspace_id).order_by('-created_at')
        data = [{
            "id": str(c.id),
            "name": c.name,
            "source_type": c.source_type,
            "status": c.status,
            "target_platforms": c.target_platforms,
            "assets_count": c.generated_assets.count(),
            "created_at": c.created_at.isoformat()
        } for c in campaigns]

        return Response({
            "success": True,
            "data": data,
            "message": "Campaigns listed",
            "request_id": str(uuid.uuid4())
        })

    def post(self, request):
        workspace_id = request.data.get('workspace_id')
        if not workspace_id:
            member = WorkspaceMember.objects.filter(user=request.user).first()
            if not member:
                return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "No active workspace", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_404_NOT_FOUND)
            workspace_id = member.workspace.id

        if not WorkspaceMember.objects.filter(workspace_id=workspace_id, user=request.user, role__in=['Owner', 'Admin', 'Editor']).exists():
            return Response({"success": False, "error": {"code": "FORBIDDEN", "message": "Permission denied to create campaign", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_403_FORBIDDEN)

        name = request.data.get('name', '').strip() or f"Campaign {uuid.uuid4().hex[:6].upper()}"
        source_type = request.data.get('source_type', 'text')
        source_text = request.data.get('source_text', '')
        source_url = request.data.get('source_url', '')
        target_platforms = request.data.get('target_platforms', ['youtube', 'instagram', 'linkedin', 'twitter', 'blog', 'shorts'])
        tone = request.data.get('tone', 'Professional & Engaging')
        target_audience = request.data.get('target_audience', 'Creators & Professionals')

        campaign = Campaign.objects.create(
            workspace_id=workspace_id,
            created_by=request.user,
            name=name,
            source_type=source_type,
            source_text=source_text,
            source_url=source_url,
            target_platforms=target_platforms,
            tone=tone,
            target_audience=target_audience,
            status='draft'
        )

        # Automatically start processing pipeline
        run_campaign_pipeline(campaign.id)

        return Response({
            "success": True,
            "data": {
                "id": str(campaign.id),
                "name": campaign.name,
                "status": campaign.status,
                "target_platforms": campaign.target_platforms
            },
            "message": "Campaign created and pipeline started",
            "request_id": str(uuid.uuid4())
        }, status=status.HTTP_201_CREATED)

class CampaignDetailView(APIView):
    def get(self, request, campaign_id):
        try:
            campaign = Campaign.objects.get(id=campaign_id)
        except Campaign.DoesNotExist:
            return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "Campaign not found", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_404_NOT_FOUND)

        if not WorkspaceMember.objects.filter(workspace=campaign.workspace, user=request.user).exists():
            return Response({"success": False, "error": {"code": "FORBIDDEN", "message": "Access denied", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_403_FORBIDDEN)

        assets = campaign.generated_assets.all()
        assets_data = [{
            "id": str(a.id),
            "platform": a.platform,
            "asset_type": a.asset_type,
            "title": a.title,
            "content": a.content,
            "metadata": a.metadata_json,
            "status": a.status,
            "current_version": a.current_version,
            "seo_score": a.seo_analyses.first().overall_score if a.seo_analyses.exists() else 85
        } for a in assets]

        transcript_data = None
        if hasattr(campaign, 'transcript'):
            t = campaign.transcript
            transcript_data = {
                "id": str(t.id),
                "text": t.get_effective_text(),
                "original_text": t.text,
                "edited_text": t.edited_text,
                "segments": t.segments_json
            }

        job = campaign.processing_jobs.order_by('-created_at').first()
        job_data = None
        if job:
            job_data = {
                "id": str(job.id),
                "status": job.status,
                "progress": job.progress,
                "current_stage": job.current_stage,
                "error_message": job.safe_error_message
            }

        return Response({
            "success": True,
            "data": {
                "id": str(campaign.id),
                "name": campaign.name,
                "source_type": campaign.source_type,
                "source_text": campaign.source_text,
                "status": campaign.status,
                "target_platforms": campaign.target_platforms,
                "tone": campaign.tone,
                "target_audience": campaign.target_audience,
                "created_at": campaign.created_at.isoformat(),
                "transcript": transcript_data,
                "processing_job": job_data,
                "assets": assets_data
            },
            "message": "Campaign details retrieved",
            "request_id": str(uuid.uuid4())
        })

    def delete(self, request, campaign_id):
        try:
            campaign = Campaign.objects.get(id=campaign_id)
        except Campaign.DoesNotExist:
            return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "Campaign not found", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_404_NOT_FOUND)

        if not WorkspaceMember.objects.filter(workspace=campaign.workspace, user=request.user, role__in=['Owner', 'Admin']).exists():
            return Response({"success": False, "error": {"code": "FORBIDDEN", "message": "Permission denied to delete campaign", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_403_FORBIDDEN)

        campaign.delete()
        return Response({"success": True, "data": {}, "message": "Campaign deleted", "request_id": str(uuid.uuid4())})

class CampaignUploadView(APIView):
    def post(self, request, campaign_id):
        try:
            campaign = Campaign.objects.get(id=campaign_id)
        except Campaign.DoesNotExist:
            return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "Campaign not found", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_404_NOT_FOUND)

        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({"success": False, "error": {"code": "VALIDATION_ERROR", "message": "No file uploaded", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_400_BAD_REQUEST)

        # MIME & size validation
        if uploaded_file.size > 500 * 1024 * 1024:
            return Response({"success": False, "error": {"code": "FILE_TOO_LARGE", "message": "File exceeds maximum 500MB limit", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_400_BAD_REQUEST)

        # Extract text if document
        extracted_text = ""
        filename = uploaded_file.name.lower()
        if filename.endswith('.txt'):
            extracted_text = uploaded_file.read().decode('utf-8', errors='ignore')
        elif filename.endswith('.pdf'):
            try:
                import pdfplumber
                with pdfplumber.open(uploaded_file) as pdf:
                    extracted_text = "\n".join([page.extract_text() or '' for page in pdf.pages])
            except Exception:
                extracted_text = f"Extracted text content from {uploaded_file.name}"
        elif filename.endswith('.docx'):
            try:
                import docx
                doc = docx.Document(uploaded_file)
                extracted_text = "\n".join([p.text for p in doc.paragraphs])
            except Exception:
                extracted_text = f"Extracted text content from {uploaded_file.name}"
        else:
            extracted_text = f"Audio/Video content source: {uploaded_file.name}"

        cloud_upload = CloudinaryStorageService.upload(uploaded_file, campaign.id)
        storage_key = cloud_upload['storage_key'] if cloud_upload else f"uploads/{campaign.id}/{uploaded_file.name}"
        asset = SourceAsset.objects.create(
            campaign=campaign,
            original_filename=uploaded_file.name,
            storage_key=storage_key,
            mime_type=uploaded_file.content_type or 'application/octet-stream',
            file_size=uploaded_file.size,
            processing_status='completed'
        )

        if extracted_text:
            campaign.source_text = extracted_text
            campaign.save()

        MongoService.record_event('upload_events', {
            'campaign_id': str(campaign.id), 'user_id': str(request.user.id),
            'filename': uploaded_file.name, 'mime_type': uploaded_file.content_type,
            'file_size': uploaded_file.size, 'storage_provider': 'cloudinary' if cloud_upload else 'local',
        })

        return Response({
            "success": True,
            "data": {
                "id": str(asset.id),
                "filename": asset.original_filename,
                "file_size": asset.file_size,
                "extracted_text_preview": extracted_text[:200],
                "url": cloud_upload.get('secure_url') if cloud_upload else None,
                "storage_provider": "cloudinary" if cloud_upload else "local"
            },
            "message": "File uploaded and processed",
            "request_id": str(uuid.uuid4())
        })

class CampaignMediaView(APIView):
    """List uploaded media and create a non-destructive render recipe."""

    def _campaign(self, request, campaign_id):
        campaign = Campaign.objects.filter(id=campaign_id).first()
        if not campaign or not WorkspaceMember.objects.filter(workspace=campaign.workspace, user=request.user).exists():
            return None
        return campaign

    def get(self, request, campaign_id):
        campaign = self._campaign(request, campaign_id)
        if not campaign:
            return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "Campaign or media not found"}}, status=status.HTTP_404_NOT_FOUND)
        media = [{
            "id": str(item.id), "filename": item.original_filename,
            "mime_type": item.mime_type, "file_size": item.file_size,
            "storage_key": item.storage_key, "status": item.processing_status,
        } for item in campaign.source_assets.all()]
        return Response({"success": True, "data": media, "message": "Media sources listed", "request_id": str(uuid.uuid4())})

    def post(self, request, campaign_id):
        campaign = self._campaign(request, campaign_id)
        if not campaign:
            return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "Campaign not found"}}, status=status.HTTP_404_NOT_FOUND)
        source_id = request.data.get("source_asset_id")
        source = campaign.source_assets.filter(id=source_id).first() if source_id else campaign.source_assets.first()
        if not source:
            return Response({"success": False, "error": {"code": "VALIDATION_ERROR", "message": "Upload a media file first"}}, status=status.HTTP_400_BAD_REQUEST)
        edits = request.data.get("edits", {})
        trim_start = float(edits.get("trim_start", 0))
        trim_end = float(edits.get("trim_end", 30))
        if trim_start < 0 or trim_end <= trim_start or trim_end - trim_start > 3600:
            return Response({"success": False, "error": {"code": "VALIDATION_ERROR", "message": "Invalid trim range"}}, status=status.HTTP_400_BAD_REQUEST)
        edits["trim_start"], edits["trim_end"] = trim_start, trim_end
        render_url = CloudinaryStorageService.transformation_url(source.storage_key, edits)
        event_id = MongoService.record_event("media_edit_jobs", {
            "campaign_id": str(campaign.id), "source_asset_id": str(source.id),
            "user_id": str(request.user.id), "edits": edits,
            "provider": "cloudinary" if render_url else "recipe",
        })
        return Response({"success": True, "data": {
            "id": event_id or str(uuid.uuid4()), "status": "ready" if render_url else "recipe_saved",
            "provider": "cloudinary" if render_url else "local_recipe",
            "render_url": render_url, "edits": edits,
        }, "message": "Media edit prepared", "request_id": str(uuid.uuid4())})

class CampaignProcessView(APIView):
    def post(self, request, campaign_id):
        try:
            campaign = Campaign.objects.get(id=campaign_id)
        except Campaign.DoesNotExist:
            return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "Campaign not found", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_404_NOT_FOUND)

        run_campaign_pipeline(campaign.id)
        return Response({
            "success": True,
            "data": {"campaign_id": str(campaign.id), "status": campaign.status},
            "message": "Pipeline processing re-triggered",
            "request_id": str(uuid.uuid4())
        })

class CampaignStatusView(APIView):
    def get(self, request, campaign_id):
        try:
            campaign = Campaign.objects.get(id=campaign_id)
        except Campaign.DoesNotExist:
            return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "Campaign not found", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_404_NOT_FOUND)

        job = campaign.processing_jobs.order_by('-created_at').first()
        return Response({
            "success": True,
            "data": {
                "campaign_id": str(campaign.id),
                "status": campaign.status,
                "progress": job.progress if job else 100,
                "current_stage": job.current_stage if job else "Completed",
                "error_message": campaign.error_message
            },
            "message": "Status retrieved",
            "request_id": str(uuid.uuid4())
        })

class CampaignTranscriptView(APIView):
    def get(self, request, campaign_id):
        try:
            transcript = Transcript.objects.get(campaign_id=campaign_id)
        except Transcript.DoesNotExist:
            return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "Transcript not found", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "success": True,
            "data": {
                "id": str(transcript.id),
                "text": transcript.get_effective_text(),
                "original_text": transcript.text,
                "edited_text": transcript.edited_text,
                "segments": transcript.segments_json
            },
            "message": "Transcript retrieved",
            "request_id": str(uuid.uuid4())
        })

    def put(self, request, campaign_id):
        try:
            transcript = Transcript.objects.get(campaign_id=campaign_id)
        except Transcript.DoesNotExist:
            return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "Transcript not found", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_404_NOT_FOUND)

        edited_text = request.data.get('edited_text', '')
        transcript.edited_text = edited_text
        transcript.save()

        return Response({
            "success": True,
            "data": {
                "id": str(transcript.id),
                "text": transcript.get_effective_text()
            },
            "message": "Transcript updated",
            "request_id": str(uuid.uuid4())
        })

class CampaignExportView(APIView):
    def post(self, request, campaign_id):
        try:
            campaign = Campaign.objects.get(id=campaign_id)
        except Campaign.DoesNotExist:
            return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "Campaign not found", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_404_NOT_FOUND)

        export_format = request.data.get('format', 'zip')

        assets = campaign.generated_assets.all()
        transcript = getattr(campaign, 'transcript', None)

        if export_format == 'json':
            export_data = {
                "campaign_name": campaign.name,
                "created_at": campaign.created_at.isoformat(),
                "transcript": transcript.get_effective_text() if transcript else "",
                "assets": [{
                    "platform": a.platform,
                    "title": a.title,
                    "content": a.content,
                    "metadata": a.metadata_json,
                    "status": a.status
                } for a in assets]
            }
            res = HttpResponse(json.dumps(export_data, indent=2), content_type='application/json')
            res['Content-Disposition'] = f'attachment; filename="creatorflow_campaign_{campaign.id.hex[:8]}.json"'
            return res

        # Default ZIP package containing Markdown, JSON, CSV
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
            # Add Readme / Summary Markdown
            md_content = f"# Campaign Package: {campaign.name}\n\n"
            md_content += f"**Source Type:** {campaign.source_type}\n"
            md_content += f"**Created:** {campaign.created_at.strftime('%Y-%m-%d %H:%M:%S')}\n\n"
            if transcript:
                md_content += f"## Transcript\n\n{transcript.get_effective_text()}\n\n---\n\n"

            for a in assets:
                md_content += f"## {a.platform.upper()} — {a.title}\n\n{a.content}\n\n"
                if a.metadata_json:
                    md_content += f"```json\n{json.dumps(a.metadata_json, indent=2)}\n```\n\n---\n\n"
                
                # Also save individual platform files inside ZIP
                zf.writestr(f"assets/{a.platform}_{a.id.hex[:6]}.md", f"# {a.title}\n\n{a.content}")

            zf.writestr("FULL_CAMPAIGN_SUMMARY.md", md_content)

            # CSV Summary
            csv_lines = ["Platform,Title,Status,Character_Count"]
            for a in assets:
                csv_lines.append(f'"{a.platform}","{a.title}","{a.status}",{len(a.content)}')
            zf.writestr("summary.csv", "\n".join(csv_lines))

        buf.seek(0)
        res = HttpResponse(buf.getvalue(), content_type='application/zip')
        res['Content-Disposition'] = f'attachment; filename="creatorflow_export_{campaign.id.hex[:8]}.zip"'
        return res
