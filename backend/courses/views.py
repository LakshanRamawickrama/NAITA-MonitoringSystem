# courses/views.py - COMPLETE FIXED VERSION
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Course, CourseApproval, CourseCategory, CourseDuration
from .serializers import CourseSerializer, CourseApprovalSerializer, CourseCategorySerializer, CourseDurationSerializer
from django.contrib.auth import get_user_model
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone
from django.db.models import Q
import logging

logger = logging.getLogger(__name__)

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
    """Get courses for the current instructor - including pending ones"""
    try:
        logger.info(f"My courses request from user: {request.user.id}, role: {request.user.role}, district: {request.user.district}")
        
        # Get all courses assigned to this instructor, including pending ones
        courses = Course.objects.filter(instructor=request.user)
        logger.info(f"Found {courses.count()} courses for instructor {request.user.id}")
        
        # Log course statuses for debugging
        for course in courses:
            logger.info(f"Course {course.id}: {course.name}, status: {course.status}")
        
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        logger.error(f"Error in my_courses_view: {str(e)}")
        return Response(
            {'error': 'Failed to load your courses'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsInstructorOrAdmin])
def available_courses_view(request):
    """Get available courses that instructors can assign to themselves"""
    try:
        logger.info(f"Available courses request from user: {request.user.id}, role: {request.user.role}, district: {request.user.district}")
        
        # Get approved courses without instructors AND pending courses in user's district
        available_courses = Course.objects.filter(
            district=request.user.district,
            instructor__isnull=True
        ).filter(
            Q(status='Approved') | Q(status='Pending')
        )
        
        logger.info(f"Available courses before district filter: {available_courses.count()}")
        
        # For instructors, only show courses in their district
        if request.user.role == 'instructor':
            if not request.user.district:
                logger.warning(f"Instructor {request.user.id} has no district assigned")
                return Response(
                    {'error': 'Your account does not have a district assigned. Please contact administrator.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            available_courses = available_courses.filter(district=request.user.district)
            logger.info(f"Available courses after district filter ({request.user.district}): {available_courses.count()}")
        
        serializer = CourseSerializer(available_courses, many=True)
        logger.info(f"Serialized {len(serializer.data)} available courses")
        return Response(serializer.data)
        
    except Exception as e:
        logger.error(f"Error in available_courses_view: {str(e)}")
        return Response(
            {'error': 'Failed to load available courses'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsTrainingOfficerOrDistrictManager])
def pending_courses_view(request):
    """Get pending courses for training officers and district managers"""
    try:
        logger.info(f"Pending courses request from user: {request.user.id}, role: {request.user.role}, district: {request.user.district}")
        
        pending_courses = Course.objects.filter(status='Pending')
        logger.info(f"Found {pending_courses.count()} pending courses total")
        
        # Filter by district for district managers
        if request.user.role == 'district_manager':
            if not request.user.district:
                logger.warning(f"District manager {request.user.id} has no district assigned")
                return Response(
                    {'error': 'Your account does not have a district assigned.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            pending_courses = pending_courses.filter(district=request.user.district)
            logger.info(f"Pending courses after district filter ({request.user.district}): {pending_courses.count()}")
        
        serializer = CourseSerializer(pending_courses, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        logger.error(f"Error in pending_courses_view: {str(e)}")
        return Response(
            {'error': 'Failed to load pending courses'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsInstructor])
def assign_to_me_view(request, pk):
    """Instructor assigns a course to themselves"""
    try:
        logger.info(f"Assign to me request from user: {request.user.id} for course: {pk}")
        
        course = Course.objects.get(id=pk)
        logger.info(f"Found course: {course.name}, status: {course.status}, instructor: {course.instructor}, district: {course.district}")
        
        # Check if course is in instructor's district and available
        if course.district != request.user.district:
            logger.warning(f"District mismatch: course district {course.district} vs user district {request.user.district}")
            return Response(
                {'error': 'Can only assign courses from your district'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if course.status != 'Approved':
            logger.warning(f"Course status is {course.status}, not Approved")
            return Response(
                {'error': 'Can only assign approved courses'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if course.instructor is not None:
            logger.warning(f"Course already has instructor: {course.instructor.id}")
            return Response(
                {'error': 'Course is already assigned to an instructor'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Assign the course to the instructor
        course.instructor = request.user
        course.status = 'Active'
        course.save()
        
        logger.info(f"Successfully assigned course {pk} to instructor {request.user.id}")
        
        serializer = CourseSerializer(course)
        return Response(serializer.data)
        
    except Course.DoesNotExist:
        logger.error(f"Course not found: {pk}")
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in assign_to_me_view: {str(e)}")
        return Response(
            {'error': 'Failed to assign course'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsInstructor])
def request_course_assignment_view(request, pk):
    """Instructor requests assignment for a pending course"""
    try:
        logger.info(f"Request course assignment from user: {request.user.id} for course: {pk}")
        
        course = Course.objects.get(id=pk)
        logger.info(f"Found course: {course.name}, status: {course.status}, instructor: {course.instructor}, district: {course.district}")
        
        # Check if course is in instructor's district
        if course.district != request.user.district:
            logger.warning(f"District mismatch: course district {course.district} vs user district {request.user.district}")
            return Response(
                {'error': 'Can only request courses from your district'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if course.status != 'Pending':
            logger.warning(f"Course status is {course.status}, not Pending")
            return Response(
                {'error': 'Can only request assignment for pending courses'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if course.instructor is not None:
            logger.warning(f"Course already has instructor: {course.instructor.id}")
            return Response(
                {'error': 'Course is already assigned to an instructor'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create approval request instead of directly assigning
        approval = CourseApproval.objects.create(
            course=course,
            requested_by=request.user,
            approval_status='Pending',
            comments=f"Instructor {request.user.get_full_name()} requested assignment for this course"
        )
        
        logger.info(f"Successfully created assignment request for course {pk}")
        
        # Return course with approval info
        serializer = CourseSerializer(course)
        response_data = serializer.data
        response_data['approval_request_id'] = approval.id
        response_data['approval_status'] = 'requested'
        
        return Response(response_data)
        
    except Course.DoesNotExist:
        logger.error(f"Course not found: {pk}")
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in request_course_assignment_view: {str(e)}")
        return Response(
            {'error': 'Failed to request course assignment'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def courses_for_student(request):
    """Get courses available for student enrollment (only from user's district)"""
    try:
        center_id = request.GET.get('center')
        user = request.user
        
        logger.info(f"Courses for student request from user: {user.id}, role: {user.role}, district: {user.district}")
        
        queryset = Course.objects.filter(status__in=['Active', 'Approved'])
        logger.info(f"Found {queryset.count()} active/approved courses total")
        
        # Filter by center if provided
        if center_id:
            queryset = queryset.filter(center_id=center_id)
            logger.info(f"After center filter: {queryset.count()} courses")
        
        # Filter by user's district for non-admin users
        if user.role != 'admin' and user.district:
            queryset = queryset.filter(district=user.district)
            logger.info(f"After district filter: {queryset.count()} courses")
        
        serializer = CourseSerializer(queryset, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        logger.error(f"Error in courses_for_student: {str(e)}")
        return Response(
            {'error': 'Failed to load courses for student'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ==================== COURSE APPROVAL ACTIONS ====================
@api_view(['POST'])
@permission_classes([IsDistrictManager])
def approve_course_view(request, pk):
    """District manager approves a pending course"""
    try:
        logger.info(f"Approve course request from user: {request.user.id} for course: {pk}")
        
        course = Course.objects.get(id=pk)
        logger.info(f"Found course: {course.name}, status: {course.status}, district: {course.district}")
        
        # Check if course is in district manager's district
        if course.district != request.user.district:
            logger.warning(f"District mismatch: course district {course.district} vs user district {request.user.district}")
            return Response(
                {'error': 'Can only approve courses from your district'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if course.status != 'Pending':
            logger.warning(f"Course status is {course.status}, not Pending")
            return Response(
                {'error': 'Can only approve pending courses'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Approve the course
        course.status = 'Approved'
        course.save()
        
        # Create approval record
        CourseApproval.objects.create(
            course=course,
            requested_by=course.instructor if course.instructor else request.user,
            approval_status='Approved',
            approved_by=request.user,
            approved_at=timezone.now()
        )
        
        logger.info(f"Successfully approved course {pk}")
        
        serializer = CourseSerializer(course)
        return Response(serializer.data)
        
    except Course.DoesNotExist:
        logger.error(f"Course not found: {pk}")
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in approve_course_view: {str(e)}")
        return Response(
            {'error': 'Failed to approve course'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsDistrictManager])
def reject_course_view(request, pk):
    """District manager rejects a pending course"""
    try:
        logger.info(f"Reject course request from user: {request.user.id} for course: {pk}")
        
        course = Course.objects.get(id=pk)
        logger.info(f"Found course: {course.name}, status: {course.status}, district: {course.district}")
        
        # Check if course is in district manager's district
        if course.district != request.user.district:
            logger.warning(f"District mismatch: course district {course.district} vs user district {request.user.district}")
            return Response(
                {'error': 'Can only reject courses from your district'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if course.status != 'Pending':
            logger.warning(f"Course status is {course.status}, not Pending")
            return Response(
                {'error': 'Can only reject pending courses'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Reject the course
        course.status = 'Rejected'
        course.save()
        
        # Create approval record
        CourseApproval.objects.create(
            course=course,
            requested_by=course.instructor if course.instructor else request.user,
            approval_status='Rejected',
            approved_by=request.user,
            approved_at=timezone.now(),
            comments=request.data.get('comments', '')
        )
        
        logger.info(f"Successfully rejected course {pk}")
        
        serializer = CourseSerializer(course)
        return Response(serializer.data)
        
    except Course.DoesNotExist:
        logger.error(f"Course not found: {pk}")
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in reject_course_view: {str(e)}")
        return Response(
            {'error': 'Failed to reject course'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def course_categories_view(request):
    """Get all configured course categories"""
    try:
        categories = CourseCategory.objects.all()
        serializer = CourseCategorySerializer(categories, many=True)
        return Response([c['name'] for c in serializer.data])
    except Exception as e:
        logger.error(f"Error in course_categories_view: {str(e)}")
        # Fallback to existing categories in courses
        try:
            categories = Course.objects.exclude(category__isnull=True).exclude(category='').values_list('category', flat=True).distinct()
            return Response(list(categories))
        except:
            return Response(
                {'error': 'Failed to load course categories'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def course_durations_view(request):
    """Get all configured course durations"""
    try:
        durations = CourseDuration.objects.all()
        serializer = CourseDurationSerializer(durations, many=True)
        return Response([d['duration'] for d in serializer.data])
    except Exception as e:
        logger.error(f"Error in course_durations_view: {str(e)}")
        return Response(
            {'error': 'Failed to load course durations'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

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
        
        logger.info(f"CourseViewSet queryset request from user: {user.id}, role: {user.role}, district: {user.district}")
        
        # Filter based on user role
        if user.role == 'instructor':
            queryset = queryset.filter(instructor=user)
            logger.info(f"Instructor filtered courses: {queryset.count()}")
        elif user.role == 'district_manager':
            if user.district:
                queryset = queryset.filter(district=user.district)
                logger.info(f"District manager filtered courses: {queryset.count()}")
            else:
                logger.warning(f"District manager {user.id} has no district assigned")
                queryset = Course.objects.none()
        elif user.role == 'data_entry':
            if user.district:
                queryset = queryset.filter(district=user.district)
                logger.info(f"Data entry filtered courses: {queryset.count()}")
        elif user.role == 'training_officer':
            if user.district:
                queryset = queryset.filter(district=user.district)
                logger.info(f"Training officer filtered courses: {queryset.count()}")
        
        return queryset
    
    def perform_create(self, serializer):
        """Automatically set district and status when creating a course"""
        user = self.request.user
        
        logger.info(f"Course creation by user: {user.id}, role: {user.role}, district: {user.district}")
        
        # Set district based on user's district, or use provided district
        district = serializer.validated_data.get('district', user.district)
        
        logger.info(f"Creating course with district: {district}")
        
        # Training officers can create courses that start as Pending
        if user.role == 'training_officer':
            serializer.save(
                district=district,
                status='Pending',
                students=serializer.validated_data.get('students', 0),
                progress=serializer.validated_data.get('progress', 0),
                priority=serializer.validated_data.get('priority', 'Medium')
            )
            logger.info("Training officer created course with Pending status")
        else:
            # Other roles can create courses with provided status
            serializer.save(
                district=district,
                students=serializer.validated_data.get('students', 0),
                progress=serializer.validated_data.get('progress', 0),
                priority=serializer.validated_data.get('priority', 'Medium')
            )
            logger.info(f"User created course with status: {serializer.validated_data.get('status', 'Active')}")
    
    def perform_update(self, serializer):
        """Handle course updates with role-based restrictions"""
        user = self.request.user
        instance = self.get_object()
        
        logger.info(f"Course update by user: {user.id}, role: {user.role} for course: {instance.id}")
        
        # Training officers can only update their own pending courses
        if user.role == 'training_officer' and instance.status != 'Pending':
            logger.warning(f"Training officer tried to update non-pending course: {instance.id}")
            raise PermissionDenied("Training officers can only edit pending courses")
        
        # District managers can only update courses in their district
        if user.role == 'district_manager' and instance.district != user.district:
            logger.warning(f"District manager tried to update course from different district: {instance.district} vs {user.district}")
            raise PermissionDenied("Can only update courses in your district")
        
        serializer.save()
        logger.info(f"Successfully updated course: {instance.id}")
    
    def destroy(self, request, *args, **kwargs):
        """Handle course deletion with role-based restrictions"""
        user = self.request.user
        instance = self.get_object()
        
        logger.info(f"Course deletion attempt by user: {user.id}, role: {user.role} for course: {instance.id}")
        
        # Training officers can only delete their own pending courses
        if user.role == 'training_officer':
            if instance.status != 'Pending':
                logger.warning(f"Training officer tried to delete non-pending course: {instance.id}")
                return Response(
                    {'error': 'Training officers can only delete pending courses'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # District managers can only delete courses in their district
        elif user.role == 'district_manager':
            if instance.district != user.district:
                logger.warning(f"District manager tried to delete course from different district: {instance.district} vs {user.district}")
                return Response(
                    {'error': 'Can only delete courses in your district'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        logger.info(f"Successfully deleted course: {instance.id}")
        return super().destroy(request, *args, **kwargs)

# ==================== COURSE APPROVAL VIEWSET ====================
class CourseApprovalViewSet(viewsets.ModelViewSet):
    queryset = CourseApproval.objects.all()
    serializer_class = CourseApprovalSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = CourseApproval.objects.all()
        
        logger.info(f"CourseApprovalViewSet queryset request from user: {user.id}, role: {user.role}")
        
        if user.role == 'district_manager':
            # District managers can see approvals for their district
            if user.district:
                queryset = queryset.filter(course__district=user.district)
                logger.info(f"District manager filtered approvals: {queryset.count()}")
            else:
                logger.warning(f"District manager {user.id} has no district assigned")
                queryset = CourseApproval.objects.none()
        elif user.role in ['instructor', 'data_entry', 'training_officer']:
            # Can see their own approval requests
            queryset = queryset.filter(requested_by=user)
            logger.info(f"User filtered approvals: {queryset.count()}")
        
        return queryset
    
    def perform_create(self, serializer):
        """Automatically set the requested_by user when creating approval"""
        user = self.request.user
        logger.info(f"Creating course approval by user: {user.id}")
        serializer.save(requested_by=user)
        
# ==================== INSTRUCTOR REPORT & MANAGE VIEWS ====================

@api_view(['GET'])
@permission_classes([IsInstructor])
def course_details_view(request, pk):
    """Get detailed course information for management"""
    try:
        logger.info(f"Course details request from user: {request.user.id} for course: {pk}")
        
        course = Course.objects.get(id=pk)
        logger.info(f"Found course: {course.name}, instructor: {course.instructor.id if course.instructor else None}")
        
        # Check if instructor owns the course
        if request.user.role == 'instructor' and course.instructor != request.user:
            logger.warning(f"Instructor {request.user.id} tried to access course {pk} owned by {course.instructor.id if course.instructor else None}")
            return Response(
                {'error': 'You can only view your own courses'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = CourseSerializer(course)
        return Response(serializer.data)
        
    except Course.DoesNotExist:
        logger.error(f"Course not found: {pk}")
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in course_details_view: {str(e)}")
        return Response(
            {'error': 'Failed to load course details'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsInstructor])
def course_reports_view(request, pk):
    """Get course reports and analytics"""
    try:
        logger.info(f"Course reports request from user: {request.user.id} for course: {pk}")
        
        course = Course.objects.get(id=pk)
        
        # Check if instructor owns the course
        if request.user.role == 'instructor' and course.instructor != request.user:
            logger.warning(f"Instructor {request.user.id} tried to access reports for course {pk} owned by {course.instructor.id if course.instructor else None}")
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
        logger.error(f"Course not found: {pk}")
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in course_reports_view: {str(e)}")
        return Response(
            {'error': 'Failed to load course reports'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsInstructor])
def update_course_content(request, pk):
    """Update course content and materials"""
    try:
        logger.info(f"Update course content request from user: {request.user.id} for course: {pk}")
        
        course = Course.objects.get(id=pk)
        logger.info(f"Found course: {course.name}, instructor: {course.instructor.id if course.instructor else None}")
        
        # Check if instructor owns the course
        if course.instructor != request.user:
            logger.warning(f"Instructor {request.user.id} tried to update course {pk} owned by {course.instructor.id if course.instructor else None}")
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
        logger.info(f"Successfully updated course content for: {pk}")
        
        serializer = CourseSerializer(course)
        return Response(serializer.data)
        
    except Course.DoesNotExist:
        logger.error(f"Course not found: {pk}")
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in update_course_content: {str(e)}")
        return Response(
            {'error': 'Failed to update course content'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )