import uuid
from django.db import models
from apps.workspaces.models import Workspace

class PlatformIntegration(models.Model):
    PROVIDER_CHOICES = [
        ('youtube', 'YouTube'),
        ('instagram', 'Instagram / Meta'),
        ('linkedin', 'LinkedIn'),
        ('twitter', 'X / Twitter'),
        ('cloudinary', 'Cloudinary'),
        ('mongodb', 'MongoDB'),
        ('openai', 'OpenAI'),
        ('gemini', 'Google Gemini'),
        ('whisper', 'Whisper'),
        ('elevenlabs', 'ElevenLabs'),
        ('gmail', 'Gmail SMTP'),
    ]

    STATUS_CHOICES = [
        ('connected', 'Connected'),
        ('disconnected', 'Disconnected'),
        ('expired', 'Token Expired'),
        ('error', 'Configuration Error'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='integrations')
    provider = models.CharField(max_length=50, choices=PROVIDER_CHOICES)
    external_account_id = models.CharField(max_length=255, blank=True, default='')
    display_name = models.CharField(max_length=255, blank=True, default='')
    encrypted_access_token = models.TextField(blank=True, default='')
    encrypted_refresh_token = models.TextField(blank=True, default='')
    token_expires_at = models.DateTimeField(null=True, blank=True)
    scopes = models.JSONField(default=list)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='disconnected')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('workspace', 'provider')

    def __str__(self):
        return f"{self.provider} - {self.workspace.name} ({self.status})"
