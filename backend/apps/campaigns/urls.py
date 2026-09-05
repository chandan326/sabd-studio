from django.urls import path
from apps.campaigns.views import (
    CampaignListCreateView, CampaignDetailView, CampaignUploadView,
    CampaignProcessView, CampaignStatusView, CampaignTranscriptView, CampaignExportView,
    CampaignMediaView
)

urlpatterns = [
    path('', CampaignListCreateView.as_view(), name='campaign-list-create'),
    path('<uuid:campaign_id>', CampaignDetailView.as_view(), name='campaign-detail'),
    path('<uuid:campaign_id>/upload', CampaignUploadView.as_view(), name='campaign-upload'),
    path('<uuid:campaign_id>/process', CampaignProcessView.as_view(), name='campaign-process'),
    path('<uuid:campaign_id>/status', CampaignStatusView.as_view(), name='campaign-status'),
    path('<uuid:campaign_id>/transcript', CampaignTranscriptView.as_view(), name='campaign-transcript'),
    path('<uuid:campaign_id>/export', CampaignExportView.as_view(), name='campaign-export'),
    path('<uuid:campaign_id>/media', CampaignMediaView.as_view(), name='campaign-media'),
]
