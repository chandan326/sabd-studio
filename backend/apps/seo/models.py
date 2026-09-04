import uuid
from django.db import models
from apps.assets.models import GeneratedAsset

class SEOAnalysis(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    asset = models.ForeignKey(GeneratedAsset, on_delete=models.CASCADE, related_name='seo_analyses')
    overall_score = models.IntegerField(default=0) # 0 to 100
    checks_json = models.JSONField(default=list) # [{rule: "title_length", status: "pass", score: 15, message: "..."}]
    recommendations_json = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"SEO Score: {self.overall_score}/100 for {self.asset.id}"
