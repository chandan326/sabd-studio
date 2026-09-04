from django.urls import path
from apps.accounts.views import RegisterView, LoginView, RefreshView, LogoutView, GoogleLoginView

urlpatterns = [
    path('register', RegisterView.as_view(), name='auth-register'),
    path('login', LoginView.as_view(), name='auth-login'),
    path('refresh', RefreshView.as_view(), name='auth-refresh'),
    path('logout', LogoutView.as_view(), name='auth-logout'),
    path('google', GoogleLoginView.as_view(), name='auth-google'),
]
