import os
import jwt
import uuid
from datetime import datetime, timedelta
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from apps.accounts.models import User

def generate_tokens_for_user(user):
    access_expiry = datetime.utcnow() + timedelta(minutes=int(os.getenv('JWT_ACCESS_TOKEN_MINUTES', '60')))
    refresh_expiry = datetime.utcnow() + timedelta(days=int(os.getenv('JWT_REFRESH_TOKEN_DAYS', '7')))
    
    signing_key = getattr(settings, 'SECRET_KEY', 'secret')
    
    access_token = jwt.encode({
        'user_id': str(user.id),
        'email': user.email,
        'exp': access_expiry,
        'type': 'access'
    }, signing_key, algorithm='HS256')

    refresh_token = jwt.encode({
        'user_id': str(user.id),
        'exp': refresh_expiry,
        'type': 'refresh'
    }, signing_key, algorithm='HS256')

    return access_token, refresh_token

class JWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        header = request.headers.get('Authorization')
        token = None

        if header and header.startswith('Bearer '):
            token = header.split(' ')[1]
        elif 'access_token' in request.COOKIES:
            token = request.COOKIES.get('access_token')

        if not token:
            return None

        try:
            signing_key = getattr(settings, 'SECRET_KEY', 'secret')
            payload = jwt.decode(token, signing_key, algorithms=['HS256'])
            if payload.get('type') != 'access':
                raise AuthenticationFailed('Invalid token type')

            user_id = payload.get('user_id')
            user = User.objects.get(id=user_id, is_active=True)
            return (user, token)
        except (jwt.ExpiredSignatureError, jwt.DecodeError, User.DoesNotExist):
            raise AuthenticationFailed('Invalid or expired authentication token')
