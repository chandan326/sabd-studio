import uuid
from django.db import models
from django.conf import settings
from apps.workspaces.models import Workspace

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='audit_logs')
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=100) # campaign.created, asset.approved, schedule.created, etc.
    resource_type = models.CharField(max_length=100)
    resource_id = models.CharField(max_length=255)
    metadata_json = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

class APIUsage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='api_usages')
    provider = models.CharField(max_length=100) # openai, gemini, whisper, etc.
    operation = models.CharField(max_length=100) # generate_assets, transcribe, etc.
    input_tokens = models.IntegerField(default=0)
    output_tokens = models.IntegerField(default=0)
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=6, default=0.0)
    duration_ms = models.IntegerField(default=0)
    success = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
