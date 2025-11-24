# attendance/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q, Count, Case, When, IntegerField
from .models import Attendance, AttendanceSummary
from .serializers import AttendanceSerializer, AttendanceSummarySerializer
from students.models import Student
from courses.models import Course
import logging

logger = logging.getLogger(__name__)

class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['course', 'date', 'status']
    
    def get_queryset(self):
        user = self.request.user
        queryset = Attendance.objects.all()
        
        # Instructors can only see attendance for their courses
        if user.role == 'instructor':
            queryset = queryset.filter(
                Q(course__instructor=user) | 
                Q(recorded_by=user)
            )
        
        # Filter by course if provided
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
            
        # Filter by date if provided
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(date=date)
        else:
            # Default to today
            queryset = queryset.filter(date=timezone.now().date())
            
        return queryset.select_related('student', 'course', 'recorded_by')
    
    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)
        self._update_attendance_summary(serializer.instance)
    
    def perform_update(self, serializer):
        instance = serializer.save()
        self._update_attendance_summary(instance)
    
    def _update_attendance_summary(self, attendance_instance):
        """Update attendance summary for the course and date"""
        try:
            summary, created = AttendanceSummary.objects.get_or_create(
                course=attendance_instance.course,
                date=attendance_instance.date,
                defaults={
                    'total_students': 0,
                    'present_count': 0,
                    'absent_count': 0,
                    'late_count': 0,
                    'attendance_rate': 0.0
                }
            )
            
            # Recalculate counts
            attendance_data = Attendance.objects.filter(
                course=attendance_instance.course,
                date=attendance_instance.date
            ).aggregate(
                total=Count('id'),
                present=Count(Case(When(status='present', then=1), output_field=IntegerField())),
                absent=Count(Case(When(status='absent', then=1), output_field=IntegerField())),
                late=Count(Case(When(status='late', then=1), output_field=IntegerField()))
            )
            
            summary.total_students = attendance_data['total']
            summary.present_count = attendance_data['present']
            summary.absent_count = attendance_data['absent']
            summary.late_count = attendance_data['late']
            summary.attendance_rate = (
                (attendance_data['present'] + attendance_data['late'] * 0.5) / 
                attendance_data['total'] * 100
                if attendance_data['total'] > 0 else 0
            )
            summary.save()
            
        except Exception as e:
            logger.error(f"Error updating attendance summary: {str(e)}")

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_course_students(request, course_id):
    """Get students enrolled in a course for attendance"""
    try:
        user = request.user
        
        # Verify instructor owns the course
        if user.role == 'instructor':
            course = Course.objects.get(id=course_id, instructor=user)
        else:
            course = Course.objects.get(id=course_id)
        
        # Get enrolled students (you'll need to implement enrollment system)
        # For now, using all students - replace with actual enrollment logic
        students = Student.objects.filter(
            course=course_id,
            enrollment_status='Enrolled'
        )
        
        # Get today's attendance records
        today = timezone.now().date()
        attendance_records = Attendance.objects.filter(
            course=course_id,
            date=today
        )
        
        # Prepare response data
        student_data = []
        for student in students:
            attendance_record = attendance_records.filter(student=student).first()
            student_data.append({
                'id': student.id,
                'name': student.full_name_english,
                'nic': student.nic_id,
                'attendance_status': attendance_record.status if attendance_record else None,
                'check_in_time': attendance_record.check_in_time if attendance_record else None,
                'remarks': attendance_record.remarks if attendance_record else None,
            })
        
        return Response(student_data)
        
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error getting course students: {str(e)}")
        return Response(
            {'error': 'Failed to load students'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_update_attendance(request, course_id):
    """Bulk update attendance for multiple students"""
    try:
        user = request.user
        date = request.data.get('date', timezone.now().date())
        attendance_data = request.data.get('attendance', [])
        
        # Verify instructor owns the course
        if user.role == 'instructor':
            course = Course.objects.get(id=course_id, instructor=user)
        else:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        updated_count = 0
        errors = []
        
        for record in attendance_data:
            try:
                student_id = record.get('student_id')
                status = record.get('status')
                check_in_time = record.get('check_in_time')
                remarks = record.get('remarks')
                
                attendance, created = Attendance.objects.update_or_create(
                    student_id=student_id,
                    course_id=course_id,
                    date=date,
                    defaults={
                        'status': status,
                        'check_in_time': check_in_time if status != 'absent' else None,
                        'remarks': remarks,
                        'recorded_by': user
                    }
                )
                updated_count += 1
                
            except Exception as e:
                errors.append(f"Failed to update attendance for student {student_id}: {str(e)}")
        
        # Update summary
        if updated_count > 0:
            summary_view = AttendanceViewSet()
            # Trigger summary update for any record
            try:
                first_attendance = Attendance.objects.filter(
                    course_id=course_id, date=date
                ).first()
                if first_attendance:
                    summary_view._update_attendance_summary(first_attendance)
            except Exception as e:
                logger.error(f"Error updating summary after bulk update: {str(e)}")
        
        return Response({
            'message': f'Successfully updated {updated_count} attendance records',
            'updated': updated_count,
            'errors': errors
        })
        
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in bulk attendance update: {str(e)}")
        return Response(
            {'error': 'Failed to update attendance'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_attendance_summary(request, course_id):
    """Get attendance summary for a course"""
    try:
        user = request.user
        
        # Verify instructor owns the course
        if user.role == 'instructor':
            course = Course.objects.get(id=course_id, instructor=user)
        else:
            course = Course.objects.get(id=course_id)
        
        # Get date from query params or use today
        date_str = request.GET.get('date')
        if date_str:
            date = timezone.datetime.strptime(date_str, '%Y-%m-%d').date()
        else:
            date = timezone.now().date()
        
        # Get or create summary
        summary, created = AttendanceSummary.objects.get_or_create(
            course=course,
            date=date,
            defaults={
                'total_students': 0,
                'present_count': 0,
                'absent_count': 0,
                'late_count': 0,
                'attendance_rate': 0.0
            }
        )
        
        serializer = AttendanceSummarySerializer(summary)
        return Response(serializer.data)
        
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error getting attendance summary: {str(e)}")
        return Response(
            {'error': 'Failed to load attendance summary'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )