import uuid
from django.db import models
from django.conf import settings

class Workspace(models.Model):
    PLAN_CHOICES = [('Free', 'Free'), ('Pro', 'Pro'), ('Agency', 'Agency')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, db_index=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_workspaces')
    plan = models.CharField(max_length=50, choices=PLAN_CHOICES, default='Pro')
    timezone = models.CharField(max_length=50, default='UTC')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class WorkspaceMember(models.Model):
    ROLE_CHOICES = [('Owner', 'Owner'), ('Admin', 'Admin'), ('Editor', 'Editor'), ('Viewer', 'Viewer')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='workspace_memberships')
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='Editor')
    invited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_invites')
    status = models.CharField(max_length=50, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('workspace', 'user')

    def __str__(self):
        return f"{self.user.email} - {self.workspace.name} ({self.role})"
