"""Vercel Python entrypoint for the Sabd Studio Django API."""

import os
import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "creatorflow.settings")

from creatorflow.wsgi import application  # noqa: E402

# Vercel Functions do not have a separate release phase. Apply migrations once
# per warm instance so a configured external database is ready before traffic.
if os.getenv("AUTO_MIGRATE", "true").lower() == "true":
    from django.core.management import call_command  # noqa: E402

    call_command("migrate", interactive=False, verbosity=0)

# Vercel's Python runtime discovers a WSGI callable named `app`.
app = application
