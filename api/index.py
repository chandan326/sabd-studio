"""Vercel entrypoint that exposes the Django API beside the Next.js frontend."""

import json
import os
import sys
import traceback
from pathlib import Path
from urllib.parse import parse_qs


ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "creatorflow.settings")

_django_application = None


def _json_response(start_response, status, payload):
    body = json.dumps(payload).encode("utf-8")
    start_response(
        status,
        [
            ("Content-Type", "application/json; charset=utf-8"),
            ("Content-Length", str(len(body))),
            ("Cache-Control", "no-store"),
        ],
    )
    return [body]


def _restore_original_path(environ):
    """Restore the Django route carried through the Vercel catch-all rewrite."""
    query = parse_qs(environ.get("QUERY_STRING", ""), keep_blank_values=True)
    original_path = query.pop("_path", [""])[0]
    if original_path:
        if not original_path.startswith("/"):
            original_path = f"/{original_path}"
        environ["PATH_INFO"] = original_path
        environ["QUERY_STRING"] = "&".join(
            f"{key}={value}" for key, values in query.items() for value in values
        )


def app(environ, start_response):
    """Serve a fast health check and lazily initialize the Django WSGI app."""
    _restore_original_path(environ)
    path = (environ.get("PATH_INFO") or "/").rstrip("/")

    if path in {"/api/health", "/api/v1/health"}:
        return _json_response(
            start_response,
            "200 OK",
            {
                "success": True,
                "data": {"status": "healthy", "service": "sabd-studio-api"},
            },
        )

    global _django_application
    if _django_application is None:
        try:
            from creatorflow.wsgi import application

            _django_application = application
        except Exception:
            traceback.print_exc()
            return _json_response(
                start_response,
                "500 Internal Server Error",
                {
                    "success": False,
                    "error": {"code": "BACKEND_INITIALIZATION_FAILED"},
                },
            )

    return _django_application(environ, start_response)

