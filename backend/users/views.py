# users/views.py - COMPLETE UPDATED VERSION
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import get_user_model, authenticate
from django.shortcuts import get_object_or_404
from django.contrib.admin.models import LogEntry, CHANGE
from django.contrib.contenttypes.models import ContentType
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from django.conf import settings
from django.db import models
from .serializers import UserListSerializer, UserCreateSerializer
from centers.serializers import CenterSerializer
from centers.models import Center
from rest_framework import serializers

import logging


logger = logging.getLogger(__name__)
User = get_user_model()

# ==================== UTILITY FUNCTIONS ====================

def send_activation_notification_email(user, activated=True, actor=None):
    """
    Send email notification when instructor account is activated or deactivated
    """
    try:
        subject = f"Account {'Activated' if activated else 'Deactivated'} - NAITA MIS"
        
        context = {
            'user': user,
            'activated': activated,
            'actor': actor,
            'date': timezone.now().strftime("%Y-%m-%d %H:%M"),
            'system_url': getattr(settings, 'FRONTEND_URL', 'https://naita-mis.gov.lk'),
            'support_email': getattr(settings, 'SUPPORT_EMAIL', 'support@naita.gov.lk'),
            'support_phone': getattr(settings, 'SUPPORT_PHONE', '+94 11 2 123 456'),
        }
        
        if activated:
            template_name = 'emails/account_activated.html'
            text_message = f"""
                Dear {user.first_name} {user.last_name},

                Your NAITA MIS instructor account has been activated.

                You can now login to the system using your credentials:
                - Email: {user.email}
                - System URL: {context['system_url']}

                If you have any questions, please contact:
                Email: {context['support_email']}
                Phone: {context['support_phone']}

                Best regards,
                NAITA MIS System
                            """
        else:
            template_name = 'emails/account_deactivated.html'
            text_message = f"""
                Dear {user.first_name} {user.last_name},

                Your NAITA MIS instructor account has been deactivated.

                You will no longer be able to access the system. 
                If you believe this is an error, please contact your administrator.

                Contact Information:
                Email: {context['support_email']}
                Phone: {context['support_phone']}

                Best regards,
                NAITA MIS System
                            """
        
        # Try to send HTML email
        try:
            html_message = render_to_string(template_name, context)
        except:
            html_message = None
        
        send_mail(
            subject=subject,
            message=text_message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@naita.gov.lk'),
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=True
        )
        
        logger.info(f"Activation notification email {'sent' if activated else 'deactivation'} sent to {user.email}")
        
    except Exception as e:
        logger.error(f"Failed to send activation notification email: {str(e)}")

def log_user_status_change(user, action, actor, notes=None):
    """
    Log user status changes for audit trail
    """
    try:
        LogEntry.objects.log_action(
            user_id=actor.id,
            content_type_id=ContentType.objects.get_for_model(User).pk,
            object_id=user.id,
            object_repr=str(user),
            action_flag=CHANGE,
            change_message=f"Status changed to {action} by {actor.email}. {notes or ''}"
        )
        logger.info(f"User {user.email} status changed to {action} by {actor.email}")
    except Exception as e:
        logger.error(f"Failed to log user status change: {str(e)}")

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

        # Get user by email first
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email or password.")
        
        # Check if user is active
        if not user.is_active:
            # Log the failed login attempt for deactivated account
            logger.warning(f"Login attempt for deactivated account: {email}")
            raise serializers.ValidationError(
                "Your account has been deactivated. Please contact your administrator."
            )
        
        # Authenticate with password
        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        
        # Log successful login
        logger.info(f"Successful login for {email}")
        
        data = super().validate(attrs)
        
        # Add user info to response
        data['user'] = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'district': user.district,
            'center_id': user.center.id if user.center else None,
            'center_name': user.center.name if user.center else None,
            'is_active': user.is_active,
        }
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['district'] = user.district or ""
        token['center_id'] = user.center.id if user.center else None
        token['center_name'] = user.center.name if user.center else None
        token['is_active'] = user.is_active
        token['user_id'] = user.id
        token['email'] = user.email
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
        
        new_user = serializer.save()
        
        # Log the creation
        log_user_status_change(new_user, 'Created', user, 'New user created')
        
        # Send welcome email for instructors
        if new_user.role == 'instructor' and new_user.email:
            send_activation_notification_email(new_user, activated=True, actor=user)

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
        
        # Track if is_active is being changed
        old_is_active = instance.is_active
        new_is_active = serializer.validated_data.get('is_active', old_is_active)
        
        updated_user = serializer.save()
        
        # Log the update
        log_user_status_change(updated_user, 'Updated', user, 'User details updated')
        
        # Send notification if status changed
        if old_is_active != new_is_active:
            log_user_status_change(
                updated_user, 
                'Active' if new_is_active else 'Inactive', 
                user,
                f'Status changed from {"Active" if old_is_active else "Inactive"} to {"Active" if new_is_active else "Inactive"}'
            )
            
            # Send email notification
            send_activation_notification_email(
                updated_user, 
                activated=new_is_active, 
                actor=user
            )

    def perform_destroy(self, instance):
        user = self.request.user
        
        # Training officers can only delete instructors
        if user.role == 'training_officer' and instance.role != 'instructor':
            raise serializers.ValidationError({
                "detail": "Training officers can only delete instructors."
            })
        
        # Log before deletion
        log_user_status_change(instance, 'Deleted', user, 'User account permanently deleted')
        
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
    
    # Log password change
    log_user_status_change(user, 'Password Changed', request_user, 'Password was changed')
    
    return Response({"detail": "Password changed successfully."})

# CURRENT USER
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def current_user(request):
    serializer = UserListSerializer(request.user)
    return Response(serializer.data)

# ==================== ACCOUNT STATUS MANAGEMENT ====================

# CHECK ACCOUNT STATUS
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def check_account_status(request):
    """
    Check if the authenticated user's account is active.
    Useful for frontend to check status on app load.
    """
    user = request.user
    return Response({
        "is_active": user.is_active,
        "email": user.email,
        "role": user.role,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "district": user.district,
        "center_id": user.center.id if user.center else None,
        "center_name": user.center.name if user.center else None,
        "message": "Account is active" if user.is_active else "Account is deactivated",
        "checked_at": timezone.now().isoformat()
    })

# TOGGLE INSTRUCTOR STATUS (Activate/Deactivate)
@api_view(["POST"])
@permission_classes([IsAdminOrDistrictManagerOrTrainingOfficer])
def toggle_instructor_status(request, id):
    """
    Toggle instructor activation status with proper validation
    """
    instructor = get_object_or_404(User, id=id)
    request_user = request.user
    
    # Check permissions
    if request_user.role == 'admin':
        pass  # Admin can toggle any instructor
    elif request_user.role == 'district_manager':
        if instructor.district != request_user.district:
            return Response(
                {"detail": "You can only manage instructors in your district."},
                status=status.HTTP_403_FORBIDDEN
            )
    elif request_user.role == 'training_officer':
        if instructor.district != request_user.district:
            return Response(
                {"detail": "You can only manage instructors in your district."},
                status=status.HTTP_403_FORBIDDEN
            )
        # Training officers can only manage instructors
        if instructor.role != 'instructor':
            return Response(
                {"detail": "Training officers can only manage instructors."},
                status=status.HTTP_403_FORBIDDEN
            )
    else:
        return Response(
            {"detail": "Permission denied."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Cannot deactivate self
    if instructor.id == request_user.id:
        return Response(
            {"detail": "You cannot deactivate your own account."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Toggle status
    new_status = not instructor.is_active
    old_status = instructor.is_active
    instructor.is_active = new_status
    instructor.save()
    
    # Log the action
    action = 'Activated' if new_status else 'Deactivated'
    log_user_status_change(
        instructor, 
        action, 
        request_user, 
        f'Status changed from {"Active" if old_status else "Inactive"} to {"Active" if new_status else "Inactive"}'
    )
    
    # Send email notification
    send_activation_notification_email(instructor, activated=new_status, actor=request_user)
    
    # Check if any active sessions need to be invalidated
    if not new_status:
        # Invalidate refresh tokens for deactivated users
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
        try:
            tokens = OutstandingToken.objects.filter(user=instructor)
            for token in tokens:
                if not BlacklistedToken.objects.filter(token=token).exists():
                    BlacklistedToken.objects.create(token=token)
            logger.info(f"Invalidated {tokens.count()} tokens for deactivated user {instructor.email}")
        except Exception as e:
            logger.warning(f"Could not invalidate tokens for deactivated user: {str(e)}")
    
    return Response({
        "detail": f"Instructor {instructor.email} has been {action.lower()}.",
        "is_active": instructor.is_active,
        "action": action,
        "instructor": {
            "id": instructor.id,
            "email": instructor.email,
            "first_name": instructor.first_name,
            "last_name": instructor.last_name,
            "role": instructor.role,
            "district": instructor.district,
        },
        "performed_by": {
            "id": request_user.id,
            "email": request_user.email,
            "role": request_user.role,
        },
        "performed_at": timezone.now().isoformat()
    })

# BULK TOGGLE INSTRUCTOR STATUS
@api_view(["POST"])
@permission_classes([IsAdminOrDistrictManager])
def bulk_toggle_instructor_status(request):
    """
    Bulk activate/deactivate multiple instructors
    """
    instructor_ids = request.data.get("instructor_ids", [])
    action = request.data.get("action")  # 'activate' or 'deactivate'
    
    if not instructor_ids or not action:
        return Response(
            {"detail": "instructor_ids and action are required."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if action not in ['activate', 'deactivate']:
        return Response(
            {"detail": "Action must be 'activate' or 'deactivate'."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    request_user = request.user
    new_status = action == 'activate'
    
    # Get instructors
    instructors = User.objects.filter(id__in=instructor_ids, role='instructor')
    
    # Filter by district for non-admin users
    if request_user.role != 'admin' and request_user.district:
        instructors = instructors.filter(district=request_user.district)
    
    results = {
        "success": [],
        "failed": [],
        "skipped": []
    }
    
    for instructor in instructors:
        try:
            # Skip if already in desired state
            if instructor.is_active == new_status:
                results["skipped"].append({
                    "id": instructor.id,
                    "email": instructor.email,
                    "reason": f"Already {action}d"
                })
                continue
            
            # Cannot deactivate self
            if instructor.id == request_user.id and not new_status:
                results["failed"].append({
                    "id": instructor.id,
                    "email": instructor.email,
                    "reason": "Cannot deactivate your own account"
                })
                continue
            
            # Update status
            old_status = instructor.is_active
            instructor.is_active = new_status
            instructor.save()
            
            # Log the action
            action_text = 'Activated' if new_status else 'Deactivated'
            log_user_status_change(
                instructor, 
                action_text, 
                request_user, 
                f'Bulk status change from {"Active" if old_status else "Inactive"} to {"Active" if new_status else "Inactive"}'
            )
            
            # Send email notification
            send_activation_notification_email(instructor, activated=new_status, actor=request_user)
            
            results["success"].append({
                "id": instructor.id,
                "email": instructor.email,
                "old_status": old_status,
                "new_status": new_status
            })
            
        except Exception as e:
            results["failed"].append({
                "id": instructor.id,
                "email": instructor.email,
                "reason": str(e)
            })
    
    return Response({
        "detail": f"Bulk {action} completed",
        "summary": {
            "total": len(instructor_ids),
            "success": len(results["success"]),
            "failed": len(results["failed"]),
            "skipped": len(results["skipped"])
        },
        "results": results
    })

# GET INSTRUCTOR ACTIVITY LOG
@api_view(["GET"])
@permission_classes([IsAdminOrDistrictManagerOrTrainingOfficer])
def get_instructor_activity_log(request, id):
    """
    Get activity log for a specific instructor
    """
    instructor = get_object_or_404(User, id=id, role='instructor')
    request_user = request.user
    
    # Check permissions
    if request_user.role == 'admin':
        pass
    elif request_user.role in ['district_manager', 'training_officer']:
        if instructor.district != request_user.district:
            return Response(
                {"detail": "You can only view logs for instructors in your district."},
                status=status.HTTP_403_FORBIDDEN
            )
    
    # Get log entries for this instructor
    try:
        from django.contrib.admin.models import LogEntry
        from django.contrib.contenttypes.models import ContentType
        
        user_content_type = ContentType.objects.get_for_model(User)
        logs = LogEntry.objects.filter(
            content_type=user_content_type,
            object_id=instructor.id
        ).order_by('-action_time')[:100]  # Last 100 entries
        
        log_data = []
        for log in logs:
            log_data.append({
                "action_time": log.action_time.isoformat(),
                "user": {
                    "id": log.user.id,
                    "email": log.user.email,
                    "role": log.user.role
                } if log.user else None,
                "action_flag": log.get_action_flag_display(),
                "change_message": log.change_message,
                "is_addition": log.is_addition(),
                "is_change": log.is_change(),
                "is_deletion": log.is_deletion(),
            })
        
        return Response({
            "instructor": {
                "id": instructor.id,
                "email": instructor.email,
                "first_name": instructor.first_name,
                "last_name": instructor.last_name,
                "is_active": instructor.is_active,
                "last_login": instructor.last_login.isoformat() if instructor.last_login else None
            },
            "logs": log_data,
            "total_logs": len(log_data)
        })
        
    except Exception as e:
        logger.error(f"Error fetching activity log: {str(e)}")
        return Response(
            {"detail": "Could not fetch activity logs."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ==================== INSTRUCTOR MANAGEMENT ====================

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
            # Normalize district name (remove 'District' suffix if present to allow broader matching)
            search_district = user.district.replace(" District", "").strip()
            queryset = queryset.filter(district__icontains=search_district)
        
        # Apply filters from query parameters
        status_filter = self.request.query_params.get('status')
        if status_filter == 'active':
            queryset = queryset.filter(is_active=True)
        elif status_filter == 'inactive':
            queryset = queryset.filter(is_active=False)
        
        search_term = self.request.query_params.get('search')
        if search_term:
            queryset = queryset.filter(
                models.Q(first_name__icontains=search_term) |
                models.Q(last_name__icontains=search_term) |
                models.Q(email__icontains=search_term) |
                models.Q(district__icontains=search_term)
            )
        
        return queryset.order_by('-is_active', 'first_name', 'last_name')
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        # Get stats
        total = queryset.count()
        active = queryset.filter(is_active=True).count()
        inactive = queryset.filter(is_active=False).count()
        
        # Paginate
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response({
                'count': total,
                'active': active,
                'inactive': inactive,
                'results': serializer.data
            })
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'count': total,
            'active': active,
            'inactive': inactive,
            'results': serializer.data
        })

# GET INSTRUCTOR STATS
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def get_instructor_stats(request):
    """
    Get statistics about instructors
    """
    user = request.user
    queryset = User.objects.filter(role='instructor')
    
    # Filter by district for non-admin users
    if user.role in ['district_manager', 'training_officer'] and user.district:
        queryset = queryset.filter(district=user.district)
    
    total = queryset.count()
    active = queryset.filter(is_active=True).count()
    inactive = queryset.filter(is_active=False).count()
    
    # Get distribution by district
    from django.db.models import Count
    district_distribution = queryset.values('district').annotate(
        count=Count('id'),
        active_count=Count('id', filter=models.Q(is_active=True)),
        inactive_count=Count('id', filter=models.Q(is_active=False))
    ).order_by('-count')
    
    # Get recent activity (last 7 days)
    from django.utils import timezone
    from datetime import timedelta
    week_ago = timezone.now() - timedelta(days=7)
    
    recent_activity = {
        'activated': queryset.filter(
            is_active=True,
            date_joined__gte=week_ago
        ).count(),
        'deactivated': queryset.filter(
            is_active=False,
            date_joined__gte=week_ago
        ).count(),
        'new_instructors': queryset.filter(
            date_joined__gte=week_ago
        ).count(),
    }
    
    return Response({
        "total": total,
        "active": active,
        "inactive": inactive,
        "active_percentage": round((active / total * 100) if total > 0 else 0, 1),
        "district_distribution": list(district_distribution),
        "recent_activity": recent_activity,
        "updated_at": timezone.now().isoformat()
    })

# ==================== CENTERS ====================

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

# ==================== USER SESSION MANAGEMENT ====================

# INVALIDATE ALL USER SESSIONS
@api_view(["POST"])
@permission_classes([IsAdminOrDistrictManager])
def invalidate_user_sessions(request, id):
    """
    Invalidate all active sessions for a user (force logout)
    """
    user = get_object_or_404(User, id=id)
    request_user = request.user
    
    # Check permissions
    if request_user.role == 'admin':
        pass
    elif request_user.role == 'district_manager':
        if user.district != request_user.district:
            return Response(
                {"detail": "You can only manage users in your district."},
                status=status.HTTP_403_FORBIDDEN
            )
    else:
        return Response(
            {"detail": "Permission denied."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # Invalidate refresh tokens
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
        
        tokens = OutstandingToken.objects.filter(user=user)
        count = 0
        for token in tokens:
            if not BlacklistedToken.objects.filter(token=token).exists():
                BlacklistedToken.objects.create(token=token)
                count += 1
        
        # Log the action
        log_user_status_change(user, 'Sessions Invalidated', request_user, 
                              f'Invalidated {count} active sessions')
        
        return Response({
            "detail": f"Invalidated {count} active sessions for {user.email}.",
            "sessions_invalidated": count,
            "user": {
                "id": user.id,
                "email": user.email,
                "is_active": user.is_active
            }
        })
        
    except Exception as e:
        logger.error(f"Error invalidating sessions: {str(e)}")
        return Response(
            {"detail": "Could not invalidate sessions."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# GET USER SESSION INFO
@api_view(["GET"])
@permission_classes([IsAdminOrDistrictManager])
def get_user_session_info(request, id):
    """
    Get information about user's active sessions
    """
    user = get_object_or_404(User, id=id)
    request_user = request.user
    
    # Check permissions
    if request_user.role == 'admin':
        pass
    elif request_user.role == 'district_manager':
        if user.district != request_user.district:
            return Response(
                {"detail": "You can only view users in your district."},
                status=status.HTTP_403_FORBIDDEN
            )
    else:
        return Response(
            {"detail": "Permission denied."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
        from django.utils import timezone
        from datetime import timedelta
        
        # Get active tokens (not expired, not blacklisted)
        active_tokens = OutstandingToken.objects.filter(
            user=user,
            expires_at__gt=timezone.now()
        ).order_by('-created_at')
        
        sessions = []
        for token in active_tokens[:50]:  # Limit to last 50
            sessions.append({
                "created_at": token.created_at.isoformat(),
                "expires_at": token.expires_at.isoformat(),
                "jti": token.jti,
                "is_active": not hasattr(token, 'blacklistedtoken'),
                "age_days": (timezone.now() - token.created_at).days,
                "expires_in_days": (token.expires_at - timezone.now()).days
            })
        
        return Response({
            "user": {
                "id": user.id,
                "email": user.email,
                "last_login": user.last_login.isoformat() if user.last_login else None,
                "is_active": user.is_active
            },
            "total_sessions": len(sessions),
            "active_sessions": len([s for s in sessions if s['is_active']]),
            "sessions": sessions,
            "checked_at": timezone.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting session info: {str(e)}")
        return Response(
            {"detail": "Could not retrieve session information."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )