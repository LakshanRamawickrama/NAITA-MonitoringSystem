# users/urls.py - CORRECTED VERSION
from django.urls import path
from .views import (
    MyTokenObtainPairView,
    UserListCreateView,
    UserRetrieveUpdateDestroyView,
    CenterListView,
    InstructorListView,
    change_user_password,
    current_user,
    check_account_status,  # ADD THIS
    toggle_instructor_status,  # ADD THIS
    get_instructor_stats,  # ADD THIS
    get_instructor_activity_log,  # ADD THIS
    invalidate_user_sessions,  # ADD THIS
    get_user_session_info,  # ADD THIS
    bulk_toggle_instructor_status,  # ADD THIS
)

urlpatterns = [
    # Auth
    path("token/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    
    # Account Status
    path("account/status/", check_account_status, name="check_account_status"),  # ADD THIS LINE
    
    # Users
    path("users/", UserListCreateView.as_view(), name="user_list_create"),
    path("users/<int:id>/", UserRetrieveUpdateDestroyView.as_view(), name="user_detail"),
    path("users/<int:id>/change-password/", change_user_password, name="change_password"),
    path("users/<int:id>/toggle-status/", toggle_instructor_status, name="toggle_instructor_status"),  # ADD THIS
    path("users/bulk-toggle-status/", bulk_toggle_instructor_status, name="bulk_toggle_status"),  # ADD THIS
    path("users/<int:id>/activity-log/", get_instructor_activity_log, name="instructor_activity_log"),  # ADD THIS
    path("users/<int:id>/invalidate-sessions/", invalidate_user_sessions, name="invalidate_sessions"),  # ADD THIS
    path("users/<int:id>/session-info/", get_user_session_info, name="session_info"),  # ADD THIS
    path("users/me/", current_user, name="current_user"),
    
    # Centers
    path("centers/", CenterListView.as_view(), name="center_list"),
    
    # Instructors
    path("instructors/", InstructorListView.as_view(), name="instructor-list"),
    path("instructors/stats/", get_instructor_stats, name="instructor_stats"),  # ADD THIS
]