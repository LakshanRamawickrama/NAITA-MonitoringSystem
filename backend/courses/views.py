# courses/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Course, CourseApproval
from .serializers import CourseSerializer, CourseApprovalSerializer
from django.contrib.auth import get_user_model
from rest_framework.exceptions import PermissionDenied

User = get_user_model()

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['district', 'status', 'category', 'instructor']
    
    def get_queryset(self):
        user = self.request.user
        queryset = Course.objects.all()
        
        # Filter based on user role
        if user.role == 'instructor':
            queryset = queryset.filter(instructor=user)
        elif user.role == 'district_manager':
            queryset = queryset.filter(district=user.district)
        elif user.role == 'data_entry_officer':
            # Data entry officers can see all courses in their district
            queryset = queryset.filter(district=user.district)
        elif user.role == 'training_officer':
            # Training officers can see all courses in their district
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
                students=0,
                progress=0
            )
        else:
            # Other roles can create courses with provided status
            serializer.save(
                district=district,
                students=serializer.validated_data.get('students', 0),
                progress=serializer.validated_data.get('progress', 0)
            )
    
    def perform_update(self, serializer):
        """Handle course updates with role-based restrictions"""
        user = self.request.user
        instance = self.get_object()
        
        # Training officers can only update their own pending courses
        if user.role == 'training_officer' and instance.status != 'Pending':
            raise PermissionDenied("Training officers can only edit pending courses")
        
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
    
    @action(detail=True, methods=['post'])
    def assign_instructor(self, request, pk=None):
        """Assign an instructor to a course"""
        course = self.get_object()
        instructor_id = request.data.get('instructor_id')
        
        # Check permissions
        user = request.user
        if user.role not in ['district_manager', 'training_officer']:
            return Response(
                {'error': 'Only district managers and training officers can assign instructors'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # District managers can only assign to courses in their district
        if user.role == 'district_manager' and course.district != user.district:
            return Response(
                {'error': 'Can only assign instructors to courses in your district'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            instructor = User.objects.get(id=instructor_id, role='instructor')
            course.instructor = instructor
            course.status = 'Active'
            course.save()
            
            serializer = self.get_serializer(course)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {'error': 'Instructor not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def assign_to_me(self, request, pk=None):
        """Instructor assigns a course to themselves"""
        if request.user.role != 'instructor':
            return Response(
                {'error': 'Only instructors can assign courses to themselves'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        course = self.get_object()
        
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
        
        serializer = self.get_serializer(course)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_courses(self, request):
        """Get courses for the current instructor"""
        if request.user.role != 'instructor':
            return Response(
                {'error': 'Only instructors can access this endpoint'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        courses = Course.objects.filter(instructor=request.user, status='Active')
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def available_courses(self, request):
        """Get available courses that instructors can assign to themselves"""
        available_courses = Course.objects.filter(
            status='Approved', 
            instructor__isnull=True
        )
        
        # For instructors, only show courses in their district
        if request.user.role == 'instructor':
            available_courses = available_courses.filter(district=request.user.district)
        
        serializer = self.get_serializer(available_courses, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending_courses(self, request):
        """Get pending courses for training officers and district managers"""
        user = request.user
        
        if user.role not in ['training_officer', 'district_manager']:
            return Response(
                {'error': 'Only training officers and district managers can access this endpoint'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        pending_courses = Course.objects.filter(status='Pending')
        
        # Filter by district for district managers
        if user.role == 'district_manager':
            pending_courses = pending_courses.filter(district=user.district)
        
        serializer = self.get_serializer(pending_courses, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def submit_for_approval(self, request, pk=None):
        """Submit a course for approval (used by training officers)"""
        if request.user.role != 'training_officer':
            return Response(
                {'error': 'Only training officers can submit courses for approval'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        course = self.get_object()
        
        # Check if course belongs to training officer's district
        if course.district != request.user.district:
            return Response(
                {'error': 'Can only submit courses from your district for approval'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create approval request
        approval = CourseApproval.objects.create(
            course=course,
            requested_by=request.user,
            approval_status='Pending'
        )
        
        # Update course status
        course.status = 'Pending'
        course.save()
        
        approval_serializer = CourseApprovalSerializer(approval)
        return Response(approval_serializer.data)

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
        elif user.role in ['instructor', 'data_entry_officer', 'training_officer']:
            # Can see their own approval requests
            queryset = queryset.filter(requested_by=user)
        
        return queryset
    
    def perform_create(self, serializer):
        """Automatically set the requested_by user when creating approval"""
        serializer.save(requested_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_approvals(self, request):
        """Get approval requests for the current user"""
        if request.user.role not in ['training_officer', 'instructor', 'data_entry_officer']:
            return Response(
                {'error': 'Only training officers, instructors, and data entry officers can access this endpoint'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        approvals = CourseApproval.objects.filter(requested_by=request.user)
        serializer = self.get_serializer(approvals, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a course (district manager only)"""
        if request.user.role != 'district_manager':
            return Response(
                {'error': 'Only district managers can approve courses'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        approval = self.get_object()
        
        # Check if approval is for district manager's district
        if approval.course.district != request.user.district:
            return Response(
                {'error': 'Can only approve courses from your district'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        approval.approval_status = 'Approved'
        approval.approved_by = request.user
        approval.save()
        
        # Update the course status to Approved (but don't assign instructor)
        approval.course.status = 'Approved'
        approval.course.save()
        
        serializer = self.get_serializer(approval)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a course (district manager only)"""
        if request.user.role != 'district_manager':
            return Response(
                {'error': 'Only district managers can reject courses'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        approval = self.get_object()
        
        # Check if approval is for district manager's district
        if approval.course.district != request.user.district:
            return Response(
                {'error': 'Can only reject courses from your district'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        approval.approval_status = 'Rejected'
        approval.approved_by = request.user
        approval.save()
        
        # Update the course status
        approval.course.status = 'Rejected'
        approval.course.save()
        
        serializer = self.get_serializer(approval)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def request_changes(self, request, pk=None):
        """Request changes for a course (district manager only)"""
        if request.user.role != 'district_manager':
            return Response(
                {'error': 'Only district managers can request changes'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        approval = self.get_object()
        comments = request.data.get('comments', '')
        
        # Check if approval is for district manager's district
        if approval.course.district != request.user.district:
            return Response(
                {'error': 'Can only request changes for courses from your district'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        approval.approval_status = 'Changes Requested'
        approval.approved_by = request.user
        approval.comments = comments
        approval.save()
        
        # Update the course status
        approval.course.status = 'Pending'  # Send back to pending for changes
        approval.course.save()
        
        serializer = self.get_serializer(approval)
        return Response(serializer.data)