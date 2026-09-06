import os
from pathlib import Path
from datetime import timedelta
import dotenv
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

dotenv.load_dotenv(os.path.join(BASE_DIR.parent, '.env'))

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-local-development-only')

APP_ENV = os.getenv('APP_ENV', 'development').lower()
DEBUG = os.getenv('DEBUG', 'true' if APP_ENV == 'development' else 'false').lower() == 'true'

configured_hosts = [
    h.strip() for h in os.getenv('ALLOWED_HOSTS', '').split(',') if h.strip()
]
# Keep platform hosts available even when ALLOWED_HOSTS is supplied in Vercel.
# A stale dashboard value must not make every Django route return HTTP 400.
ALLOWED_HOSTS = list(dict.fromkeys([
    *configured_hosts,
    'localhost',
    '127.0.0.1',
    '.vercel.app',
    os.getenv('VERCEL_URL', '').strip(),
]))
ALLOWED_HOSTS = [host for host in ALLOWED_HOSTS if host]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party apps
    'rest_framework',
    'corsheaders',
    'drf_spectacular',

    # CreatorFlow Apps
    'apps.accounts',
    'apps.workspaces',
    'apps.brands',
    'apps.campaigns',
    'apps.transcripts',
    'apps.generations',
    'apps.assets',
    'apps.seo',
    'apps.scheduling',
    'apps.integrations',
    'apps.analytics',
    'apps.notifications',
    'apps.audit',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'creatorflow.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'creatorflow.wsgi.application'
ASGI_APPLICATION = 'creatorflow.asgi.application'

sqlite_path = Path('/tmp/sabd-studio.sqlite3') if os.getenv('VERCEL') else BASE_DIR / 'db.sqlite3'
# Prefer a serverless connection-pool URL provisioned by Supabase/Vercel.
# Supabase's direct db.<ref>.supabase.co endpoint can resolve IPv6-only, while
# Vercel Functions reliably connect through the transaction/session pooler.
database_url = (
    os.getenv('DATABASE_POOLER_URL')
    or os.getenv('POSTGRES_URL')
    or os.getenv('DATABASE_URL')
    or f"sqlite:///{sqlite_path}"
)
uses_postgres = database_url.startswith(('postgres://', 'postgresql://'))
DATABASES = {
    'default': dj_database_url.config(
        default=database_url,
        conn_max_age=int(os.getenv('DB_CONN_MAX_AGE', '60')),
        conn_health_checks=True,
        ssl_require=uses_postgres and os.getenv('DB_SSL_REQUIRE', 'false').lower() == 'true',
    )
}

AUTH_USER_MODEL = 'accounts.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Vercel terminates TLS before forwarding requests to Django.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

frontend_origins = ','.join(filter(None, (
    os.getenv('FRONTEND_URL', ''),
    os.getenv('APP_URL', ''),
    'https://sabd-studio.vercel.app',
    'http://localhost:3000,http://127.0.0.1:3000',
)))
CORS_ALLOWED_ORIGINS = list(dict.fromkeys(
    o.strip().rstrip('/') for o in os.getenv('CORS_ALLOWED_ORIGINS', frontend_origins).split(',') if o.strip()
))
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = list(dict.fromkeys(
    o.strip().rstrip('/') for o in os.getenv('CSRF_TRUSTED_ORIGINS', frontend_origins).split(',') if o.strip()
))

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'apps.accounts.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'EXCEPTION_HANDLER': 'apps.accounts.exceptions.custom_exception_handler',
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'CreatorFlow AI API',
    'DESCRIPTION': 'Production-ready REST API for CreatorFlow AI content pipeline automation.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# Celery Configuration
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/1')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/2')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'

# AI Provider Settings
AI_PROVIDER = os.getenv('AI_PROVIDER', 'deterministic')
AI_API_KEY = os.getenv('AI_API_KEY', '')
AI_MODEL = os.getenv('AI_MODEL', 'gpt-4o-mini')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-3.1-flash-lite')
GEMINI_TIMEOUT_SECONDS = int(os.getenv('GEMINI_TIMEOUT_SECONDS', '60'))
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')
MONGODB_URI = os.getenv('MONGODB_URI', '')
MONGODB_DATABASE = os.getenv('MONGODB_DATABASE', 'sabd_studio')
CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME', '')
CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY', '')
CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET', '')
CLOUDINARY_FOLDER = os.getenv('CLOUDINARY_FOLDER', 'sabd-studio')
ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY', '')
ELEVENLABS_VOICE_ID = os.getenv('ELEVENLABS_VOICE_ID', '')
