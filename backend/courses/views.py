# courses/views.py - COMPLETE WORKING VERSION (FIXED)
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Course, CourseApproval
from .serializers import CourseSerializer, CourseApprovalSerializer
from django.contrib.auth import get_user_model
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone

User = get_user_model()

# ==================== PERMISSION CLASSES ====================
class IsInstructor(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == "instructor"

class IsTrainingOfficer(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == "training_officer"

class IsDistrictManager(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == "district_manager"

class IsAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == "admin"

class IsInstructorOrAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role in ["instructor", "admin"]

class IsTrainingOfficerOrDistrictManager(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role in ["training_officer", "district_manager"]

# ==================== FUNCTION-BASED VIEWS ====================
@api_view(['GET'])
@permission_classes([IsInstructor])
def my_courses_view(request):
    """Get courses for the current instructor"""
    courses = Course.objects.filter(instructor=request.user, status='Active')
    serializer = CourseSerializer(courses, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsInstructorOrAdmin])
def available_courses_view(request):
    """Get available courses that instructors can assign to themselves"""
    available_courses = Course.objects.filter(
        status='Approved', 
        instructor__isnull=True
    )
    
    # For instructors, only show courses in their district
    if request.user.role == 'instructor':
        available_courses = available_courses.filter(district=request.user.district)
    
    serializer = CourseSerializer(available_courses, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsTrainingOfficerOrDistrictManager])
def pending_courses_view(request):
    """Get pending courses for training officers and district managers"""
    pending_courses = Course.objects.filter(status='Pending')
    
    # Filter by district for district managers
    if request.user.role == 'district_manager':
        pending_courses = pending_courses.filter(district=request.user.district)
    
    serializer = CourseSerializer(pending_courses, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsInstructor])
def assign_to_me_view(request, pk):
    """Instructor assigns a course to themselves"""
    try:
        course = Course.objects.get(id=pk)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if course is in instructor's district and available
    if course.district != request.user.district:
        return Response(
            {'error': 'Can only assign courses from your district'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    if course.status != 'Approved':
        return Response(
            {'error': 'Can only assign approved courses'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if course.instructor is not None:
        return Response(
            {'error': 'Course is already assigned to an instructor'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Assign the course to the instructor
    course.instructor = request.user
    course.status = 'Active'
    course.save()
    
    serializer = CourseSerializer(course)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def courses_for_student(request):
    """Get courses available for student enrollment (only from user's district)"""
    center_id = request.GET.get('center')
    user = request.user
    
    queryset = Course.objects.filter(status__in=['Active', 'Approved'])
    
    # Filter by center if provided
    if center_id:
        queryset = queryset.filter(center_id=center_id)
    
    # Filter by user's district for non-admin users
    if user.role != 'admin' and user.district:
        queryset = queryset.filter(district=user.district)
    
    serializer = CourseSerializer(queryset, many=True)
    return Response(serializer.data)

# ==================== COURSE VIEWSET ====================
class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['district', 'status', 'category', 'instructor', 'center']
    
    def get_queryset(self):
        user = self.request.user
        queryset = Course.objects.all()
        
        # Filter based on user role
        if user.role == 'instructor':
            queryset = queryset.filter(instructor=user)
        elif user.role == 'district_manager':
            queryset = queryset.filter(district=user.district)
        elif user.role == 'data_entry':
            queryset = queryset.filter(district=user.district)
        elif user.role == 'training_officer':
            queryset = queryset.filter(district=user.district)
        
        return queryset
    
    def perform_create(self, serializer):
        """Automatically set district and status when creating a course"""
        user = self.request.user
        
        # Set district based on user's district, or use provided district
        district = serializer.validated_data.get('district', user.district)
        
        # Training officers can create courses that start as Pending
        if user.role == 'training_officer':
            serializer.save(
                district=district,
                status='Pending',
                students=serializer.validated_data.get('students', 0),
                progress=serializer.validated_data.get('progress', 0),
                priority=serializer.validated_data.get('priority', 'Medium')
            )
        else:
            # Other roles can create courses with provided status
            serializer.save(
                district=district,
                students=serializer.validated_data.get('students', 0),
                progress=serializer.validated_data.get('progress', 0),
                priority=serializer.validated_data.get('priority', 'Medium')
            )
    
    def perform_update(self, serializer):
        """Handle course updates with role-based restrictions"""
        user = self.request.user
        instance = self.get_object()
        
        # Training officers can only update their own pending courses
        if user.role == 'training_officer' and instance.status != 'Pending':
            raise PermissionDenied("Training officers can only edit pending courses")
        
        # District managers can only update courses in their district
        if user.role == 'district_manager' and instance.district != user.district:
            raise PermissionDenied("Can only update courses in your district")
        
        serializer.save()
    
    def destroy(self, request, *args, **kwargs):
        """Handle course deletion with role-based restrictions"""
        user = self.request.user
        instance = self.get_object()
        
        # Training officers can only delete their own pending courses
        if user.role == 'training_officer':
            if instance.status != 'Pending':
                return Response(
                    {'error': 'Training officers can only delete pending courses'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # District managers can only delete courses in their district
        elif user.role == 'district_manager':
            if instance.district != user.district:
                return Response(
                    {'error': 'Can only delete courses in your district'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        return super().destroy(request, *args, **kwargs)

# ==================== COURSE APPROVAL VIEWSET ====================
class CourseApprovalViewSet(viewsets.ModelViewSet):
    queryset = CourseApproval.objects.all()
    serializer_class = CourseApprovalSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = CourseApproval.objects.all()
        
        if user.role == 'district_manager':
            # District managers can see approvals for their district
            queryset = queryset.filter(course__district=user.district)
        elif user.role in ['instructor', 'data_entry', 'training_officer']:
            # Can see their own approval requests
            queryset = queryset.filter(requested_by=user)
        
        return queryset
    
    def perform_create(self, serializer):
        """Automatically set the requested_by user when creating approval"""
        serializer.save(requested_by=self.request.user)
        
# ==================== INSTRUCTOR REPORT & MANAGE VIEWS ====================

@api_view(['GET'])
@permission_classes([IsInstructor])
def course_details_view(request, pk):
    """Get detailed course information for management"""
    try:
        course = Course.objects.get(id=pk)
        
        # Check if instructor owns the course
        if request.user.role == 'instructor' and course.instructor != request.user:
            return Response(
                {'error': 'You can only view your own courses'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = CourseSerializer(course)
        return Response(serializer.data)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsInstructor])
def course_reports_view(request, pk):
    """Get course reports and analytics"""
    try:
        course = Course.objects.get(id=pk)
        
        # Check if instructor owns the course
        if request.user.role == 'instructor' and course.instructor != request.user:
            return Response(
                {'error': 'You can only view reports for your own courses'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Mock report data - replace with actual analytics
        report_data = {
            'course_id': course.id,
            'course_name': course.name,
            'total_students': course.students,
            'completion_rate': course.progress,
            'average_attendance': 85,  # Mock data
            'student_performance': {
                'excellent': 15,
                'good': 25,
                'average': 40,
                'needs_improvement': 20
            },
            'weekly_progress': [
                {'week': 'Week 1', 'progress': 20},
                {'week': 'Week 2', 'progress': 45},
                {'week': 'Week 3', 'progress': 65},
                {'week': 'Week 4', 'progress': 85},
                {'week': 'Week 5', 'progress': 95},
            ],
            'upcoming_deadlines': [
                {'task': 'Assignment 1', 'due_date': '2024-12-01', 'submissions': 45},
                {'task': 'Project Submission', 'due_date': '2024-12-15', 'submissions': 12},
            ]
        }
        
        return Response(report_data)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsInstructor])
def update_course_content(request, pk):
    """Update course content and materials"""
    try:
        course = Course.objects.get(id=pk)
        
        # Check if instructor owns the course
        if course.instructor != request.user:
            return Response(
                {'error': 'You can only update your own courses'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update course fields
        if 'description' in request.data:
            course.description = request.data['description']
        if 'schedule' in request.data:
            course.schedule = request.data['schedule']
        if 'next_session' in request.data:
            course.next_session = request.data['next_session']
        if 'students' in request.data:
            course.students = request.data['students']
        if 'progress' in request.data:
            course.progress = request.data['progress']
        
        course.save()
        
        serializer = CourseSerializer(course)
        return Response(serializer.data)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)