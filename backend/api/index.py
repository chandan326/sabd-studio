"""Vercel WSGI entrypoint for the Sabd Studio Django API."""

import json
import os
import sys
import traceback
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "creatorflow.settings")

_django_application = None


def _json_response(start_response, status, payload):
    body = json.dumps(payload).encode("utf-8")
    start_response(status, [
        ("Content-Type", "application/json; charset=utf-8"),
        ("Content-Length", str(len(body))),
        ("Cache-Control", "no-store"),
    ])
    return [body]


def app(environ, start_response):
    """Serve a dependency-free health check and lazily initialize Django."""
    path = (environ.get("PATH_INFO") or "/").rstrip("/")
    if path in {"/health", "/api/v1/health"}:
        return _json_response(start_response, "200 OK", {
            "success": True,
            "data": {"status": "healthy", "service": "sabd-studio-api"},
        })

    global _django_application
    if _django_application is None:
        try:
            from creatorflow.wsgi import application
            _django_application = application
        except Exception:
            traceback.print_exc()
            return _json_response(start_response, "500 Internal Server Error", {
                "success": False,
                "error": {"code": "BACKEND_INITIALIZATION_FAILED"},
            })

    return _django_application(environ, start_response)
