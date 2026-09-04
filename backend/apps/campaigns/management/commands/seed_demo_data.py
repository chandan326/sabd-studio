import uuid
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.accounts.models import User
from apps.workspaces.models import Workspace, WorkspaceMember
from apps.brands.models import BrandProfile
from apps.campaigns.models import Campaign
from apps.campaigns.services import run_campaign_pipeline
from apps.scheduling.models import Schedule
from apps.assets.models import GeneratedAsset

class Command(BaseCommand):
    help = 'Seeds demo data for hackathon judges exploration.'

    def handle(self, *args, **options):
        self.stdout.write("Seeding CreatorFlow AI demo data...")

        # 1. Create or get Demo User
        user, created = User.objects.get_or_create(
            email='demo@creatorflow.ai',
            defaults={
                "full_name": "Alex Vance (Creator)",
                "email_verified": True,
                "is_active": True
            }
        )
        if created:
            user.set_password('password123')
            user.save()
            self.stdout.write(self.style.SUCCESS("Created demo user: demo@creatorflow.ai / password123"))
        else:
            self.stdout.write("Found existing demo user: demo@creatorflow.ai")

        # 2. Workspace & Member
        workspace, _ = Workspace.objects.get_or_create(
            slug='creatorflow-demo-workspace',
            defaults={
                "name": "Alex's Creator Studio",
                "owner": user,
                "plan": "Pro"
            }
        )
        WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            user=user,
            defaults={"role": "Owner", "status": "Active"}
        )

        # 3. Brand Profile
        BrandProfile.objects.get_or_create(
            workspace=workspace,
            defaults={
                "brand_name": "TechFlow Media",
                "description": "Empowering creators with AI tools and high-impact workflows.",
                "audience": "YouTubers, Freelancers, Marketing Agencies",
                "niche": "AI & Software Development",
                "language": "English",
                "tone": "Authoritative, engaging, and action-oriented",
                "preferred_terms": "actionable, framework, blueprint, automation",
                "avoided_terms": "cheap tricks, magic bullet, hype"
            }
        )

        # 4. Create Seed Campaign
        campaign, c_created = Campaign.objects.get_or_create(
            name="CreatorFlow AI Launch: From One Idea to Entire Pipeline",
            workspace=workspace,
            defaults={
                "created_by": user,
                "source_type": "text",
                "source_text": "Building a production-ready AI content pipeline application that automates YouTube, Instagram, LinkedIn, Twitter, Blog, and Shorts asset generation from a single transcript or topic idea.",
                "target_platforms": ["youtube", "instagram", "linkedin", "twitter", "blog", "shorts"],
                "tone": "Authoritative & Action-Oriented",
                "target_audience": "Content Creators & Digital Entrepreneurs"
            }
        )

        if c_created or campaign.generated_assets.count() == 0:
            self.stdout.write("Running AI pipeline for seed campaign...")
            run_campaign_pipeline(campaign.id)

        # 5. Create Schedules for Calendar
        for asset in campaign.generated_assets.all():
            Schedule.objects.get_or_create(
                asset=asset,
                defaults={
                    "scheduled_for": timezone.now() + timezone.timedelta(days=2),
                    "status": "scheduled"
                }
            )

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully! You can log in with: demo@creatorflow.ai / password123"))
