from django.urls import path
from apps.assets.views import ThumbnailGenerateView

urlpatterns = [
    path('generate', ThumbnailGenerateView.as_view(), name='thumbnails-generate'),
]
