# users/urls.py
from django.urls import path
from .views import (
    MyTokenObtainPairView, UserListCreateView,
    UserUpdateView, UserDeleteView, change_user_password
)

urlpatterns = [
    path("token/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("users/", UserListCreateView.as_view(), name="user-list-create"),
    path("users/<int:id>/", UserUpdateView.as_view(), name="user-update"),
    path("users/<int:id>/delete/", UserDeleteView.as_view(), name="user-delete"),
    path("users/<int:id>/change-password/", change_user_password, name="user-change-password"),
]