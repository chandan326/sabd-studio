from django.test import TestCase
from apps.assets.models import GeneratedAsset
from apps.campaigns.models import Campaign
from apps.workspaces.models import Workspace
from apps.accounts.models import User
from apps.seo.services import SEOService

class SEOServiceTestCase(TestCase):
    def test_seo_score_calculation(self):
        user = User.objects.create_user(email="seo@creatorflow.ai", password="Password123!", full_name="SEO Tester")
        workspace = Workspace.objects.create(name="SEO Workspace", slug="seo-ws", owner=user)
        campaign = Campaign.objects.create(workspace=workspace, created_by=user, name="SEO Campaign")

        asset = GeneratedAsset.objects.create(
            campaign=campaign,
            platform="youtube",
            title="How to Build an AI Content Engine in 2026: Complete Step-by-Step Guide",
            content="""In this comprehensive breakdown, we explore everything you need to know about AI content engines.

📌 WHAT YOU WILL LEARN:
• The fundamental principles of content automation
• 3 critical mistakes to avoid
• Step-by-step implementation blueprint

💡 Don't forget to Like, Subscribe, and hit the Notification Bell for weekly updates!""",
            metadata_json={"keywords": ["AI content engine", "automation"], "tags": ["ai", "creator"], "hashtags": ["#AI", "#CreatorFlow"]}
        )

        analysis = SEOService.calculate_and_save_seo(asset)
        self.assertGreaterEqual(analysis.overall_score, 70)
        self.assertEqual(len(analysis.checks_json), 8)
