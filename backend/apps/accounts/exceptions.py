import uuid
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    request_id = str(uuid.uuid4())

    if response is not None:
        code = "VALIDATION_ERROR"
        if response.status_code == 401:
            code = "UNAUTHORIZED"
        elif response.status_code == 403:
            code = "FORBIDDEN"
        elif response.status_code == 404:
            code = "NOT_FOUND"
        elif response.status_code == 429:
            code = "RATE_LIMIT_EXCEEDED"
        elif response.status_code >= 500:
            code = "SERVER_ERROR"

        error_data = {
            "code": code,
            "message": str(exc.detail) if hasattr(exc, 'detail') and isinstance(exc.detail, str) else "Invalid request data",
            "fields": response.data if isinstance(response.data, dict) else {"details": response.data}
        }

        response.data = {
            "success": False,
            "error": error_data,
            "request_id": request_id
        }
    else:
        logger.exception("Unhandled API exception", exc_info=exc)
        response = Response({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred",
                "fields": {}
            },
            "request_id": request_id
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response
