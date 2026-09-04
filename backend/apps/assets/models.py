import uuid
from django.db import models
from django.conf import settings
from apps.campaigns.models import Campaign

class GeneratedAsset(models.Model):
    PLATFORM_CHOICES = [
        ('youtube', 'YouTube'),
        ('instagram', 'Instagram'),
        ('linkedin', 'LinkedIn'),
        ('twitter', 'X/Twitter'),
        ('blog', 'Blog'),
        ('shorts', 'Short-form Video'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft / Reviewing'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='generated_assets')
    platform = models.CharField(max_length=50, choices=PLATFORM_CHOICES)
    asset_type = models.CharField(max_length=100) # title_pack, description, caption_pack, thread, blog_draft, short_script, etc.
    title = models.CharField(max_length=255, blank=True, default='')
    content = models.TextField()
    metadata_json = models.JSONField(default=dict) # hashtags, keywords, timestamps, thumbnail_prompts, etc.
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='draft')
    current_version = models.IntegerField(default=1)
    created_by_ai = models.BooleanField(default=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.platform.upper()} - {self.asset_type} ({self.status})"

class AssetVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    asset = models.ForeignKey(GeneratedAsset, on_delete=models.CASCADE, related_name='versions')
    version_number = models.IntegerField()
    content = models.TextField()
    metadata_json = models.JSONField(default=dict)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-version_number']
