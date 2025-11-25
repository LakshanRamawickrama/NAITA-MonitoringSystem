# reports/views.py - UPDATED WITH EXPORT FUNCTIONALITY
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from centers.models import Center
from courses.models import Course, CourseApproval
from students.models import Student
from approvals.models import Approval
from attendance.models import Attendance
import logging
import csv
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import pandas as pd

logger = logging.getLogger(__name__)
User = get_user_model()

class IsDistrictManagerOrTrainingOfficer(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role in ["district_manager", "training_officer"]

def generate_report_data(user, period):
    """Generate report data for both API and export"""
    district = user.district
    
    # Training-specific metrics - REAL DATA
    students_queryset = Student.objects.filter(district=district)
    courses_queryset = Course.objects.filter(district=district)
    instructors_queryset = User.objects.filter(district=district, role='instructor', is_active=True)
    centers_queryset = Center.objects.filter(district=district)
    
    # Training program metrics - REAL DATA
    training_programs = {
        'total_programs': courses_queryset.count(),
        'active_programs': courses_queryset.filter(status='Active').count(),
        'pending_approval': courses_queryset.filter(status='Pending').count(),
        'approved_programs': courses_queryset.filter(status='Approved').count(),
        'completed_programs': courses_queryset.filter(status='Completed').count(),
        'inactive_programs': courses_queryset.filter(status='Inactive').count()
    }
    
    # Student training progress - REAL DATA
    training_progress = {
        'total_trained': students_queryset.filter(training_received=True).count(),
        'in_training': students_queryset.filter(enrollment_status='Enrolled').count(),
        'completed_training': students_queryset.filter(enrollment_status='Completed').count(),
        'awaiting_training': students_queryset.filter(enrollment_status='Pending').count(),
        'dropped_training': students_queryset.filter(enrollment_status='Dropped').count()
    }
    
    # Center performance - REAL DATA
    center_performance = []
    for center in centers_queryset:
        center_students = students_queryset.filter(center=center)
        center_courses = courses_queryset.filter(center=center)
        
        completion_rate = 0
        if center_students.count() > 0:
            completed_students = center_students.filter(enrollment_status='Completed').count()
            completion_rate = (completed_students / center_students.count()) * 100
        
        attendance_rate = 0
        center_attendance = Attendance.objects.filter(course__center=center)
        if center_attendance.count() > 0:
            present_count = center_attendance.filter(status='present').count()
            attendance_rate = (present_count / center_attendance.count()) * 100
        
        center_performance.append({
            'center_name': center.name,
            'total_students': center_students.count(),
            'total_courses': center_courses.count(),
            'completion_rate': round(completion_rate, 1),
            'attendance_rate': round(attendance_rate, 1),
            'performance': 'Excellent' if completion_rate >= 80 else 
                          'Good' if completion_rate >= 60 else 
                          'Average' if completion_rate >= 40 else 'Needs Improvement'
        })
    
    # Instructor performance metrics - REAL DATA
    instructor_metrics = []
    for instructor in instructors_queryset:
        instructor_courses = courses_queryset.filter(instructor=instructor)
        instructor_students = students_queryset.filter(course__in=instructor_courses)
        
        total_students = instructor_students.count()
        completed_students = instructor_students.filter(enrollment_status='Completed').count()
        
        completion_rate = 0
        if total_students > 0:
            completion_rate = (completed_students / total_students) * 100
        
        instructor_attendance = Attendance.objects.filter(course__instructor=instructor)
        attendance_rate = 0
        if instructor_attendance.count() > 0:
            present_count = instructor_attendance.filter(status='present').count()
            attendance_rate = (present_count / instructor_attendance.count()) * 100
        
        instructor_metrics.append({
            'instructor_name': f"{instructor.first_name} {instructor.last_name}",
            'email': instructor.email,
            'total_courses': instructor_courses.count(),
            'total_students': total_students,
            'completed_students': completed_students,
            'completion_rate': round(completion_rate, 1),
            'attendance_rate': round(attendance_rate, 1),
            'performance': 'Excellent' if completion_rate >= 80 else 
                          'Good' if completion_rate >= 60 else 
                          'Average' if completion_rate >= 40 else 'Needs Improvement'
        })
    
    # Course effectiveness - REAL DATA
    course_effectiveness = []
    for course in courses_queryset.filter(status__in=['Active', 'Completed']):
        course_students = students_queryset.filter(course=course)
        
        completion_rate = 0
        if course_students.count() > 0:
            completion_rate = (course_students.filter(enrollment_status='Completed').count() / course_students.count()) * 100
        
        course_attendance = Attendance.objects.filter(course=course)
        attendance_rate = 0
        if course_attendance.count() > 0:
            present_count = course_attendance.filter(status='present').count()
            attendance_rate = (present_count / course_attendance.count()) * 100
        
        course_effectiveness.append({
            'course_name': course.name,
            'course_code': course.code,
            'category': course.category or 'General',
            'instructor': f"{course.instructor.first_name} {course.instructor.last_name}" if course.instructor else 'Not Assigned',
            'status': course.status,
            'total_enrolled': course_students.count(),
            'completion_rate': round(completion_rate, 1),
            'attendance_rate': round(attendance_rate, 1),
            'duration': course.duration or 'Not specified',
            'schedule': course.schedule or 'Not specified'
        })
    
    # Training trends (last 6 months) - REAL DATA
    training_trends = []
    for i in range(5, -1, -1):
        month_start = timezone.now().replace(day=1) - timedelta(days=30*i)
        month_name = month_start.strftime('%b %Y')
        
        monthly_students = students_queryset.filter(
            created_at__year=month_start.year,
            created_at__month=month_start.month
        ).count()
        
        monthly_completions = students_queryset.filter(
            enrollment_status='Completed',
            updated_at__year=month_start.year,
            updated_at__month=month_start.month
        ).count()
        
        monthly_courses = courses_queryset.filter(
            created_at__year=month_start.year,
            created_at__month=month_start.month
        ).count()
        
        training_trends.append({
            'month': month_name,
            'new_students': monthly_students,
            'completed_training': monthly_completions,
            'new_courses': monthly_courses
        })
    
    # Pending approvals - REAL DATA
    pending_approvals = {
        'course_approvals': CourseApproval.objects.filter(
            course__district=district,
            approval_status='Pending'
        ).count(),
        'general_approvals': Approval.objects.filter(
            center__in=[center.name for center in centers_queryset],
            status='pending'
        ).count()
    }
    
    # Overall statistics - REAL DATA
    overall_stats = {
        'total_students': students_queryset.count(),
        'total_centers': centers_queryset.count(),
        'total_instructors': instructors_queryset.count(),
        'total_courses': courses_queryset.count(),
        'active_courses': courses_queryset.filter(status='Active').count(),
        'completion_rate': round(training_progress['completed_training'] / training_progress['total_trained'] * 100, 1) if training_progress['total_trained'] > 0 else 0
    }
    
    return {
        'overall_stats': overall_stats,
        'training_programs': training_programs,
        'training_progress': training_progress,
        'center_performance': center_performance,
        'instructor_metrics': instructor_metrics,
        'course_effectiveness': course_effectiveness,
        'training_trends': training_trends,
        'pending_approvals': pending_approvals,
        'user_district': district,
        'period': period,
        'report_generated_at': timezone.now().isoformat(),
        'generated_by': f"{user.first_name} {user.last_name}"
    }

@api_view(['GET'])
@permission_classes([IsDistrictManagerOrTrainingOfficer])
def training_officer_reports(request):
    """Specialized reports for training officers - REAL DATA ONLY"""
    try:
        user = request.user
        period = request.query_params.get('period', 'monthly')
        report_data = generate_report_data(user, period)
        return Response(report_data, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error generating training officer report: {str(e)}")
        return Response({
            'error': 'Failed to generate report',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsDistrictManagerOrTrainingOfficer])
def export_training_report(request):
    """Export training report in PDF or Excel format"""
    try:
        format_type = request.query_params.get('format', 'pdf')
        period = request.query_params.get('period', 'monthly')
        report_type = request.query_params.get('report_type', 'comprehensive')
        
        user = request.user
        report_data = generate_report_data(user, period)
        
        if format_type == 'excel':
            return generate_excel_export(report_data, report_type)
        else:
            return generate_pdf_export(report_data, report_type)
    
    except Exception as e:
        logger.error(f"Error exporting training report: {str(e)}")
        return Response({
            'error': 'Failed to export report',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def generate_excel_export(report_data, report_type):
    """Generate Excel export"""
    try:
        output = io.BytesIO()
        
        with pd.ExcelWriter(output, engine='openpyxl') as writer:  # Changed to openpyxl since xlsxwriter may not be available
            # Summary Sheet
            summary_data = [
                ['Training Report Summary', ''],
                ['District', report_data['user_district']],
                ['Period', report_data['period']],
                ['Generated At', report_data['report_generated_at']],
                ['Generated By', report_data['generated_by']],
                ['', ''],
                ['Overall Statistics', ''],
                ['Total Students', report_data['overall_stats']['total_students']],
                ['Total Centers', report_data['overall_stats']['total_centers']],
                ['Total Instructors', report_data['overall_stats']['total_instructors']],
                ['Total Courses', report_data['overall_stats']['total_courses']],
                ['Active Courses', report_data['overall_stats']['active_courses']],
                ['Completion Rate', f"{report_data['overall_stats']['completion_rate']}%"],
            ]
            
            summary_df = pd.DataFrame(summary_data)
            summary_df.to_excel(writer, sheet_name='Summary', index=False, header=False)
            
            # Training Programs Sheet
            programs_data = [
                ['Training Program Statistics'],
                ['Total Programs', report_data['training_programs']['total_programs']],
                ['Active Programs', report_data['training_programs']['active_programs']],
                ['Pending Approval', report_data['training_programs']['pending_approval']],
                ['Approved Programs', report_data['training_programs']['approved_programs']],
                ['Completed Programs', report_data['training_programs']['completed_programs']],
                ['Inactive Programs', report_data['training_programs']['inactive_programs']],
            ]
            
            programs_df = pd.DataFrame(programs_data)
            programs_df.to_excel(writer, sheet_name='Training Programs', index=False, header=False)
            
            # Center Performance Sheet
            if report_data['center_performance']:
                center_data = []
                center_data.append(['Center Name', 'Total Students', 'Total Courses', 'Completion Rate', 'Attendance Rate', 'Performance'])
                for center in report_data['center_performance']:
                    center_data.append([
                        center['center_name'],
                        center['total_students'],
                        center['total_courses'],
                        f"{center['completion_rate']}%",
                        f"{center['attendance_rate']}%",
                        center['performance']
                    ])
                
                center_df = pd.DataFrame(center_data[1:], columns=center_data[0])
                center_df.to_excel(writer, sheet_name='Center Performance', index=False)
            
            # Instructor Performance Sheet
            if report_data['instructor_metrics']:
                instructor_data = []
                instructor_data.append(['Instructor Name', 'Email', 'Total Courses', 'Total Students', 'Completion Rate', 'Attendance Rate', 'Performance'])
                for instructor in report_data['instructor_metrics']:
                    instructor_data.append([
                        instructor['instructor_name'],
                        instructor['email'],
                        instructor['total_courses'],
                        instructor['total_students'],
                        f"{instructor['completion_rate']}%",
                        f"{instructor['attendance_rate']}%",
                        instructor['performance']
                    ])
                
                instructor_df = pd.DataFrame(instructor_data[1:], columns=instructor_data[0])
                instructor_df.to_excel(writer, sheet_name='Instructor Performance', index=False)
            
            # Course Effectiveness Sheet
            if report_data['course_effectiveness']:
                course_data = []
                course_data.append(['Course Name', 'Course Code', 'Category', 'Instructor', 'Status', 'Total Enrolled', 'Completion Rate', 'Attendance Rate'])
                for course in report_data['course_effectiveness']:
                    course_data.append([
                        course['course_name'],
                        course['course_code'],
                        course['category'],
                        course['instructor'],
                        course['status'],
                        course['total_enrolled'],
                        f"{course['completion_rate']}%",
                        f"{course['attendance_rate']}%"
                    ])
                
                course_df = pd.DataFrame(course_data[1:], columns=course_data[0])
                course_df.to_excel(writer, sheet_name='Course Effectiveness', index=False)
        
        output.seek(0)
        
        response = Response(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="training_report_{report_data["user_district"]}_{report_data["period"]}_{timezone.now().strftime("%Y%m%d_%H%M%S")}.xlsx"'
        
        return response
        
    except Exception as e:
        logger.error(f"Error generating Excel export: {str(e)}")
        raise e

def generate_pdf_export(report_data, report_type):
    """Generate PDF export"""
    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*inch)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            alignment=1,  # Center aligned
        )
        
        title = Paragraph(f"Training Report - {report_data['user_district']} District", title_style)
        story.append(title)
        
        # Report Info
        info_data = [
            ['Period', report_data['period']],
            ['Generated', report_data['report_generated_at']],
            ['Generated By', report_data['generated_by']]
        ]
        
        info_table = Table(info_data, colWidths=[2*inch, 4*inch])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(info_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Overall Statistics
        story.append(Paragraph("Overall Statistics", styles['Heading2']))
        stats_data = [
            ['Metric', 'Value'],
            ['Total Students', str(report_data['overall_stats']['total_students'])],
            ['Total Centers', str(report_data['overall_stats']['total_centers'])],
            ['Total Instructors', str(report_data['overall_stats']['total_instructors'])],
            ['Total Courses', str(report_data['overall_stats']['total_courses'])],
            ['Active Courses', str(report_data['overall_stats']['active_courses'])],
            ['Completion Rate', f"{report_data['overall_stats']['completion_rate']}%"]
        ]
        
        stats_table = Table(stats_data, colWidths=[3*inch, 3*inch])
        stats_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(stats_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Training Programs
        story.append(Paragraph("Training Programs", styles['Heading2']))
        programs_data = [
            ['Program Type', 'Count'],
            ['Total Programs', str(report_data['training_programs']['total_programs'])],
            ['Active Programs', str(report_data['training_programs']['active_programs'])],
            ['Pending Approval', str(report_data['training_programs']['pending_approval'])],
            ['Approved Programs', str(report_data['training_programs']['approved_programs'])],
            ['Completed Programs', str(report_data['training_programs']['completed_programs'])],
            ['Inactive Programs', str(report_data['training_programs']['inactive_programs'])]
        ]
        
        programs_table = Table(programs_data, colWidths=[3*inch, 3*inch])
        programs_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(programs_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Center Performance
        story.append(Paragraph("Center Performance", styles['Heading2']))
        center_data = [
            ['Center Name', 'Students', 'Courses', 'Completion', 'Attendance', 'Performance']
        ]
        for center in report_data['center_performance']:
            center_data.append([
                center['center_name'],
                str(center['total_students']),
                str(center['total_courses']),
                f"{center['completion_rate']}%",
                f"{center['attendance_rate']}%",
                center['performance']
            ])
        
        center_table = Table(center_data, colWidths=[1.5*inch, 0.8*inch, 0.8*inch, 1*inch, 1*inch, 1*inch])
        center_table.setStyle(TableStyle([
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('BACKGROUND', (0,0), (-1,0), colors.grey),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.black),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(center_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Instructor Performance
        story.append(Paragraph("Instructor Performance", styles['Heading2']))
        instructor_data = [
            ['Name', 'Email', 'Courses', 'Students', 'Completion', 'Attendance', 'Performance']
        ]
        for instructor in report_data['instructor_metrics']:
            instructor_data.append([
                instructor['instructor_name'],
                instructor['email'],
                str(instructor['total_courses']),
                str(instructor['total_students']),
                f"{instructor['completion_rate']}%",
                f"{instructor['attendance_rate']}%",
                instructor['performance']
            ])
        
        instructor_table = Table(instructor_data, colWidths=[1.2*inch, 1.2*inch, 0.7*inch, 0.7*inch, 1*inch, 1*inch, 1*inch])
        instructor_table.setStyle(TableStyle([
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('BACKGROUND', (0,0), (-1,0), colors.grey),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.black),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(instructor_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Course Effectiveness
        story.append(Paragraph("Course Effectiveness", styles['Heading2']))
        course_data = [
            ['Name', 'Code', 'Category', 'Instructor', 'Status', 'Enrolled', 'Completion', 'Attendance']
        ]
        for course in report_data['course_effectiveness']:
            course_data.append([
                course['course_name'],
                course['course_code'],
                course['category'],
                course['instructor'],
                course['status'],
                str(course['total_enrolled']),
                f"{course['completion_rate']}%",
                f"{course['attendance_rate']}%"
            ])
        
        course_table = Table(course_data, colWidths=[1.2*inch, 0.8*inch, 1*inch, 1*inch, 0.8*inch, 0.8*inch, 1*inch, 1*inch])
        course_table.setStyle(TableStyle([
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('BACKGROUND', (0,0), (-1,0), colors.grey),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.black),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(course_table)
        
        doc.build(story)
        buffer.seek(0)
        
        response = Response(
            buffer.getvalue(),
            content_type='application/pdf'
        )
        response['Content-Disposition'] = f'attachment; filename="training_report_{report_data["user_district"]}_{report_data["period"]}_{timezone.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
        
        return response
        
    except Exception as e:
        logger.error(f"Error generating PDF export: {str(e)}")
        raise e