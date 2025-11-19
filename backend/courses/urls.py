# courses/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'courses', views.CourseViewSet, basename='courses')
router.register(r'course-approvals', views.CourseApprovalViewSet, basename='course-approvals')

urlpatterns = [
    path('api/', include(router.urls)),
    
    # Add the custom endpoints that are missing
    path('api/courses/my/', views.CourseViewSet.as_view({'get': 'my_courses'}), name='my-courses'),
    path('api/courses/available/', views.CourseViewSet.as_view({'get': 'available_courses'}), name='available-courses'),
    path('api/courses/pending/', views.CourseViewSet.as_view({'get': 'pending_courses'}), name='pending-courses'),
    path('api/course-approvals/my/', views.CourseApprovalViewSet.as_view({'get': 'my_approvals'}), name='my-course-approvals'),
]