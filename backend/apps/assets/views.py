import uuid
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.assets.models import GeneratedAsset, AssetVersion
from apps.seo.services import SEOService
from apps.workspaces.models import WorkspaceMember
from apps.generations.services import LLMProviderService

class AssetListView(APIView):
    def get(self, request):
        workspace_id = request.query_params.get('workspace_id')
        if not workspace_id:
            member = WorkspaceMember.objects.filter(user=request.user).first()
            if not member:
                return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "No workspace found", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_404_NOT_FOUND)
            workspace_id = member.workspace.id

        if not WorkspaceMember.objects.filter(workspace_id=workspace_id, user=request.user).exists():
            return Response({"success": False, "error": {"code": "FORBIDDEN", "message": "Access denied", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_403_FORBIDDEN)

        assets = GeneratedAsset.objects.filter(campaign__workspace_id=workspace_id).select_related('campaign')

        platform = request.query_params.get('platform')
        if platform:
            assets = assets.filter(platform=platform)

        asset_status = request.query_params.get('status')
        if asset_status:
            assets = assets.filter(status=asset_status)

        search = request.query_params.get('search')
        if search:
            assets = assets.filter(title__icontains=search) | assets.filter(content__icontains=search)

        assets = assets.order_by('-created_at')

        data = [{
            "id": str(a.id),
            "campaign_id": str(a.campaign.id),
            "campaign_name": a.campaign.name,
            "platform": a.platform,
            "asset_type": a.asset_type,
            "title": a.title,
            "content": a.content,
            "metadata": a.metadata_json,
            "status": a.status,
            "current_version": a.current_version,
            "character_count": len(a.content),
            "seo_score": a.seo_analyses.first().overall_score if a.seo_analyses.exists() else 85,
            "updated_at": a.updated_at.isoformat()
        } for a in assets]

        return Response({
            "success": True,
            "data": data,
            "message": "Assets listed",
            "request_id": str(uuid.uuid4())
        })

class AssetDetailView(APIView):
    def get(self, request, asset_id):
        try:
            asset = GeneratedAsset.objects.get(id=asset_id)
        except GeneratedAsset.DoesNotExist:
            return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "Asset not found", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_404_NOT_FOUND)

        if not WorkspaceMember.objects.filter(workspace=asset.campaign.workspace, user=request.user).exists():
            return Response({"success": False, "error": {"code": "FORBIDDEN", "message": "Access denied", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_403_FORBIDDEN)

        versions = asset.versions.all()
        versions_data = [{
            "id": str(v.id),
            "version_number": v.version_number,
            "content": v.content,
            "metadata": v.metadata_json,
            "created_at": v.created_at.isoformat()
        } for v in versions]

        seo_analysis = asset.seo_analyses.first()
        seo_data = None
        if seo_analysis:
            seo_data = {
                "overall_score": seo_analysis.overall_score,
                "checks": seo_analysis.checks_json,
                "recommendations": seo_analysis.recommendations_json
            }

        return Response({
            "success": True,
            "data": {
                "id": str(asset.id),
                "campaign_id": str(asset.campaign.id),
                "campaign_name": asset.campaign.name,
                "platform": asset.platform,
                "asset_type": asset.asset_type,
                "title": asset.title,
                "content": asset.content,
                "metadata": asset.metadata_json,
                "status": asset.status,
                "current_version": asset.current_version,
                "character_count": len(asset.content),
                "versions": versions_data,
                "seo_analysis": seo_data
            },
            "message": "Asset details retrieved",
            "request_id": str(uuid.uuid4())
        })

    def put(self, request, asset_id):
        try:
            asset = GeneratedAsset.objects.get(id=asset_id)
        except GeneratedAsset.DoesNotExist:
            return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "Asset not found", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_404_NOT_FOUND)

        if not WorkspaceMember.objects.filter(workspace=asset.campaign.workspace, user=request.user, role__in=['Owner', 'Admin', 'Editor']).exists():
            return Response({"success": False, "error": {"code": "FORBIDDEN", "message": "Permission denied to edit asset", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_403_FORBIDDEN)

        if 'title' in request.data:
            asset.title = request.data['title']
        if 'content' in request.data:
            asset.content = request.data['content']
        if 'metadata' in request.data:
            asset.metadata_json = request.data['metadata']

        asset.current_version += 1
        asset.save()

        # Save new version history
        AssetVersion.objects.create(
            asset=asset,
            version_number=asset.current_version,
            content=asset.content,
            metadata_json=asset.metadata_json,
            created_by=request.user
        )

        # Recalculate SEO Score
        SEOService.calculate_and_save_seo(asset)

        return Response({
            "success": True,
            "data": {
                "id": str(asset.id),
                "current_version": asset.current_version,
                "content": asset.content,
                "title": asset.title
            },
            "message": "Asset updated and version created",
            "request_id": str(uuid.uuid4())
        })

class AssetApproveView(APIView):
    def post(self, request, asset_id):
        try:
            asset = GeneratedAsset.objects.get(id=asset_id)
        except GeneratedAsset.DoesNotExist:
            return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "Asset not found", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status', 'approved')
        if new_status not in ['approved', 'rejected', 'draft']:
            new_status = 'approved'

        asset.status = new_status
        if new_status == 'approved':
            asset.approved_by = request.user
            from django.utils import timezone
            asset.approved_at = timezone.now()

        asset.save()

        return Response({
            "success": True,
            "data": {
                "id": str(asset.id),
                "status": asset.status
            },
            "message": f"Asset marked as {asset.status}",
            "request_id": str(uuid.uuid4())
        })

class AssetRegenerateView(APIView):
    def post(self, request, asset_id):
        try:
            asset = GeneratedAsset.objects.get(id=asset_id)
        except GeneratedAsset.DoesNotExist:
            return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "Asset not found", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_404_NOT_FOUND)

        transcript = getattr(asset.campaign, 'transcript', None)
        text = transcript.get_effective_text() if transcript else asset.campaign.source_text

        pack = LLMProviderService.generate_content_package(
            topic_or_text=text,
            target_platforms=[asset.platform],
            brand_profile=getattr(asset.campaign.workspace, 'brand_profile', None)
        )

        new_assets = pack.get('assets', [])
        if new_assets:
            target = new_assets[0]
            asset.title = target.get('title', asset.title)
            asset.content = target.get('content', asset.content)
            asset.metadata_json = target.get('metadata', asset.metadata_json)
            asset.current_version += 1
            asset.save()

            AssetVersion.objects.create(
                asset=asset,
                version_number=asset.current_version,
                content=asset.content,
                metadata_json=asset.metadata_json,
                created_by=request.user
            )

            SEOService.calculate_and_save_seo(asset)

        return Response({
            "success": True,
            "data": {
                "id": str(asset.id),
                "current_version": asset.current_version,
                "title": asset.title,
                "content": asset.content
            },
            "message": "Asset regenerated successfully",
            "request_id": str(uuid.uuid4())
        })

class AssetVersionsView(APIView):
    def get(self, request, asset_id):
        versions = AssetVersion.objects.filter(asset_id=asset_id).order_by('-version_number')
        data = [{
            "id": str(v.id),
            "version_number": v.version_number,
            "content": v.content,
            "metadata": v.metadata_json,
            "created_at": v.created_at.isoformat()
        } for v in versions]

        return Response({
            "success": True,
            "data": data,
            "message": "Asset version history retrieved",
            "request_id": str(uuid.uuid4())
        })

class ThumbnailGenerateView(APIView):
    def post(self, request):
        title = request.data.get('title', 'AI Content Engine Breakdown')
        aspect_ratio = request.data.get('aspect_ratio', '16:9') # 16:9, 1:1, 4:5, 9:16
        theme = request.data.get('theme', 'dark_neon') # dark_neon, minimal_light, bold_yellow, high_contrast

        prompts = [
            f"High-contrast {aspect_ratio} thumbnail for '{title}'. Dark background with neon cyan title text on the left, glowing 3D AI node icon on the right.",
            f"Clean minimalist {aspect_ratio} visual mockup: '{title.upper()}'. Split color scheme, bold sans-serif typography, high legibility.",
            f"Vibrant creator thumbnail preset ({aspect_ratio}): Host pointing to bold text '{title}', gradient background, badge: '2026 EDITION'."
        ]

        return Response({
            "success": True,
            "data": {
                "title": title,
                "aspect_ratio": aspect_ratio,
                "theme": theme,
                "generated_prompts": prompts,
                "preview_card": {
                    "headline": title.upper(),
                    "badge": "2026 BLUEPRINT",
                    "aspect_ratio": aspect_ratio,
                    "bg_color": "#0f172a" if theme == 'dark_neon' else "#ffffff",
                    "text_color": "#38bdf8" if theme == 'dark_neon' else "#0f172a",
                    "accent_color": "#f59e0b"
                }
            },
            "message": "Thumbnail concept previews generated",
            "request_id": str(uuid.uuid4())
        })
