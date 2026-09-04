import uuid
from django.db import models
from apps.assets.models import GeneratedAsset

class Schedule(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('publishing', 'Publishing In Progress'),
        ('published', 'Published'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    asset = models.ForeignKey(GeneratedAsset, on_delete=models.CASCADE, related_name='schedules')
    integration_id = models.UUIDField(null=True, blank=True)
    scheduled_for = models.DateTimeField()
    timezone = models.CharField(max_length=50, default='UTC')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='scheduled')
    external_post_id = models.CharField(max_length=255, blank=True, default='')
    failure_reason = models.TextField(blank=True, default='')
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Schedule {self.asset.platform} at {self.scheduled_for} ({self.status})"
