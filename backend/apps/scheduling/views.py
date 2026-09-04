import uuid
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.scheduling.models import Schedule
from apps.assets.models import GeneratedAsset
from apps.workspaces.models import WorkspaceMember
from apps.notifications.models import Notification

class ScheduleListCreateView(APIView):
    def get(self, request):
        workspace_id = request.query_params.get('workspace_id')
        if not workspace_id:
            member = WorkspaceMember.objects.filter(user=request.user).first()
            if not member:
                return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "No workspace found", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_404_NOT_FOUND)
            workspace_id = member.workspace.id

        schedules = Schedule.objects.filter(asset__campaign__workspace_id=workspace_id).select_related('asset', 'asset__campaign').order_by('scheduled_for')

        platform = request.query_params.get('platform')
        if platform:
            schedules = schedules.filter(asset__platform=platform)

        data = [{
            "id": str(s.id),
            "asset_id": str(s.asset.id),
            "asset_title": s.asset.title,
            "platform": s.asset.platform,
            "scheduled_for": s.scheduled_for.isoformat(),
            "timezone": s.timezone,
            "status": s.status,
            "external_post_id": s.external_post_id,
            "failure_reason": s.failure_reason
        } for s in schedules]

        return Response({
            "success": True,
            "data": data,
            "message": "Schedules listed",
            "request_id": str(uuid.uuid4())
        })

    def post(self, request):
        asset_id = request.data.get('asset_id')
        scheduled_for_str = request.data.get('scheduled_for')
        tz_str = request.data.get('timezone', 'UTC')

        if not asset_id or not scheduled_for_str:
            return Response({"success": False, "error": {"code": "VALIDATION_ERROR", "message": "asset_id and scheduled_for are required", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_400_BAD_REQUEST)

        try:
            asset = GeneratedAsset.objects.get(id=asset_id)
        except GeneratedAsset.DoesNotExist:
            return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "Asset not found", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_404_NOT_FOUND)

        schedule = Schedule.objects.create(
            asset=asset,
            scheduled_for=scheduled_for_str,
            timezone=tz_str,
            status='scheduled'
        )

        asset.status = 'approved'
        asset.save()

        Notification.objects.create(
            user=request.user,
            notification_type='content_scheduled',
            title=f"Scheduled for {asset.platform.upper()}",
            message=f"'{asset.title}' has been added to the Content Calendar for {scheduled_for_str}."
        )

        return Response({
            "success": True,
            "data": {
                "id": str(schedule.id),
                "asset_id": str(asset.id),
                "scheduled_for": schedule.scheduled_for.isoformat(),
                "status": schedule.status
            },
            "message": "Content scheduled successfully",
            "request_id": str(uuid.uuid4())
        }, status=status.HTTP_201_CREATED)

class ScheduleDetailView(APIView):
    def put(self, request, schedule_id):
        try:
            schedule = Schedule.objects.get(id=schedule_id)
        except Schedule.DoesNotExist:
            return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "Schedule not found", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_404_NOT_FOUND)

        if 'scheduled_for' in request.data:
            schedule.scheduled_for = request.data['scheduled_for']
        if 'timezone' in request.data:
            schedule.timezone = request.data['timezone']
        if 'status' in request.data:
            schedule.status = request.data['status']

        schedule.save()

        return Response({
            "success": True,
            "data": {
                "id": str(schedule.id),
                "scheduled_for": schedule.scheduled_for.isoformat(),
                "status": schedule.status
            },
            "message": "Schedule updated",
            "request_id": str(uuid.uuid4())
        })

    def delete(self, request, schedule_id):
        try:
            schedule = Schedule.objects.get(id=schedule_id)
        except Schedule.DoesNotExist:
            return Response({"success": False, "error": {"code": "NOT_FOUND", "message": "Schedule not found", "fields": {}}, "request_id": str(uuid.uuid4())}, status=status.HTTP_404_NOT_FOUND)

        schedule.status = 'cancelled'
        schedule.save()

        return Response({"success": True, "data": {}, "message": "Schedule cancelled", "request_id": str(uuid.uuid4())})
