from django.urls import path
from apps.analytics.views import AIRecommendationsView

urlpatterns = [
    path('', AIRecommendationsView.as_view(), name='recommendations-list'),
]
