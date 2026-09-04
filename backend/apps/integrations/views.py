import uuid
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.integrations.models import PlatformIntegration
from apps.workspaces.models import WorkspaceMember

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

        providers = ['youtube', 'instagram', 'linkedin', 'twitter']
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
                    "configured": True
                })
            else:
                data.append({
                    "id": None,
                    "provider": p,
                    "display_name": f"{p.title()} Account",
                    "status": "disconnected",
                    "connected_at": None,
                    "configured": False
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

        if provider not in ['youtube', 'instagram', 'linkedin', 'twitter']:
            return Response({"success": False, "error": {"code": "VALIDATION_ERROR", "message": f"Unsupported provider {provider}", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_400_BAD_REQUEST)

        # Mock / Demo OAuth connection handler
        integration, _ = PlatformIntegration.objects.get_or_create(
            workspace_id=workspace_id,
            provider=provider,
            defaults={
                "display_name": f"Demo {provider.title()} Channel",
                "external_account_id": f"acc_{uuid.uuid4().hex[:8]}",
                "status": "connected"
            }
        )
        integration.status = 'connected'
        integration.display_name = f"Demo {provider.title()} Account"
        integration.save()

        return Response({
            "success": True,
            "data": {
                "id": str(integration.id),
                "provider": provider,
                "status": "connected",
                "display_name": integration.display_name
            },
            "message": f"Connected to {provider.title()} successfully (Demo API Mode)",
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
