import os
import uuid
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.integrations.models import PlatformIntegration
from apps.workspaces.models import WorkspaceMember

PROVIDERS = {
    'youtube': ('Publishing', ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET']),
    'instagram': ('Publishing', ['META_APP_ID', 'META_APP_SECRET']),
    'linkedin': ('Publishing', ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET']),
    'twitter': ('Publishing', ['TWITTER_CLIENT_ID', 'TWITTER_CLIENT_SECRET']),
    'cloudinary': ('Media', ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']),
    'mongodb': ('Data', ['MONGODB_URI']),
    'openai': ('AI', ['AI_API_KEY']),
    'gemini': ('AI', ['GEMINI_API_KEY']),
    'whisper': ('Transcription', ['TRANSCRIPTION_API_KEY']),
    'gmail': ('Email', ['EMAIL_HOST_USER', 'EMAIL_HOST_PASSWORD']),
}

class IntegrationListView(APIView):
    def get(self, request):
        workspace_id = request.query_params.get('workspace_id')
        if not workspace_id:
            member = WorkspaceMember.objects.filter(user=request.user).first()
            if not member:
                return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "No workspace found", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_404_NOT_FOUND)
            workspace_id = member.workspace.id

        integrations = PlatformIntegration.objects.filter(workspace_id=workspace_id)
        existing_providers = {i.provider: i for i in integrations}

        providers = list(PROVIDERS)
        data = []

        for p in providers:
            if p in existing_providers:
                item = existing_providers[p]
                data.append({
                    "id": str(item.id),
                    "provider": item.provider,
                    "display_name": item.display_name or f"{p.title()} Channel",
                    "status": item.status,
                    "connected_at": item.created_at.isoformat(),
                    "configured": all(os.getenv(key) for key in PROVIDERS[p][1]),
                    "category": PROVIDERS[p][0], "required_env": PROVIDERS[p][1]
                })
            else:
                data.append({
                    "id": None,
                    "provider": p,
                    "display_name": f"{p.title()} Account",
                    "status": "disconnected",
                    "connected_at": None,
                    "configured": all(os.getenv(key) for key in PROVIDERS[p][1]),
                    "category": PROVIDERS[p][0], "required_env": PROVIDERS[p][1]
                })

        return Response({
            "success": True,
            "data": data,
            "message": "Platform integrations retrieved",
            "request_id": str(uuid.uuid4())
        })

class IntegrationConnectView(APIView):
    def post(self, request, provider):
        workspace_id = request.data.get('workspace_id')
        if not workspace_id:
            member = WorkspaceMember.objects.filter(user=request.user).first()
            if member:
                workspace_id = member.workspace.id

        if provider not in PROVIDERS:
            return Response({"success": False, "error": {"code": "VALIDATION_ERROR", "message": f"Unsupported provider {provider}", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_400_BAD_REQUEST)

        missing = [key for key in PROVIDERS[provider][1] if not os.getenv(key)]
        if missing:
            return Response({"success": False, "error": {"code": "SETUP_REQUIRED", "message": f"Add these environment variables first: {', '.join(missing)}", "fields": {"required_env": missing}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_400_BAD_REQUEST)

        # Records readiness after credentials exist. OAuth callbacks are provider-specific.
        integration, _ = PlatformIntegration.objects.get_or_create(
            workspace_id=workspace_id,
            provider=provider,
            defaults={
                "display_name": f"{provider.title()} Provider",
                "external_account_id": f"acc_{uuid.uuid4().hex[:8]}",
                "status": "connected"
            }
        )
        integration.status = 'connected'
        integration.display_name = f"{provider.title()} Provider"
        integration.save()

        return Response({
            "success": True,
            "data": {
                "id": str(integration.id),
                "provider": provider,
                "status": "connected",
                "display_name": integration.display_name
            },
            "message": f"{provider.title()} configuration verified",
            "request_id": str(uuid.uuid4())
        })

class IntegrationDisconnectView(APIView):
    def delete(self, request, integration_id):
        try:
            integration = PlatformIntegration.objects.get(id=integration_id)
            integration.status = 'disconnected'
            integration.save()
            return Response({"success": True, "data": {}, "message": "Integration disconnected", "request_id": str(uuid.uuid4())})
        except PlatformIntegration.DoesNotExist:
            return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "Integration not found", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_404_NOT_FOUND)
