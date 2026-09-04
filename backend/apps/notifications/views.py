import uuid
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.notifications.models import Notification

class NotificationListView(APIView):
    def get(self, request):
        notifications = Notification.objects.filter(user=request.user)[:30]
        data = [{
            "id": str(n.id),
            "notification_type": n.notification_type,
            "title": n.title,
            "message": n.message,
            "read": n.read_at is not None,
            "created_at": n.created_at.isoformat()
        } for n in notifications]

        return Response({
            "success": True,
            "data": data,
            "message": "Notifications retrieved",
            "request_id": str(uuid.uuid4())
        })

    def post(self, request):
        # Mark all as read
        Notification.objects.filter(user=request.user, read_at__isnull=True).update(read_at=timezone.now())
        return Response({
            "success": True,
            "data": {},
            "message": "All notifications marked as read",
            "request_id": str(uuid.uuid4())
        })
