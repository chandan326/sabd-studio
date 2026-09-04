import uuid
from django.db import models
from apps.workspaces.models import Workspace

class BrandProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.OneToOneField(Workspace, on_delete=models.CASCADE, related_name='brand_profile')
    brand_name = models.CharField(max_length=255, default='My Creator Brand')
    description = models.TextField(blank=True, default='')
    audience = models.CharField(max_length=255, default='General Tech & Business Creators')
    niche = models.CharField(max_length=255, default='Technology / Education')
    language = models.CharField(max_length=50, default='English')
    tone = models.CharField(max_length=100, default='Authoritative yet conversational and engaging')
    preferred_terms = models.TextField(blank=True, default='actionable, step-by-step, framework, breakdown')
    avoided_terms = models.TextField(blank=True, default='synergy, revolutionary, cheap hacks')
    content_goals = models.TextField(blank=True, default='Drive engagement, educate audience, build brand trust')
    sample_content = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Brand: {self.brand_name} ({self.workspace.name})"
