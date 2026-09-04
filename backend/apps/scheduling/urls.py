from django.urls import path
from apps.scheduling.views import ScheduleListCreateView, ScheduleDetailView

urlpatterns = [
    path('', ScheduleListCreateView.as_view(), name='schedule-list-create'),
    path('<uuid:schedule_id>', ScheduleDetailView.as_view(), name='schedule-detail'),
    path('<uuid:schedule_id>/cancel', ScheduleDetailView.as_view(), name='schedule-cancel'),
]
