import uuid
from django.db import models
from django.conf import settings
from apps.workspaces.models import Workspace

class Campaign(models.Model):
    SOURCE_TYPE_CHOICES = [
        ('text', 'Text Topic/Idea'),
        ('transcript', 'Raw Transcript'),
        ('video', 'Video File'),
        ('audio', 'Audio File'),
        ('document', 'Document (PDF/DOCX/TXT)'),
        ('url', 'Public URL Import'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('uploading', 'Uploading'),
        ('extracting', 'Extracting'),
        ('transcribing', 'Transcribing'),
        ('analysing', 'Analysing'),
        ('generating', 'Generating Assets'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='campaigns')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_campaigns')
    name = models.CharField(max_length=255)
    source_type = models.CharField(max_length=50, choices=SOURCE_TYPE_CHOICES, default='text')
    source_text = models.TextField(blank=True, default='')
    source_url = models.URLField(blank=True, default='')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='draft')
    target_platforms = models.JSONField(default=list) # e.g. ["youtube", "instagram", "linkedin", "twitter", "blog", "shorts"]
    target_audience = models.CharField(max_length=255, blank=True, default='')
    language = models.CharField(max_length=50, default='English')
    tone = models.CharField(max_length=100, default='Professional & Engaging')
    error_message = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.status})"

class SourceAsset(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='source_assets')
    original_filename = models.CharField(max_length=255)
    storage_key = models.CharField(max_length=500)
    mime_type = models.CharField(max_length=100)
    file_size = models.BigIntegerField(default=0)
    checksum = models.CharField(max_length=100, blank=True, default='')
    processing_status = models.CharField(max_length=50, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

class ProcessingJob(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='processing_jobs')
    job_type = models.CharField(max_length=100, default='pipeline_all')
    status = models.CharField(max_length=50, default='pending') # pending, processing, completed, failed
    progress = models.IntegerField(default=0) # 0 to 100
    current_stage = models.CharField(max_length=100, default='Initializing')
    provider = models.CharField(max_length=100, default='deterministic')
    attempts = models.IntegerField(default=0)
    error_code = models.CharField(max_length=100, blank=True, default='')
    safe_error_message = models.TextField(blank=True, default='')
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
