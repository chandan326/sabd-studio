import jwt
import uuid
from django.db import transaction
from django.conf import settings
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.accounts.models import User
from apps.accounts.authentication import generate_tokens_for_user
from apps.workspaces.models import Workspace, WorkspaceMember


def _auth_response(user, message="Login successful"):
    workspace, _ = Workspace.objects.get_or_create(
        owner=user,
        defaults={"name": f"{user.full_name}'s Workspace", "slug": f"ws-{user.id.hex[:8]}"},
    )
    member, _ = WorkspaceMember.objects.get_or_create(
        workspace=workspace, user=user, defaults={"role": "Owner", "status": "Active"}
    )
    access_token, refresh_token = generate_tokens_for_user(user)
    response = Response({
        "success": True,
        "data": {
            "user": {"id": str(user.id), "email": user.email, "full_name": user.full_name,
                     "avatar": user.avatar, "email_verified": user.email_verified},
            "workspace": {"id": str(workspace.id), "name": workspace.name,
                          "slug": workspace.slug, "role": member.role},
            "access_token": access_token,
        },
        "message": message,
        "request_id": str(uuid.uuid4()),
    })
    cookie_secure = not settings.DEBUG
    response.set_cookie('access_token', access_token, httponly=True, secure=cookie_secure, samesite='Lax')
    response.set_cookie('refresh_token', refresh_token, httponly=True, secure=cookie_secure, samesite='Lax')
    return response


class GoogleLoginView(APIView):
    """Verify a Google Identity Services credential and issue app JWTs."""

    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def post(self, request):
        credential = request.data.get('credential', '')
        if not credential or not settings.GOOGLE_CLIENT_ID:
            return Response({"success": False, "error": {"code": "GOOGLE_AUTH_UNAVAILABLE",
                "message": "Google authentication is not configured.", "fields": {}},
                "request_id": str(uuid.uuid4())}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        try:
            from google.auth.transport import requests as google_requests
            from google.oauth2 import id_token
            claims = id_token.verify_oauth2_token(
                credential, google_requests.Request(), settings.GOOGLE_CLIENT_ID
            )
            if not claims.get('email_verified'):
                raise ValueError('Email is not verified')
            email = claims['email'].strip().lower()
            user, _ = User.objects.get_or_create(email=email, defaults={
                'full_name': claims.get('name') or email.split('@')[0],
                'avatar': claims.get('picture', ''),
                'email_verified': True,
            })
            changed = False
            if not user.email_verified:
                user.email_verified = True
                changed = True
            if claims.get('picture') and not user.avatar:
                user.avatar = claims['picture']
                changed = True
            if changed:
                user.save(update_fields=['email_verified', 'avatar', 'updated_at'])
            return _auth_response(user, "Google login successful")
        except (ValueError, KeyError):
            return Response({"success": False, "error": {"code": "INVALID_GOOGLE_TOKEN",
                "message": "Google sign-in could not be verified.", "fields": {}},
                "request_id": str(uuid.uuid4())}, status=status.HTTP_401_UNAUTHORIZED)

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')
        full_name = request.data.get('full_name', '').strip()

        if not email or not password or not full_name:
            return Response({
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Email, password, and full_name are required.",
                    "fields": {}
                },
                "request_id": str(uuid.uuid4())
            }, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({
                "success": False,
                "error": {
                    "code": "ALREADY_EXISTS",
                    "message": "A user with this email address already exists.",
                    "fields": {"email": ["Email already registered"]}
                },
                "request_id": str(uuid.uuid4())
            }, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(email=email, password=password, full_name=full_name, email_verified=True)

        # Automatically create default workspace for user
        ws_name = f"{full_name}'s Workspace"
        slug = f"ws-{user.id.hex[:8]}"
        workspace = Workspace.objects.create(name=ws_name, slug=slug, owner=user)
        WorkspaceMember.objects.create(workspace=workspace, user=user, role='Owner', status='Active')

        access_token, refresh_token = generate_tokens_for_user(user)

        res = Response({
            "success": True,
            "data": {
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "full_name": user.full_name,
                    "email_verified": user.email_verified,
                },
                "workspace": {
                    "id": str(workspace.id),
                    "name": workspace.name,
                    "slug": workspace.slug,
                    "role": "Owner"
                },
                "access_token": access_token
            },
            "message": "User registered successfully",
            "request_id": str(uuid.uuid4())
        }, status=status.HTTP_201_CREATED)

        res.set_cookie('access_token', access_token, httponly=True, samesite='Lax')
        res.set_cookie('refresh_token', refresh_token, httponly=True, samesite='Lax')
        return res

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                "success": False,
                "error": {
                    "code": "INVALID_CREDENTIALS",
                    "message": "Invalid email or password.",
                    "fields": {}
                },
                "request_id": str(uuid.uuid4())
            }, status=status.HTTP_401_UNAUTHORIZED)

        if not user.check_password(password):
            return Response({
                "success": False,
                "error": {
                    "code": "INVALID_CREDENTIALS",
                    "message": "Invalid email or password.",
                    "fields": {}
                },
                "request_id": str(uuid.uuid4())
            }, status=status.HTTP_401_UNAUTHORIZED)

        access_token, refresh_token = generate_tokens_for_user(user)

        # Get default or first workspace
        member = WorkspaceMember.objects.filter(user=user).first()
        workspace_data = None
        if member:
            workspace_data = {
                "id": str(member.workspace.id),
                "name": member.workspace.name,
                "slug": member.workspace.slug,
                "role": member.role
            }

        res = Response({
            "success": True,
            "data": {
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "full_name": user.full_name,
                    "email_verified": user.email_verified,
                },
                "workspace": workspace_data,
                "access_token": access_token
            },
            "message": "Login successful",
            "request_id": str(uuid.uuid4())
        })

        res.set_cookie('access_token', access_token, httponly=True, samesite='Lax')
        res.set_cookie('refresh_token', refresh_token, httponly=True, samesite='Lax')
        return res

class RefreshView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh_token') or request.COOKIES.get('refresh_token')
        if not refresh_token:
            return Response({
                "success": False,
                "error": {"code": "UNAUTHORIZED", "message": "Refresh token missing", "fields": {}},
                "request_id": str(uuid.uuid4())
            }, status=status.HTTP_401_UNAUTHORIZED)

        try:
            signing_key = getattr(settings, 'SECRET_KEY', 'secret')
            payload = jwt.decode(refresh_token, signing_key, algorithms=['HS256'])
            user = User.objects.get(id=payload['user_id'], is_active=True)
            access_token, new_refresh_token = generate_tokens_for_user(user)

            res = Response({
                "success": True,
                "data": {"access_token": access_token},
                "message": "Token refreshed",
                "request_id": str(uuid.uuid4())
            })
            res.set_cookie('access_token', access_token, httponly=True, samesite='Lax')
            res.set_cookie('refresh_token', new_refresh_token, httponly=True, samesite='Lax')
            return res
        except Exception:
            return Response({
                "success": False,
                "error": {"code": "UNAUTHORIZED", "message": "Invalid refresh token", "fields": {}},
                "request_id": str(uuid.uuid4())
            }, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    def post(self, request):
        res = Response({
            "success": True,
            "data": {},
            "message": "Logged out successfully",
            "request_id": str(uuid.uuid4())
        })
        res.delete_cookie('access_token')
        res.delete_cookie('refresh_token')
        return res

class MeView(APIView):
    def get(self, request):
        user = request.user
        memberships = WorkspaceMember.objects.filter(user=user).select_related('workspace')
        workspaces = [{
            "id": str(m.workspace.id),
            "name": m.workspace.name,
            "slug": m.workspace.slug,
            "role": m.role,
            "timezone": m.workspace.timezone
        } for m in memberships]

        return Response({
            "success": True,
            "data": {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "avatar": user.avatar,
                "email_verified": user.email_verified,
                "workspaces": workspaces
            },
            "message": "User details retrieved",
            "request_id": str(uuid.uuid4())
        })

class HealthCheckView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            "status": "healthy",
            "app": "CreatorFlow AI API",
            "version": "1.0.0"
        })
