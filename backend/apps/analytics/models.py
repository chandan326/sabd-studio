import uuid
from django.db import models
from apps.workspaces.models import Workspace
from apps.assets.models import GeneratedAsset

class AnalyticsSnapshot(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='analytics_snapshots')
    asset = models.ForeignKey(GeneratedAsset, on_delete=models.SET_NULL, null=True, blank=True, related_name='analytics')
    provider = models.CharField(max_length=50) # youtube, instagram, linkedin, twitter, blog
    metric_date = models.DateField()
    impressions = models.IntegerField(default=0)
    views = models.IntegerField(default=0)
    likes = models.IntegerField(default=0)
    comments = models.IntegerField(default=0)
    shares = models.IntegerField(default=0)
    saves = models.IntegerField(default=0)
    watch_time = models.IntegerField(default=0) # seconds
    clicks = models.IntegerField(default=0)
    followers_gained = models.IntegerField(default=0)
    raw_data_json = models.JSONField(default=dict)
    is_demo_data = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def calculate_engagement_rate(self):
        total_interactions = self.likes + self.comments + self.shares + self.saves
        base = self.impressions or self.views or 1
        return round((total_interactions / base) * 100, 2)
