# instructors/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'profiles', views.InstructorProfileViewSet, basename='instructor-profile')
router.register(r'availability', views.InstructorAvailabilityViewSet, basename='instructor-availability')
router.register(r'performance', views.InstructorPerformanceViewSet, basename='instructor-performance')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', views.get_instructor_dashboard, name='instructor-dashboard'),
    path('list/', views.get_instructor_list, name='instructor-list'),
    path('<int:instructor_id>/toggle-status/', views.update_instructor_status, name='update-instructor-status'),
]