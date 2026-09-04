"""ASGI entry point for CreatorFlow AI."""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "creatorflow.settings")

application = get_asgi_application()
