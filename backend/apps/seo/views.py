import uuid
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.assets.models import GeneratedAsset
from apps.seo.services import SEOService

class SEOAnalyseView(APIView):
    def post(self, request):
        asset_id = request.data.get('asset_id')
        if asset_id:
            try:
                asset = GeneratedAsset.objects.get(id=asset_id)
                analysis = SEOService.calculate_and_save_seo(asset)
                return Response({
                    "success": True,
                    "data": {
                        "asset_id": str(asset.id),
                        "overall_score": analysis.overall_score,
                        "checks": analysis.checks_json,
                        "recommendations": analysis.recommendations_json
                    },
                    "message": "SEO analysis calculated",
                    "request_id": str(uuid.uuid4())
                })
            except GeneratedAsset.DoesNotExist:
                return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "Asset not found", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_404_NOT_FOUND)

        # Ad-hoc text input analysis
        title = request.data.get('title', '')
        content = request.data.get('content', '')
        platform = request.data.get('platform', 'youtube')

        dummy_asset = GeneratedAsset(title=title, content=content, platform=platform, metadata_json=request.data.get('metadata', {}))
        analysis = SEOService.calculate_and_save_seo(dummy_asset)

        return Response({
            "success": True,
            "data": {
                "overall_score": analysis.overall_score,
                "checks": analysis.checks_json,
                "recommendations": analysis.recommendations_json
            },
            "message": "Ad-hoc SEO analysis calculated",
            "request_id": str(uuid.uuid4())
        })
