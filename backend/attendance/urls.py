# attendance/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'attendance', views.AttendanceViewSet, basename='attendance')

urlpatterns = [
    path('', include(router.urls)),
    path('course/<int:course_id>/students/', views.get_course_students, name='course-students'),
    path('course/<int:course_id>/bulk/', views.bulk_update_attendance, name='bulk-update-attendance'),
    path('summary/<int:course_id>/', views.get_attendance_summary, name='attendance-summary'),
    path('course/<int:course_id>/student-stats/', views.get_student_attendance_stats, name='student-attendance-stats'),
]