import uuid
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.brands.models import BrandProfile
from apps.workspaces.models import WorkspaceMember

class BrandProfileView(APIView):
    def get(self, request):
        workspace_id = request.query_params.get('workspace_id')
        if not workspace_id:
            member = WorkspaceMember.objects.filter(user=request.user).first()
            if not member:
                return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "No active workspace found", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_404_NOT_FOUND)
            workspace_id = member.workspace.id

        # Workspace isolation
        if not WorkspaceMember.objects.filter(workspace_id=workspace_id, user=request.user).exists():
            return Response({"success": False, "error": {"code": "FORBIDDEN", "message": "Access denied to workspace", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_403_FORBIDDEN)

        profile, _ = BrandProfile.objects.get_or_create(workspace_id=workspace_id)
        return Response({
            "success": True,
            "data": {
                "id": str(profile.id),
                "workspace_id": str(profile.workspace.id),
                "brand_name": profile.brand_name,
                "description": profile.description,
                "audience": profile.audience,
                "niche": profile.niche,
                "language": profile.language,
                "tone": profile.tone,
                "preferred_terms": profile.preferred_terms,
                "avoided_terms": profile.avoided_terms,
                "content_goals": profile.content_goals,
                "sample_content": profile.sample_content,
            },
            "message": "Brand profile retrieved",
            "request_id": str(uuid.uuid4())
        })

    def put(self, request):
        workspace_id = request.data.get('workspace_id') or request.query_params.get('workspace_id')
        if not workspace_id:
            member = WorkspaceMember.objects.filter(user=request.user).first()
            if not member:
                return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "No active workspace found", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_404_NOT_FOUND)
            workspace_id = member.workspace.id

        if not WorkspaceMember.objects.filter(workspace_id=workspace_id, user=request.user, role__in=['Owner', 'Admin', 'Editor']).exists():
            return Response({"success": False, "error": {"code": "FORBIDDEN", "message": "Permission denied to edit brand profile", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_403_FORBIDDEN)

        profile, _ = BrandProfile.objects.get_or_create(workspace_id=workspace_id)

        for field in ['brand_name', 'description', 'audience', 'niche', 'language', 'tone', 'preferred_terms', 'avoided_terms', 'content_goals', 'sample_content']:
            if field in request.data:
                setattr(profile, field, request.data[field])

        profile.save()

        return Response({
            "success": True,
            "data": {
                "id": str(profile.id),
                "brand_name": profile.brand_name,
                "tone": profile.tone,
                "audience": profile.audience
            },
            "message": "Brand profile updated successfully",
            "request_id": str(uuid.uuid4())
        })
