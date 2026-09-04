from django.urls import path
from apps.integrations.views import IntegrationListView, IntegrationConnectView, IntegrationDisconnectView

urlpatterns = [
    path('', IntegrationListView.as_view(), name='integration-list'),
    path('<str:provider>/connect', IntegrationConnectView.as_view(), name='integration-connect'),
    path('<uuid:integration_id>/disconnect', IntegrationDisconnectView.as_view(), name='integration-disconnect'),
]
