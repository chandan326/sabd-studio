import uuid
from django.db import models
from apps.campaigns.models import Campaign

class Transcript(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    campaign = models.OneToOneField(Campaign, on_delete=models.CASCADE, related_name='transcript')
    text = models.TextField()
    language = models.CharField(max_length=50, default='en')
    segments_json = models.JSONField(default=list) # [{start: 0, end: 5, text: "..."}]
    edited_text = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_effective_text(self):
        return self.edited_text if self.edited_text.strip() else self.text
