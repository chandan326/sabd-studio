from django.urls import path
from apps.accounts.views import HealthCheckView

urlpatterns = [
    path('live', HealthCheckView.as_view(), name='health-live'),
    path('ready', HealthCheckView.as_view(), name='health-ready'),
]
