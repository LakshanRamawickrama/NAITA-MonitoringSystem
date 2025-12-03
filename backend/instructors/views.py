# instructors/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.contrib.auth import get_user_model
from django.db.models import Q, Count, Avg, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from datetime import timedelta
import logging

from .models import InstructorProfile, InstructorAvailability, InstructorPerformance
from .serializers import (
    InstructorProfileSerializer, InstructorListSerializer,
    InstructorAvailabilitySerializer, InstructorPerformanceSerializer,
    InstructorStatsSerializer
)
from courses.models import Course
from centers.models import Center

logger = logging.getLogger(__name__)
User = get_user_model()

class InstructorProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for managing instructor profiles"""
    queryset = InstructorProfile.objects.all()
    serializer_class = InstructorProfileSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_verified', 'specialization']
    search_fields = [
        'user__first_name', 'user__last_name', 'user__email',
        'user__username', 'specialization', 'qualifications'
    ]
    ordering_fields = ['average_rating', 'experience_years', 'performance_score', 'joined_date']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return InstructorListSerializer
        return InstructorProfileSerializer
    
    def get_queryset(self):
        queryset = InstructorProfile.objects.all().select_related('user')
        user = self.request.user
        
        # Filter by user role
        if user.role == 'admin':
            # Admin can see all instructors
            return queryset
        
        elif user.role == 'district_manager':
            # District managers can only see instructors in their district
            if user.district:
                # Get instructors whose centers are in the district
                centers_in_district = Center.objects.filter(district=user.district)
                instructor_users = User.objects.filter(
                    centers__in=centers_in_district,
                    role='instructor'
                )
                return queryset.filter(user__in=instructor_users)
        
        elif user.role == 'training_officer':
            # Training officers can only see instructors in their district
            if user.district:
                centers_in_district = Center.objects.filter(district=user.district)
                instructor_users = User.objects.filter(
                    centers__in=centers_in_district,
                    role='instructor'
                )
                return queryset.filter(user__in=instructor_users)
        
        elif user.role == 'instructor':
            # Instructors can only see their own profile
            return queryset.filter(user=user)
        
        return queryset.none()
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get instructor statistics"""
        user = request.user
        queryset = self.get_queryset()
        
        # Calculate statistics
        total_instructors = queryset.count()
        active_instructors = queryset.filter(user__is_active=True).count()
        inactive_instructors = queryset.filter(user__is_active=False).count()
        verified_instructors = queryset.filter(is_verified=True).count()
        
        # Calculate average courses per instructor
        instructor_courses = {}
        for instructor in queryset:
            instructor_courses[instructor.id] = instructor.get_total_courses()
        
        avg_courses = sum(instructor_courses.values()) / total_instructors if total_instructors > 0 else 0
        
        # Calculate average experience
        avg_experience = queryset.aggregate(
            avg_exp=Coalesce(Avg('experience_years'), 0.0)
        )['avg_exp']
        
        # Get top specializations
        specializations = queryset.values('specialization').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        top_specializations = {item['specialization']: item['count'] for item in specializations}
        
        # Get distribution by district
        instructors_by_district = {}
        for instructor in queryset:
            if instructor.user.district:
                district = instructor.user.district
                instructors_by_district[district] = instructors_by_district.get(district, 0) + 1
        
        # Get distribution by center
        instructors_by_center = {}
        for instructor in queryset:
            centers = instructor.centers.all()
            for center in centers:
                instructors_by_center[center.name] = instructors_by_center.get(center.name, 0) + 1
        
        stats = {
            'total_instructors': total_instructors,
            'active_instructors': active_instructors,
            'inactive_instructors': inactive_instructors,
            'verified_instructors': verified_instructors,
            'average_courses_per_instructor': round(avg_courses, 1),
            'average_experience': round(avg_experience, 1),
            'top_specializations': top_specializations,
            'by_district': instructors_by_district,
            'by_center': instructors_by_center,
        }
        
        serializer = InstructorStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def courses(self, request, pk=None):
        """Get courses taught by this instructor"""
        try:
            instructor_profile = self.get_object()
            instructor_user = instructor_profile.user
            
            # Get courses taught by this instructor
            courses = Course.objects.filter(instructor=instructor_user).select_related('center')
            
            from courses.serializers import CourseSerializer
            serializer = CourseSerializer(courses, many=True)
            
            return Response({
                'instructor': instructor_user.get_full_name(),
                'total_courses': courses.count(),
                'courses': serializer.data
            })
            
        except Exception as e:
            logger.error(f"Error getting instructor courses: {str(e)}")
            return Response(
                {'error': 'Failed to load instructor courses'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def performance(self, request, pk=None):
        """Get performance metrics for this instructor"""
        try:
            instructor_profile = self.get_object()
            
            # Get performance records
            performance_records = InstructorPerformance.objects.filter(
                instructor=instructor_profile.user
            ).order_by('-month')[:12]  # Last 12 months
            
            serializer = InstructorPerformanceSerializer(performance_records, many=True)
            
            # Calculate overall performance
            overall_performance = {
                'average_completion_rate': performance_records.aggregate(
                    avg=Coalesce(Avg('completion_rate'), 0.0)
                )['avg'],
                'average_attendance_rate': performance_records.aggregate(
                    avg=Coalesce(Avg('attendance_rate'), 0.0)
                )['avg'],
                'average_satisfaction': performance_records.aggregate(
                    avg=Coalesce(Avg('student_satisfaction'), 0.0)
                )['avg'],
                'total_students_taught': performance_records.aggregate(
                    total=Coalesce(Sum('students_taught'), 0)
                )['total'],
                'total_courses_taught': performance_records.aggregate(
                    total=Coalesce(Sum('courses_taught'), 0)
                )['total'],
            }
            
            return Response({
                'instructor': instructor_profile.user.get_full_name(),
                'overall_performance': overall_performance,
                'monthly_performance': serializer.data
            })
            
        except Exception as e:
            logger.error(f"Error getting instructor performance: {str(e)}")
            return Response(
                {'error': 'Failed to load instructor performance'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['patch'])
    def toggle_verification(self, request, pk=None):
        """Toggle instructor verification status"""
        try:
            instructor_profile = self.get_object()
            instructor_profile.is_verified = not instructor_profile.is_verified
            instructor_profile.save()
            
            return Response({
                'message': f"Instructor verification {'enabled' if instructor_profile.is_verified else 'disabled'}",
                'is_verified': instructor_profile.is_verified
            })
            
        except Exception as e:
            logger.error(f"Error toggling instructor verification: {str(e)}")
            return Response(
                {'error': 'Failed to update verification status'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search instructors with advanced filtering"""
        search_term = request.query_params.get('q', '')
        specialization = request.query_params.get('specialization', '')
        district = request.query_params.get('district', '')
        center_id = request.query_params.get('center_id', '')
        is_verified = request.query_params.get('is_verified', '')
        
        queryset = self.get_queryset()
        
        if search_term:
            queryset = queryset.filter(
                Q(user__first_name__icontains=search_term) |
                Q(user__last_name__icontains=search_term) |
                Q(user__email__icontains=search_term) |
                Q(specialization__icontains=search_term) |
                Q(qualifications__icontains=search_term)
            )
        
        if specialization:
            queryset = queryset.filter(specialization__icontains=specialization)
        
        if district:
            queryset = queryset.filter(user__district=district)
        
        if center_id:
            queryset = queryset.filter(centers__id=center_id)
        
        if is_verified.lower() in ['true', 'false']:
            queryset = queryset.filter(is_verified=(is_verified.lower() == 'true'))
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class InstructorAvailabilityViewSet(viewsets.ModelViewSet):
    """ViewSet for managing instructor availability"""
    queryset = InstructorAvailability.objects.all()
    serializer_class = InstructorAvailabilitySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = InstructorAvailability.objects.all()
        user = self.request.user
        
        if user.role == 'instructor':
            return queryset.filter(instructor=user)
        
        # Admin, district managers, and training officers can view all
        return queryset

class InstructorPerformanceViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing instructor performance"""
    queryset = InstructorPerformance.objects.all()
    serializer_class = InstructorPerformanceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['instructor', 'month']

# Function-based views for the Instructor page
from rest_framework.decorators import api_view, permission_classes

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_instructor_dashboard(request):
    """Get data for instructor dashboard"""
    try:
        user = request.user
        
        if user.role != 'instructor':
            return Response(
                {'error': 'Only instructors can access this dashboard'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get instructor profile
        try:
            profile = InstructorProfile.objects.get(user=user)
        except InstructorProfile.DoesNotExist:
            # Create profile if doesn't exist
            profile = InstructorProfile.objects.create(
                user=user,
                specialization='General',
                experience_years=0
            )
        
        # Get instructor's courses
        courses = Course.objects.filter(instructor=user).select_related('center')
        active_courses = courses.filter(status='Active')
        pending_courses = courses.filter(status='Pending')
        
        # Calculate statistics
        total_students = sum(course.students for course in courses)
        active_students = sum(course.students for course in active_courses)
        
        # Get upcoming classes (simplified - you might have a proper schedule model)
        upcoming_classes = []
        for course in active_courses:
            if course.next_session:
                upcoming_classes.append({
                    'id': course.id,
                    'course': course.name,
                    'code': course.code,
                    'date': course.next_session,
                    'time': '09:00 AM',  # You should store this in your model
                    'students': course.students,
                    'center': course.center.name if course.center else 'N/A'
                })
        
        # Recent activity (simplified)
        recent_activity = []
        if courses.exists():
            for course in courses[:5]:  # Last 5 courses
                recent_activity.append({
                    'id': course.id,
                    'action': 'Course updated',
                    'course': course.name,
                    'time': course.updated_at.strftime('%Y-%m-%d %H:%M')
                })
        
        # Get performance data
        performance_records = InstructorPerformance.objects.filter(
            instructor=user
        ).order_by('-month')[:6]
        
        monthly_performance = []
        for record in performance_records:
            monthly_performance.append({
                'month': record.month.strftime('%b %Y'),
                'completion_rate': float(record.completion_rate),
                'attendance_rate': float(record.attendance_rate),
                'satisfaction': float(record.student_satisfaction)
            })
        
        return Response({
            'profile': InstructorProfileSerializer(profile).data,
            'stats': {
                'total_courses': courses.count(),
                'active_courses': active_courses.count(),
                'pending_courses': pending_courses.count(),
                'total_students': total_students,
                'active_students': active_students,
                'average_rating': float(profile.average_rating),
                'performance_score': float(profile.performance_score),
            },
            'upcoming_classes': upcoming_classes[:5],  # Limit to 5
            'recent_activity': recent_activity,
            'monthly_performance': monthly_performance,
            'courses': courses.count() > 0,
        })
        
    except Exception as e:
        logger.error(f"Error getting instructor dashboard: {str(e)}")
        return Response(
            {'error': 'Failed to load dashboard data'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_instructor_list(request):
    """Get list of instructors with filtering"""
    try:
        user = request.user
        
        # Get all instructors (users with role='instructor')
        instructor_users = User.objects.filter(role='instructor', is_active=True)
        
        # Get their profiles
        instructor_profiles = InstructorProfile.objects.filter(
            user__in=instructor_users
        ).select_related('user')
        
        # Apply filters based on user role
        if user.role == 'district_manager' and user.district:
            # Filter by district
            instructor_profiles = instructor_profiles.filter(
                user__district=user.district
            )
        
        elif user.role == 'training_officer' and user.district:
            # Filter by district
            instructor_profiles = instructor_profiles.filter(
                user__district=user.district
            )
        
        # Get search term
        search_term = request.GET.get('search', '')
        if search_term:
            instructor_profiles = instructor_profiles.filter(
                Q(user__first_name__icontains=search_term) |
                Q(user__last_name__icontains=search_term) |
                Q(user__email__icontains=search_term) |
                Q(specialization__icontains=search_term)
            )
        
        # Get status filter
        status_filter = request.GET.get('status', 'all')
        if status_filter == 'active':
            instructor_profiles = instructor_profiles.filter(user__is_active=True)
        elif status_filter == 'inactive':
            instructor_profiles = instructor_profiles.filter(user__is_active=False)
        
        # Get specialization filter
        specialization_filter = request.GET.get('specialization', 'all')
        if specialization_filter != 'all':
            instructor_profiles = instructor_profiles.filter(
                specialization__icontains=specialization_filter
            )
        
        # Get pagination parameters
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))
        start = (page - 1) * page_size
        end = start + page_size
        
        total_count = instructor_profiles.count()
        paginated_profiles = instructor_profiles[start:end]
        
        # Get courses for each instructor
        result = []
        for profile in paginated_profiles:
            instructor_data = InstructorListSerializer(profile).data
            
            # Get courses for this instructor
            courses = Course.objects.filter(instructor=profile.user)
            instructor_data['courses'] = [
                {
                    'id': course.id,
                    'name': course.name,
                    'code': course.code,
                    'status': course.status,
                    'duration': course.duration,
                    'student_count': course.students,
                    'progress': course.progress,
                }
                for course in courses
            ]
            
            # Get centers for this instructor
            centers = profile.centers.all()
            instructor_data['centers'] = [
                {
                    'id': center.id,
                    'name': center.name,
                    'district': center.district,
                }
                for center in centers
            ]
            
            result.append(instructor_data)
        
        return Response({
            'instructors': result,
            'total_count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size,
        })
        
    except Exception as e:
        logger.error(f"Error getting instructor list: {str(e)}")
        return Response(
            {'error': 'Failed to load instructors'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_instructor_status(request, instructor_id):
    """Update instructor status (active/inactive)"""
    try:
        user = request.user
        
        # Check permissions
        if user.role not in ['admin', 'district_manager', 'training_officer']:
            return Response(
                {'error': 'You do not have permission to update instructor status'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get instructor
        instructor = User.objects.get(id=instructor_id, role='instructor')
        
        # For district managers and training officers, check district
        if user.role in ['district_manager', 'training_officer']:
            if user.district != instructor.district:
                return Response(
                    {'error': 'You can only update instructors in your district'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Toggle status
        instructor.is_active = not instructor.is_active
        instructor.save()
        
        return Response({
            'message': f"Instructor {'activated' if instructor.is_active else 'deactivated'} successfully",
            'is_active': instructor.is_active
        })
        
    except User.DoesNotExist:
        return Response(
            {'error': 'Instructor not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error updating instructor status: {str(e)}")
        return Response(
            {'error': 'Failed to update instructor status'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )