from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # OpenAPI Schema & Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # API v1 Router Endpoints
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/users/', include('apps.accounts.urls_users')),
    path('api/v1/workspaces/', include('apps.workspaces.urls')),
    path('api/v1/brand-profile/', include('apps.brands.urls')),
    path('api/v1/campaigns/', include('apps.campaigns.urls')),
    path('api/v1/assets/', include('apps.assets.urls')),
    path('api/v1/seo/', include('apps.seo.urls')),
    path('api/v1/thumbnails/', include('apps.assets.urls_thumbnails')),
    path('api/v1/schedules/', include('apps.scheduling.urls')),
    path('api/v1/integrations/', include('apps.integrations.urls')),
    path('api/v1/analytics/', include('apps.analytics.urls')),
    path('api/v1/recommendations/', include('apps.analytics.urls_recommendations')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/audit-logs/', include('apps.audit.urls')),
    path('api/v1/health/', include('apps.accounts.urls_health')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
