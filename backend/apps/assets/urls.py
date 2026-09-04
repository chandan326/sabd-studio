from django.urls import path
from apps.assets.views import (
    AssetListView, AssetDetailView, AssetApproveView, AssetRegenerateView, AssetVersionsView
)

urlpatterns = [
    path('', AssetListView.as_view(), name='asset-list'),
    path('<uuid:asset_id>', AssetDetailView.as_view(), name='asset-detail'),
    path('<uuid:asset_id>/approve', AssetApproveView.as_view(), name='asset-approve'),
    path('<uuid:asset_id>/regenerate', AssetRegenerateView.as_view(), name='asset-regenerate'),
    path('<uuid:asset_id>/versions', AssetVersionsView.as_view(), name='asset-versions'),
]
