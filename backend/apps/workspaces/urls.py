from django.urls import path
from apps.workspaces.views import WorkspaceListCreateView, WorkspaceMemberView

urlpatterns = [
    path('', WorkspaceListCreateView.as_view(), name='workspace-list-create'),
    path('<uuid:workspace_id>/members', WorkspaceMemberView.as_view(), name='workspace-members'),
]
