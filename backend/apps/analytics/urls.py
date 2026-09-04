from django.urls import path
from apps.analytics.views import AnalyticsOverviewView

urlpatterns = [
    path('overview', AnalyticsOverviewView.as_view(), name='analytics-overview'),
]
