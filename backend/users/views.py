# users/views.py
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import get_user_model, authenticate
from django.shortcuts import get_object_or_404
from .serializers import UserListSerializer, UserCreateSerializer, CenterSerializer
from centers.models import Center
from rest_framework import serializers

User = get_user_model()

# ==================== PERMISSIONS ====================
class IsAdmin(permissions.BasePermission):
    """Only users with role == 'admin' are allowed."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"

# ==================== JWT: Login with Email + Role in Token ====================
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        if not email or not password:
            raise serializers.ValidationError("Email and password are required.")

        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password.")

        # DO NOT DO: attrs['user'] = user
        # Instead, let super() handle it
        data = super().validate(attrs)  # This calls authenticate again internally
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['center_id'] = user.center.id if user.center else None
        token['center_name'] = user.center.name if user.center else None
        return token


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


# ==================== USER VIEWS ====================

# LIST + CREATE
class UserListCreateView(generics.ListCreateAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdmin]
    queryset = User.objects.select_related("center").all()

    def get_serializer_class(self):
        return UserCreateSerializer if self.request.method == "POST" else UserListSerializer


# GET + PATCH + DELETE (ONE VIEW)
class UserRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdmin]
    queryset = User.objects.select_related("center").all()
    serializer_class = UserCreateSerializer
    lookup_field = "id"


# CHANGE PASSWORD
@api_view(["POST"])
@permission_classes([IsAdmin])
def change_user_password(request, id):
    user = get_object_or_404(User, id=id)
    new_password = request.data.get("new_password")

    if not new_password or len(new_password) < 8:
        return Response(
            {"new_password": "Password must be at least 8 characters."},
            status=status.HTTP_400_BAD_REQUEST
        )

    user.set_password(new_password)
    user.save()
    return Response({"detail": "Password changed successfully."})


# CURRENT USER
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def current_user(request):
    serializer = UserListSerializer(request.user)
    return Response(serializer.data)


# CENTERS
class CenterListView(generics.ListAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    queryset = Center.objects.all()
    serializer_class = CenterSerializer