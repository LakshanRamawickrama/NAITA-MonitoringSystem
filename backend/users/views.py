# users/views.py
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
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count, Value
from django.db.models.functions import Coalesce

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
            return obj.district == request.user.district
        
        return False

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
    permission_classes = [IsAdminOrDistrictManagerOrTrainingOfficer]  # Updated permission
    queryset = User.objects.select_related("center").all()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filter by district for district managers and training officers
        if user.role in ['district_manager', 'training_officer'] and user.district:
            queryset = queryset.filter(district=user.district)
        
        return queryset

    def get_serializer_class(self):
        return UserCreateSerializer if self.request.method == "POST" else UserListSerializer

# GET + PATCH + DELETE
class UserRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminOrDistrictManager]  # Keep original permission for detailed operations
    queryset = User.objects.select_related("center").all()
    serializer_class = UserCreateSerializer
    lookup_field = "id"

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        queryset = super().get_queryset()
        
        if self.request.user.role == 'district_manager' and self.request.user.district:
            queryset = queryset.filter(district=self.request.user.district)
        
        return queryset

# CHANGE PASSWORD
@api_view(["POST"])
@permission_classes([IsAdminOrDistrictManager])
def change_user_password(request, id):
    user = get_object_or_404(User, id=id)
    
    # Check district permission
    if request.user.role == 'district_manager' and user.district != request.user.district:
        return Response(
            {"detail": "You can only change passwords for users in your district."},
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
    permission_classes = [permissions.IsAuthenticated]  # Any authenticated user can view instructors
    serializer_class = UserListSerializer
    
    def get_queryset(self):
        queryset = User.objects.filter(role='instructor').select_related("center")
        user = self.request.user
        
        # Filter by district for district managers and training officers
        if user.role in ['district_manager', 'training_officer'] and user.district:
            queryset = queryset.filter(district=user.district)
        
        return queryset

# CENTERS
class CenterListView(generics.ListAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    queryset = Center.objects.all()
    serializer_class = CenterSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.role == 'district_manager' and user.district:
            queryset = queryset.filter(district=user.district)
        
        return queryset

# ==================== OVERVIEW VIEWS ====================
class OverviewView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdmin]

    def get(self, request):
        total_centers = Center.objects.count()
        active_students = Center.objects.aggregate(
            total_students=Coalesce(Sum('students'), Value(0))
        )['total_students']
        total_instructors = User.objects.filter(role='instructor').count()
        completion_rate = 87

        enrollment_data = [
            {'month': 'Jan', 'students': 1200},
            {'month': 'Feb', 'students': 1350},
        ]

        performance_counts = Center.objects.values('performance').annotate(value=Count('id')).order_by()
        colors = {
            'Excellent': '#16a34a',
            'Good': '#eab308',
            'Average': '#38bdf8',
            'Needs Improvement': '#365314',
            None: '#9ca3af'
        }
        center_performance_data = [
            {
                'name': item['performance'] or 'Unknown',
                'value': item['value'],
                'color': colors.get(item['performance'], '#9ca3af')
            }
            for item in performance_counts
        ]

        recent_activities = [
            {'id': 1, 'activity': 'New center registered in Matara', 'time': '2 hours ago', 'type': 'success'},
        ]

        trends = {
            'centers': {'value': 5, 'isPositive': True},
            'students': {'value': 12, 'isPositive': True},
            'instructors': {'value': 8, 'isPositive': True},
            'completion': {'value': 3, 'isPositive': True},
        }

        data = {
            'total_centers': total_centers,
            'active_students': active_students,
            'total_instructors': total_instructors,
            'completion_rate': completion_rate,
            'enrollment_data': enrollment_data,
            'center_performance_data': center_performance_data,
            'recent_activities': recent_activities,
            'trends': trends,
        }
        return Response(data)