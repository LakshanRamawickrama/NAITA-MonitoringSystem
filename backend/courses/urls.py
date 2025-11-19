# courses/urls.py - MINIMAL VERSION
from django.urls import path
from . import views

urlpatterns = [
    # Only function-based views
    path('api/courses/my/', views.my_courses_view, name='my-courses'),
    path('api/courses/available/', views.available_courses_view, name='available-courses'),
    path('api/courses/pending/', views.pending_courses_view, name='pending-courses'),
    path('api/courses/<int:pk>/assign_to_me/', views.assign_to_me_view, name='assign-to-me'),
    
    # Basic CRUD endpoints
    path('api/courses/', views.CourseViewSet.as_view({'get': 'list', 'post': 'create'}), name='courses-list'),
    path('api/courses/<int:pk>/', views.CourseViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='courses-detail'),
    
    #instructor reports & management
    path('api/courses/<int:pk>/details/', views.course_details_view, name='course-details'),
    path('api/courses/<int:pk>/reports/', views.course_reports_view, name='course-reports'),
    path('api/courses/<int:pk>/update_content/', views.update_course_content, name='update-course-content'),
]