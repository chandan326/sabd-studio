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
_database_ready = False


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
        # Django's collection routes are mounted with a trailing slash, while
        # item/action routes intentionally are not. Normalise only the former
        # so browser GETs and POST requests never enter a redirect loop.
        collection_routes = {
            "/api/v1/workspaces",
            "/api/v1/brand-profile",
            "/api/v1/campaigns",
            "/api/v1/assets",
            "/api/v1/schedules",
            "/api/v1/integrations",
            "/api/v1/recommendations",
            "/api/v1/notifications",
            "/api/v1/audit-logs",
        }
        if original_path.rstrip("/") in collection_routes:
            original_path = f'{original_path.rstrip("/")}/'
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

    global _django_application, _database_ready
    if _django_application is None:
        try:
            from creatorflow.wsgi import application

            _django_application = application
        except Exception as exc:
            traceback.print_exc()
            return _json_response(
                start_response,
                "500 Internal Server Error",
                {
                    "success": False,
                    "error": {"code": "BACKEND_INITIALIZATION_FAILED"},
                },
            )

    if not _database_ready:
        try:
            # Vercel functions do not run a release command. Applying only
            # pending migrations here makes fresh databases usable and is a
            # no-op on subsequent warm requests.
            if os.getenv("AUTO_MIGRATE", "true").lower() == "true":
                from django.core.management import call_command

                call_command("migrate", interactive=False, verbosity=0)
            _database_ready = True
        except Exception:
            traceback.print_exc()
            return _json_response(
                start_response,
                "503 Service Unavailable",
                {
                    "success": False,
                    "error": {
                        "code": "DATABASE_INITIALIZATION_FAILED",
                        "message": "The application database is not ready.",
                        "diagnostic": type(exc).__name__,
                    },
                },
            )

    return _django_application(environ, start_response)
