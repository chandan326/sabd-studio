"""Vercel Python entrypoint for the Sabd Studio Django API."""

import os
import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "creatorflow.settings")

from creatorflow.wsgi import application  # noqa: E402

# Vercel's Python runtime discovers a WSGI callable named `app`.
app = application
