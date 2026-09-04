from django.urls import path
from apps.brands.views import BrandProfileView

urlpatterns = [
    path('', BrandProfileView.as_view(), name='brand-profile-detail'),
]
