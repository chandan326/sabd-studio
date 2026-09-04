from django.urls import path
from apps.seo.views import SEOAnalyseView

urlpatterns = [
    path('analyse', SEOAnalyseView.as_view(), name='seo-analyse'),
]
