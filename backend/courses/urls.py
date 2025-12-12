# courses/urls.py - COMPLETE FIXED VERSION
from django.urls import path
from . import views

urlpatterns = [
    # Function-based views
    path('my/', views.my_courses_view, name='my-courses'),
    path('available/', views.available_courses_view, name='available-courses'),
    path('pending/', views.pending_courses_view, name='pending-courses'),
    path('<int:pk>/assign_to_me/', views.assign_to_me_view, name='assign-to-me'),
    path('for-student/', views.courses_for_student, name='courses-for-student'),
    
    # Course approval actions for district managers
    path('<int:pk>/approve/', views.approve_course_view, name='approve-course'),
    path('<int:pk>/reject/', views.reject_course_view, name='reject-course'),
    
    # Course categories
    path('categories/', views.course_categories_view, name='course-categories'),
    path('durations/', views.course_durations_view, name='course-durations'),
    
    # Course ViewSet endpoints
    path('', views.CourseViewSet.as_view({'get': 'list', 'post': 'create'}), name='courses-list'),
    path('<int:pk>/', views.CourseViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='courses-detail'),
    
    # Instructor reports & management
    path('<int:pk>/details/', views.course_details_view, name='course-details'),
    path('<int:pk>/reports/', views.course_reports_view, name='course-reports'),
    path('<int:pk>/update_content/', views.update_course_content, name='update-course-content'),
    
    # Course Approval endpoints
    path('approvals/', views.CourseApprovalViewSet.as_view({'get': 'list', 'post': 'create'}), name='course-approvals'),
    path('approvals/<int:pk>/', views.CourseApprovalViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update'}), name='course-approval-detail'),
    
    path('courses/<int:pk>/request-assignment/', views.request_course_assignment_view, name='request-course-assignment'),
]