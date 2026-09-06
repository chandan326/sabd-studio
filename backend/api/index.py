"""Vercel Python entrypoint for the Sabd Studio Django API."""

import os
import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "creatorflow.settings")

from creatorflow.wsgi import application  # noqa: E402

# Never run migrations during the default serverless cold start. A migration can
# exceed the invocation timeout and make even the health endpoint unavailable.
# It remains opt-in for controlled one-off deployments.
if os.getenv("AUTO_MIGRATE", "false").lower() == "true":
    from django.core.management import call_command  # noqa: E402

    call_command("migrate", interactive=False, verbosity=0)

# Vercel's Python runtime discovers a WSGI callable named `app`.
app = application
