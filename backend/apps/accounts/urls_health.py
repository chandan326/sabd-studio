from django.urls import path
from apps.accounts.views import HealthCheckView

urlpatterns = [
    path('', HealthCheckView.as_view(), name='health'),
    path('live', HealthCheckView.as_view(), name='health-live'),
    path('ready', HealthCheckView.as_view(), name='health-ready'),
]
