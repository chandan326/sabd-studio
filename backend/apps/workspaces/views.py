import uuid
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.workspaces.models import Workspace, WorkspaceMember
from apps.accounts.models import User

class WorkspaceListCreateView(APIView):
    def get(self, request):
        memberships = WorkspaceMember.objects.filter(user=request.user).select_related('workspace')
        data = [{
            "id": str(m.workspace.id),
            "name": m.workspace.name,
            "slug": m.workspace.slug,
            "plan": m.workspace.plan,
            "role": m.role,
            "timezone": m.workspace.timezone,
            "created_at": m.workspace.created_at.isoformat()
        } for m in memberships]
        return Response({
            "success": True,
            "data": data,
            "message": "Workspaces listed",
            "request_id": str(uuid.uuid4())
        })

    def post(self, request):
        name = request.data.get('name', '').strip()
        if not name:
            return Response({
                "success": False,
                "error": {"code": "VALIDATION_ERROR", "message": "Workspace name is required", "fields": {}},
                "request_id": str(uuid.uuid4())
            }, status=status.HTTP_400_BAD_REQUEST)

        slug = f"ws-{uuid.uuid4().hex[:8]}"
        workspace = Workspace.objects.create(name=name, slug=slug, owner=request.user)
        member = WorkspaceMember.objects.create(workspace=workspace, user=request.user, role='Owner', status='Active')

        return Response({
            "success": True,
            "data": {
                "id": str(workspace.id),
                "name": workspace.name,
                "slug": workspace.slug,
                "role": member.role,
                "plan": workspace.plan
            },
            "message": "Workspace created successfully",
            "request_id": str(uuid.uuid4())
        }, status=status.HTTP_201_CREATED)

class WorkspaceMemberView(APIView):
    def get(self, request, workspace_id):
        # Isolation check
        if not WorkspaceMember.objects.filter(workspace_id=workspace_id, user=request.user).exists():
            return Response({
                "success": False,
                "error": {"code": "FORBIDDEN", "message": "Access denied to this workspace", "fields": {}},
                "request_id": str(uuid.uuid4())
            }, status=status.HTTP_403_FORBIDDEN)

        members = WorkspaceMember.objects.filter(workspace_id=workspace_id).select_related('user')
        data = [{
            "id": str(m.id),
            "user_id": str(m.user.id),
            "email": m.user.email,
            "full_name": m.user.full_name,
            "role": m.role,
            "status": m.status,
            "joined_at": m.created_at.isoformat()
        } for m in members]

        return Response({
            "success": True,
            "data": data,
            "message": "Workspace members retrieved",
            "request_id": str(uuid.uuid4())
        })

    def post(self, request, workspace_id):
        # Invite member
        my_membership = WorkspaceMember.objects.filter(workspace_id=workspace_id, user=request.user).first()
        if not my_membership or my_membership.role not in ['Owner', 'Admin']:
            return Response({
                "success": False,
                "error": {"code": "FORBIDDEN", "message": "Only Workspace Owner or Admin can invite members", "fields": {}},
                "request_id": str(uuid.uuid4())
            }, status=status.HTTP_403_FORBIDDEN)

        email = request.data.get('email', '').strip().lower()
        role = request.data.get('role', 'Editor')
        if role not in ['Admin', 'Editor', 'Viewer']:
            role = 'Editor'

        try:
            target_user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                "success": False,
                "error": {"code": "NOT_FOUND", "message": f"User with email {email} is not registered yet.", "fields": {}},
                "request_id": str(uuid.uuid4())
            }, status=status.HTTP_404_NOT_FOUND)

        member, created = WorkspaceMember.objects.get_or_create(
            workspace_id=workspace_id,
            user=target_user,
            defaults={"role": role, "invited_by": request.user, "status": "Active"}
        )

        if not created:
            member.role = role
            member.save()

        return Response({
            "success": True,
            "data": {
                "id": str(member.id),
                "email": target_user.email,
                "role": member.role,
                "status": member.status
            },
            "message": "Member invited/updated in workspace",
            "request_id": str(uuid.uuid4())
        })
