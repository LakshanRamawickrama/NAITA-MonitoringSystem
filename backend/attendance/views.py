# attendance/views.py - FIXED EXCEL GENERATION
import json
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q, Count, Case, When, IntegerField
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from datetime import datetime, timedelta
import pandas as pd
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import io
import logging

from .models import Attendance, AttendanceSummary
from .serializers import AttendanceSerializer, AttendanceSummarySerializer
from students.models import Student
from courses.models import Course

logger = logging.getLogger(__name__)

class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['course', 'date', 'status']
    
    def get_queryset(self):
        user = self.request.user
        queryset = Attendance.objects.all()
        
        # Instructors can only see attendance for their courses in their center
        if user.role == 'instructor':
            # Filter by instructor's courses
            queryset = queryset.filter(
                Q(course__instructor=user) | 
                Q(recorded_by=user)
            )
            
            # If user has a center, filter by that center
            if user.center:
                queryset = queryset.filter(course__center=user.center)
        
        # District managers can only see their district
        elif user.role == 'district_manager' and user.district:
            queryset = queryset.filter(course__center__district=user.district)
        
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
        
        # Verify instructor owns the course and it's in their center
        if user.role == 'instructor':
            try:
                course = Course.objects.get(id=course_id, instructor=user)
                # Additional center check
                if user.center and course.center != user.center:
                    return Response(
                        {'error': 'You do not have permission to access this course'}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Course.DoesNotExist:
                return Response(
                    {'error': 'Course not found or you do not have permission'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        else:
            course = Course.objects.get(id=course_id)
        
        # Get enrolled students from the same center
        students = Student.objects.filter(
            course=course_id,
            enrollment_status='Enrolled'
        )
        
        # If user has a center, filter students by that center
        if user.center:
            students = students.filter(center=user.center)
        
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
                'email': student.email,
                'phone': student.mobile_no,
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
        
        logger.info(f"Bulk attendance update request from user {user.id} for course {course_id} on date {date}")
        
        # Verify instructor owns the course and it's in their center
        if user.role == 'instructor':
            try:
                course = Course.objects.get(id=course_id, instructor=user)
                # Additional center check
                if user.center and course.center != user.center:
                    return Response(
                        {'error': 'You do not have permission to access this course'}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Course.DoesNotExist:
                return Response(
                    {'error': 'Course not found or you do not have permission'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
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
                status_val = record.get('status', 'absent')
                check_in_time = record.get('check_in_time')
                remarks = record.get('remarks')
                
                # Get student and verify they belong to the same center
                try:
                    student = Student.objects.get(id=student_id)
                    # Center check for students
                    if user.center and student.center != user.center:
                        errors.append(f"Student {student_id} does not belong to your center")
                        continue
                except Student.DoesNotExist:
                    errors.append(f"Student with ID {student_id} not found")
                    continue
                
                # Create or update attendance record
                attendance, created = Attendance.objects.update_or_create(
                    student=student,
                    course=course,
                    date=date,
                    defaults={
                        'status': status_val,
                        'check_in_time': check_in_time if status_val != 'absent' else None,
                        'remarks': remarks,
                        'recorded_by': user
                    }
                )
                updated_count += 1
                logger.info(f"Updated attendance for student {student_id}: {status_val}")
                
            except Exception as e:
                error_msg = f"Failed to update attendance for student {student_id}: {str(e)}"
                errors.append(error_msg)
                logger.error(error_msg)
        
        # Update summary
        if updated_count > 0:
            try:
                # Recalculate summary for this course and date
                attendance_records = Attendance.objects.filter(
                    course=course,
                    date=date
                )
                
                total_students = attendance_records.count()
                present_count = attendance_records.filter(status='present').count()
                absent_count = attendance_records.filter(status='absent').count()
                late_count = attendance_records.filter(status='late').count()
                
                attendance_rate = (
                    (present_count + late_count * 0.8) / total_students * 100
                    if total_students > 0 else 0
                )
                
                # Update or create summary
                summary, created = AttendanceSummary.objects.update_or_create(
                    course=course,
                    date=date,
                    defaults={
                        'total_students': total_students,
                        'present_count': present_count,
                        'absent_count': absent_count,
                        'late_count': late_count,
                        'attendance_rate': attendance_rate
                    }
                )
                logger.info(f"Updated attendance summary: {present_count} present, {absent_count} absent, {late_count} late")
                
            except Exception as e:
                logger.error(f"Error updating attendance summary: {str(e)}")
        
        response_data = {
            'message': f'Successfully updated {updated_count} attendance records',
            'updated': updated_count,
            'errors': errors
        }
        
        if errors:
            response_data['warning'] = f'Completed with {len(errors)} errors'
            
        logger.info(f"Bulk update completed: {response_data}")
        return Response(response_data)
        
    except Course.DoesNotExist:
        logger.error(f"Course not found: {course_id}")
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
        
        # Verify instructor owns the course and it's in their center
        if user.role == 'instructor':
            try:
                course = Course.objects.get(id=course_id, instructor=user)
                # Additional center check
                if user.center and course.center != user.center:
                    return Response(
                        {'error': 'You do not have permission to access this course'}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Course.DoesNotExist:
                return Response(
                    {'error': 'Course not found or you do not have permission'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_attendance_stats(request, course_id):
    """Get attendance statistics for all students in a course"""
    try:
        user = request.user
        
        # Verify instructor owns the course and it's in their center
        if user.role == 'instructor':
            try:
                course = Course.objects.get(id=course_id, instructor=user)
                # Additional center check
                if user.center and course.center != user.center:
                    return Response(
                        {'error': 'You do not have permission to access this course'}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Course.DoesNotExist:
                return Response(
                    {'error': 'Course not found or you do not have permission'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        else:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all students enrolled in the course from the same center
        students = Student.objects.filter(
            course_id=course_id,
            enrollment_status='Enrolled'
        )
        
        # If user has a center, filter students by that center
        if user.center:
            students = students.filter(center=user.center)
        
        # Calculate attendance for each student
        student_stats = []
        for student in students:
            # Get all attendance records for this student in this course
            attendance_records = Attendance.objects.filter(
                student=student,
                course=course
            )
            
            total_classes = attendance_records.count()
            if total_classes > 0:
                present_classes = attendance_records.filter(status='present').count()
                late_classes = attendance_records.filter(status='late').count()
                
                # Calculate attendance percentage (late counts as 0.8 of present)
                attendance_percentage = round(
                    ((present_classes + late_classes * 0.8) / total_classes) * 100, 2
                )
            else:
                attendance_percentage = 0
            
            # Determine status based on attendance
            if attendance_percentage >= 80:
                status = 'active'
            elif attendance_percentage >= 60:
                status = 'at-risk'
            else:
                status = 'inactive'
            
            # Get last activity date
            last_attendance = attendance_records.order_by('-date').first()
            last_active = last_attendance.date if last_attendance else 'Never'
            
            student_stats.append({
                'id': student.id,
                'name': student.full_name_english,
                'email': student.email,
                'phone': student.mobile_no,
                'nic': student.nic_id,
                'attendance_percentage': attendance_percentage,
                'total_classes': total_classes,
                'present_classes': present_classes,
                'late_classes': late_classes,
                'absent_classes': attendance_records.filter(status='absent').count(),
                'status': status,
                'last_active': last_active,
                'enrollment_status': student.enrollment_status
            })
        
        return Response(student_stats)
        
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error getting student attendance stats: {str(e)}")
        return Response(
            {'error': 'Failed to load student statistics'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ========== ATTENDANCE REPORT FUNCTIONS ==========

def generate_report_data(course, period, start_date, end_date):
    """Generate attendance report data"""
    # Calculate date range based on period
    today = timezone.now().date()
    
    if period == 'daily':
        start_date = today
        end_date = today
    elif period == 'weekly':
        start_date = today - timedelta(days=today.weekday())
        end_date = today
    elif period == 'monthly':
        start_date = today.replace(day=1)
        end_date = today
    
    # Fetch attendance data
    attendance_records = Attendance.objects.filter(
        course=course,
        date__range=[start_date, end_date]
    ).select_related('student', 'recorded_by')
    
    # Prepare report data
    report_data = {
        'course': course,
        'period': period,
        'start_date': start_date,
        'end_date': end_date,
        'records': [],
        'summary': {
            'total_students': Student.objects.filter(course=course, enrollment_status='Enrolled').count(),
            'total_records': attendance_records.count(),
            'present_count': attendance_records.filter(status='present').count(),
            'absent_count': attendance_records.filter(status='absent').count(),
            'late_count': attendance_records.filter(status='late').count(),
        }
    }
    
    # Add individual records
    for record in attendance_records:
        report_data['records'].append({
            'student_name': record.student.full_name_english,
            'student_nic': record.student.nic_id,
            'student_email': record.student.email,
            'date': record.date,
            'status': record.status,
            'check_in_time': record.check_in_time,
            'remarks': record.remarks,
            'recorded_by': f"{record.recorded_by.first_name} {record.recorded_by.last_name}",
            'recorded_at': record.recorded_at
        })
    
    return report_data

def generate_excel_report(report_data, course, period):
    """Generate Excel report - SIMPLIFIED VERSION"""
    try:
        # Create DataFrame with basic data
        df_data = []
        for record in report_data['records']:
            df_data.append({
                'Student Name': record['student_name'],
                'NIC': record['student_nic'],
                'Email': record['student_email'],
                'Date': record['date'].strftime('%Y-%m-%d'),
                'Status': record['status'].title(),
                'Check-in Time': record['check_in_time'] or '-',
                'Remarks': record['remarks'] or '-',
                'Recorded By': record['recorded_by'],
                'Recorded At': record['recorded_at'].strftime('%Y-%m-%d %H:%M')
            })
        
        df = pd.DataFrame(df_data)
        
        # Create Excel file in memory - SIMPLIFIED APPROACH
        output = io.BytesIO()
        
        # Use openpyxl which is more reliable and commonly available
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            # Main data sheet
            df.to_excel(writer, sheet_name='Attendance Data', index=False)
            
            # Summary sheet
            summary_data = {
                'Metric': ['Total Students', 'Total Records', 'Present', 'Absent', 'Late', 'Attendance Rate'],
                'Count': [
                    report_data['summary']['total_students'],
                    report_data['summary']['total_records'],
                    report_data['summary']['present_count'],
                    report_data['summary']['absent_count'],
                    report_data['summary']['late_count'],
                    f"{(report_data['summary']['present_count'] + report_data['summary']['late_count'] * 0.8) / report_data['summary']['total_records'] * 100:.1f}%" if report_data['summary']['total_records'] > 0 else '0%'
                ]
            }
            summary_df = pd.DataFrame(summary_data)
            summary_df.to_excel(writer, sheet_name='Summary', index=False)
            
            # Get the workbook and worksheets for basic formatting
            workbook = writer.book
            worksheet_data = writer.sheets['Attendance Data']
            worksheet_summary = writer.sheets['Summary']
            
            # Basic column width adjustment
            for col in worksheet_data.columns:
                max_length = 0
                column = col[0].column_letter
                for cell in col:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)  # Cap at 50
                worksheet_data.column_dimensions[column].width = adjusted_width
            
            for col in worksheet_summary.columns:
                max_length = 0
                column = col[0].column_letter
                for cell in col:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 30)
                worksheet_summary.column_dimensions[column].width = adjusted_width
        
        # Get the file content
        file_content = output.getvalue()
        output.close()
        
        file_name = f"attendance_report_{course.code}_{period}_{timezone.now().strftime('%Y%m%d_%H%M')}.xlsx"
        
        return file_content, file_name
        
    except Exception as e:
        logger.error(f"Error generating Excel report: {str(e)}")
        # Fallback: Create a very basic Excel file
        try:
            output = io.BytesIO()
            
            # Create a simple DataFrame with just the essential data
            simple_data = []
            for record in report_data['records'][:100]:  # Limit to 100 records for fallback
                simple_data.append({
                    'Student': record['student_name'],
                    'NIC': record['student_nic'],
                    'Date': record['date'].strftime('%Y-%m-%d'),
                    'Status': record['status'].title()
                })
            
            df_simple = pd.DataFrame(simple_data)
            df_simple.to_excel(output, index=False, engine='openpyxl')
            
            file_content = output.getvalue()
            output.close()
            
            file_name = f"attendance_report_{course.code}_{period}_{timezone.now().strftime('%Y%m%d_%H%M')}.xlsx"
            
            return file_content, file_name
        except Exception as fallback_error:
            logger.error(f"Fallback Excel generation also failed: {str(fallback_error)}")
            raise e

def generate_pdf_report(report_data, course, period):
    """Generate PDF report"""
    try:
        # Create PDF in memory
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*inch)
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            alignment=1  # Center
        )
        
        # Content
        content = []
        
        # Title
        content.append(Paragraph(f"Attendance Report - {course.name}", title_style))
        content.append(Paragraph(f"Course: {course.code} | Period: {period.title()}", styles['Heading2']))
        content.append(Paragraph(f"Date Range: {report_data['start_date']} to {report_data['end_date']}", styles['Heading3']))
        content.append(Spacer(1, 20))
        
        # Summary table
        summary_data = [
            ['Total Students', 'Total Records', 'Present', 'Absent', 'Late', 'Attendance Rate'],
            [
                str(report_data['summary']['total_students']),
                str(report_data['summary']['total_records']),
                str(report_data['summary']['present_count']),
                str(report_data['summary']['absent_count']),
                str(report_data['summary']['late_count']),
                f"{(report_data['summary']['present_count'] + report_data['summary']['late_count'] * 0.8) / report_data['summary']['total_records'] * 100:.1f}%" if report_data['summary']['total_records'] > 0 else '0%'
            ]
        ]
        
        summary_table = Table(summary_data, colWidths=[1.2*inch]*6)
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, 1), colors.beige),
            ('FONTSIZE', (0, 1), (-1, 1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        content.append(summary_table)
        content.append(Spacer(1, 20))
        
        # Attendance data table
        if report_data['records']:
            data = [['Student Name', 'NIC', 'Date', 'Status', 'Check-in', 'Remarks']]
            for record in report_data['records'][:50]:  # Limit to first 50 records
                data.append([
                    record['student_name'],
                    record['student_nic'],
                    record['date'].strftime('%Y-%m-%d'),
                    record['status'].title(),
                    record['check_in_time'] or '-',
                    record['remarks'] or '-'
                ])
            
            attendance_table = Table(data, repeatRows=1)
            attendance_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 8),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('FONTSIZE', (0, 1), (-1, -1), 7),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            content.append(attendance_table)
        
        # Build PDF
        doc.build(content)
        
        # Get file content from buffer
        file_content = buffer.getvalue()
        buffer.close()
        
        file_name = f"attendance_report_{course.code}_{period}_{timezone.now().strftime('%Y%m%d_%H%M')}.pdf"
        
        return file_content, file_name
        
    except Exception as e:
        logger.error(f"Error generating PDF report: {str(e)}")
        raise

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_attendance_report(request):
    """Generate attendance report in Excel or PDF format"""
    try:
        data = request.data
        course_id = data.get('course_id')
        period = data.get('period')
        format_type = data.get('format')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        # Validate input
        if not all([course_id, period, format_type]):
            return Response({
                'success': False,
                'message': 'Missing required fields: course_id, period, format'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user has access to this course
        course = get_object_or_404(Course, id=course_id)
        if request.user.role != 'admin' and course.instructor != request.user:
            return Response({
                'success': False,
                'message': 'Access denied - You are not assigned to this course'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Generate report data
        report_data = generate_report_data(course, period, start_date, end_date)
        
        # Generate file based on format
        if format_type == 'excel':
            file_content, file_name = generate_excel_report(report_data, course, period)
            content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        else:  # pdf
            file_content, file_name = generate_pdf_report(report_data, course, period)
            content_type = 'application/pdf'
        
        # Create response with file
        response = HttpResponse(file_content, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{file_name}"'
        response['Content-Length'] = len(file_content)
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to generate report: {str(e)}")
        return Response({
            'success': False,
            'message': f'Failed to generate report: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_attendance_report(request, report_id):
    """Download a previously generated report"""
    try:
        # This would typically retrieve a saved report from database
        # For now, we'll generate on-demand
        return Response({
            'success': False,
            'message': 'Report download not implemented yet'
        }, status=status.HTTP_501_NOT_IMPLEMENTED)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Failed to download report: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
# Add to attendance/views.py
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def scan_qr_attendance(request):
    """Scan QR code for attendance"""
    try:
        qr_data = request.data.get('qr_data')
        course_id = request.data.get('course_id')
        
        if not qr_data or not course_id:
            return Response({'error': 'Missing QR data or course ID'}, status=400)
        
        # Parse QR data
        try:
            data = json.loads(qr_data)
        except:
            return Response({'error': 'Invalid QR code data'}, status=400)
        
        student_id = data.get('student_id')
        registration_no = data.get('registration_no')
        
        # Find student
        if student_id:
            student = Student.objects.get(id=student_id)
        elif registration_no:
            student = Student.objects.get(registration_no=registration_no)
        else:
            return Response({'error': 'Student not found in QR data'}, status=404)
        
        # Get course
        course = Course.objects.get(id=course_id)
        
        # Check if student is enrolled in this course
        if student.course != course:
            return Response({'error': 'Student is not enrolled in this course'}, status=400)
        
        # Create attendance record
        today = timezone.now().date()
        current_time = timezone.now().time()
        
        # Check if already marked today
        attendance, created = Attendance.objects.get_or_create(
            student=student,
            course=course,
            date=today,
            defaults={
                'status': 'present',
                'check_in_time': current_time,
                'recorded_by': request.user
            }
        )
        
        if not created:
            # Update existing record
            attendance.status = 'present'
            attendance.check_in_time = current_time
            attendance.recorded_by = request.user
            attendance.save()
        
        return Response({
            'success': True,
            'student': {
                'id': student.id,
                'name': student.full_name_english,
                'registration_no': student.registration_no
            },
            'attendance': {
                'id': attendance.id,
                'status': attendance.status,
                'check_in_time': attendance.check_in_time,
                'created': created
            }
        })
        
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=404)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)