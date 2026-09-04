from django.test import TestCase
from apps.accounts.models import User
from apps.workspaces.models import Workspace, WorkspaceMember
from apps.campaigns.models import Campaign
from apps.campaigns.services import run_campaign_pipeline
from rest_framework.test import APIClient

class CampaignPipelineTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="creator@creatorflow.ai", password="Password123!", full_name="Creator Test")
        self.workspace = Workspace.objects.create(name="Test Workspace", slug="test-ws", owner=self.user)
        WorkspaceMember.objects.create(workspace=self.workspace, user=self.user, role="Owner")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_campaign_creation_and_pipeline_execution(self):
        campaign = Campaign.objects.create(
            workspace=self.workspace,
            created_by=self.user,
            name="AI Web Dev 2026",
            source_type="text",
            source_text="Building modern full-stack web applications using AI agents and Django Next.js monorepo.",
            target_platforms=["youtube", "instagram", "linkedin", "twitter", "blog", "shorts"]
        )

        success = run_campaign_pipeline(campaign.id)
        self.assertTrue(success)
        
        campaign.refresh_from_db()
        self.assertEqual(campaign.status, 'completed')
        self.assertEqual(campaign.generated_assets.count(), 6)
        self.assertTrue(campaign.transcript is not None)
