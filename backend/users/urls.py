# users/urls.py
from django.urls import path
from . import views
from .views import (
    MyTokenObtainPairView,
    UserListCreateView,
    UserRetrieveUpdateDestroyView,
    change_user_password,
    current_user,
    CenterListView,
    OverviewView,
)

urlpatterns = [
    # Auth
    path("api/token/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),

    # Users
    path("api/users/", UserListCreateView.as_view(), name="user_list_create"),
    path("api/users/<int:id>/", UserRetrieveUpdateDestroyView.as_view(), name="user_detail"),
    path("api/users/<int:id>/change-password/", change_user_password, name="change_password"),
    path("api/users/me/", current_user, name="current_user"),

    # Centers
    path("api/centers/", CenterListView.as_view(), name="center_list"),
    
    #overview
    path("api/overview/", OverviewView.as_view(), name="overview"),
    
    # Add more user-related endpoints as needed
     path('api/instructors/', views.InstructorListView.as_view(), name='instructor-list'),
]