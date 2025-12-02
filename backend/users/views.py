# users/views.py - UPDATED VERSION
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import get_user_model, authenticate
from django.shortcuts import get_object_or_404
from .serializers import UserListSerializer, UserCreateSerializer
from centers.serializers import CenterSerializer
from centers.models import Center
from rest_framework import serializers

User = get_user_model()

# ==================== PERMISSIONS ====================
class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"

class IsAdminOrDistrictManager(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.role == "admin":
            return True
        
        if request.user.role == "district_manager":
            return True
        
        return False

    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin":
            return True
        
        if request.user.role == "district_manager":
            return obj.district == request.user.district
        
        return False

class IsAdminOrDistrictManagerOrTrainingOfficer(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.role in ["admin", "district_manager", "training_officer"]:
            return True
        
        return False

    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin":
            return True
        
        if request.user.role in ["district_manager", "training_officer"]:
            # Check if user is in the same district
            if obj.district != request.user.district:
                return False
            
            # Training officers can only access instructors
            if request.user.role == "training_officer" and obj.role != "instructor":
                return False
            
            # District managers cannot access admin users
            if request.user.role == "district_manager" and obj.role == "admin":
                return False
            
            return True
        
        return False

class IsInstructor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "instructor"

class IsInstructorOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ["instructor", "admin"]

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

        data = super().validate(attrs)
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['district'] = user.district or ""
        token['center_id'] = user.center.id if user.center else None
        token['center_name'] = user.center.name if user.center else None
        return token

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# ==================== USER VIEWS ====================

# LIST + CREATE
class UserListCreateView(generics.ListCreateAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminOrDistrictManagerOrTrainingOfficer]
    queryset = User.objects.select_related("center").all()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Admin: can see all users
        if user.role == 'admin':
            return queryset
        
        # District Manager: can see all non-admin users in their district
        if user.role == 'district_manager' and user.district:
            return queryset.filter(
                district=user.district
            ).exclude(role='admin')
        
        # Training Officer: can only see instructors in their district
        if user.role == 'training_officer' and user.district:
            return queryset.filter(
                district=user.district,
                role='instructor'
            )
        
        # Default: return empty queryset for unauthorized users
        return queryset.none()

    def get_serializer_class(self):
        return UserCreateSerializer if self.request.method == "POST" else UserListSerializer

    def perform_create(self, serializer):
        user = self.request.user
        
        # Set district automatically for district managers and training officers
        if user.role in ['district_manager', 'training_officer'] and user.district:
            serializer.validated_data['district'] = user.district
        
        # Training officers can only create instructors
        if user.role == 'training_officer':
            if serializer.validated_data.get('role') != 'instructor':
                raise serializers.ValidationError({
                    "role": "Training officers can only create instructors."
                })
        
        # District managers cannot create other district managers
        if user.role == 'district_manager':
            if serializer.validated_data.get('role') == 'district_manager':
                raise serializers.ValidationError({
                    "role": "District managers cannot create other district managers."
                })
        
        serializer.save()

# GET + PATCH + DELETE
class UserRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminOrDistrictManagerOrTrainingOfficer]
    queryset = User.objects.select_related("center").all()
    serializer_class = UserCreateSerializer
    lookup_field = "id"

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Admin: can access all users
        if user.role == 'admin':
            return queryset
        
        # District Manager: can only access non-admin users in their district
        if user.role == 'district_manager' and user.district:
            return queryset.filter(
                district=user.district
            ).exclude(role='admin')
        
        # Training Officer: can only access instructors in their district
        if user.role == 'training_officer' and user.district:
            return queryset.filter(
                district=user.district,
                role='instructor'
            )
        
        # Default: return empty queryset for unauthorized users
        return queryset.none()

    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()
        
        # Training officers can only update instructors
        if user.role == 'training_officer' and instance.role != 'instructor':
            raise serializers.ValidationError({
                "role": "Training officers can only update instructors."
            })
        
        # District managers and training officers cannot change district
        if user.role in ['district_manager', 'training_officer'] and user.district:
            if serializer.validated_data.get('district') != user.district:
                raise serializers.ValidationError({
                    "district": f"You cannot change the district. Users must remain in {user.district}."
                })
        
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        
        # Training officers can only delete instructors
        if user.role == 'training_officer' and instance.role != 'instructor':
            raise serializers.ValidationError({
                "detail": "Training officers can only delete instructors."
            })
        
        instance.delete()

# CHANGE PASSWORD
@api_view(["POST"])
@permission_classes([IsAdminOrDistrictManagerOrTrainingOfficer])
def change_user_password(request, id):
    user = get_object_or_404(User, id=id)
    
    # Check permissions
    request_user = request.user
    
    # Admin can change any password
    if request_user.role == 'admin':
        pass
    # District manager can change passwords for users in their district
    elif request_user.role == 'district_manager':
        if user.district != request_user.district:
            return Response(
                {"detail": "You can only change passwords for users in your district."},
                status=status.HTTP_403_FORBIDDEN
            )
    # Training officer can only change passwords for instructors in their district
    elif request_user.role == 'training_officer':
        if user.district != request_user.district or user.role != 'instructor':
            return Response(
                {"detail": "You can only change passwords for instructors in your district."},
                status=status.HTTP_403_FORBIDDEN
            )
    else:
        return Response(
            {"detail": "Permission denied."},
            status=status.HTTP_403_FORBIDDEN
        )
    
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

# INSTRUCTORS LIST (Special endpoint for training officers)
class InstructorListView(generics.ListAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserListSerializer
    
    def get_queryset(self):
        queryset = User.objects.filter(role='instructor').select_related("center")
        user = self.request.user
        
        # Filter by district for district managers and training officers
        if user.role in ['district_manager', 'training_officer'] and user.district:
            queryset = queryset.filter(district=user.district)
        
        return queryset

# CENTERS - Updated to respect district restrictions
class CenterListView(generics.ListAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    queryset = Center.objects.all()
    serializer_class = CenterSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Admin can see all centers
        if user.role == 'admin':
            return queryset
        
        # District managers and training officers can only see centers in their district
        if user.role in ['district_manager', 'training_officer'] and user.district:
            queryset = queryset.filter(district=user.district)
        
        return queryset