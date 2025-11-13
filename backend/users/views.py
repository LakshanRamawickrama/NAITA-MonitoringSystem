# users/views.py
from rest_framework import generics, permissions
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import User
from .serializers import UserListSerializer, UserCreateSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

User = get_user_model()

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, "role", None) == "admin"
    
# ------------------- JWT custom token -------------------
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["center"] = user.center.name if user.center else None
        return token


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


# ------------------- Permission -------------------
class IsAdmin(permissions.BasePermission):
    """Only users with role == 'admin' are allowed."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and getattr(request.user, "role", None) == "admin"
        )


# ------------------- User List / Create -------------------
class UserListCreateView(generics.ListCreateAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return User.objects.select_related("center").all()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateSerializer
        return UserListSerializer
    
    # ---------- LIST / CREATE ----------
class UserListCreateView(generics.ListCreateAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdmin]
    def get_queryset(self): return User.objects.select_related("center").all()
    def get_serializer_class(self):
        return UserCreateSerializer if self.request.method == "POST" else UserListSerializer

# ---------- UPDATE ----------
class UserUpdateView(generics.UpdateAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdmin]
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    lookup_field = "id"

# ---------- DELETE ----------
class UserDeleteView(generics.DestroyAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdmin]
    queryset = User.objects.all()
    lookup_field = "id"

# ---------- CHANGE PASSWORD ----------
@api_view(["POST"])
@permission_classes([IsAdmin])
def change_user_password(request, id):
    user = get_object_or_404(User, id=id)
    new_password = request.data.get("new_password")
    if not new_password or len(new_password) < 8:
        return Response({"new_password": ["Password must be at least 8 characters."]}, status=400)
    user.set_password(new_password)
    user.save()
    return Response({"detail": "Password changed."})