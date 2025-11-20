# users/urls.py - CORRECTED VERSION
from django.urls import path
from .views import (
    MyTokenObtainPairView,
    UserListCreateView,
    UserRetrieveUpdateDestroyView,
    change_user_password,
    current_user,
    CenterListView,
    InstructorListView  # ADD THIS
)

urlpatterns = [
    # Auth
    path("token/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),

    # Users
    path("users/", UserListCreateView.as_view(), name="user_list_create"),
    path("users/<int:id>/", UserRetrieveUpdateDestroyView.as_view(), name="user_detail"),
    path("users/<int:id>/change-password/", change_user_password, name="change_password"),
    path("users/me/", current_user, name="current_user"),

    # Centers
    path("centers/", CenterListView.as_view(), name="center_list"),
    
    # Instructors
    path("instructors/", InstructorListView.as_view(), name="instructor-list"),

    # Add more user-related endpoints as needed
]