import uuid
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.audit.models import AuditLog
from apps.workspaces.models import WorkspaceMember

class AuditLogListView(APIView):
    def get(self, request):
        workspace_id = request.query_params.get('workspace_id')
        if not workspace_id:
            member = WorkspaceMember.objects.filter(user=request.user).first()
            if not member:
                return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "No workspace found", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_404_NOT_FOUND)
            workspace_id = member.workspace.id

        if not WorkspaceMember.objects.filter(workspace_id=workspace_id, user=request.user).exists():
            return Response({"success": False, "error": {"code": "FORBIDDEN", "message": "Access denied", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_403_FORBIDDEN)

        logs = AuditLog.objects.filter(workspace_id=workspace_id).select_related('actor')[:50]
        data = [{
            "id": str(l.id),
            "actor": l.actor.email if l.actor else "System",
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "metadata": l.metadata_json,
            "ip_address": l.ip_address,
            "created_at": l.created_at.isoformat()
        } for l in logs]

        return Response({
            "success": True,
            "data": data,
            "message": "Audit logs retrieved",
            "request_id": str(uuid.uuid4())
        })
