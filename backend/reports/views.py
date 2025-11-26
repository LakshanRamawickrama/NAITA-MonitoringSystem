# reports/views.py - ✅ COMPLETE FIXED VERSION WITH TRAINING OFFICER REPORTS
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Count, Avg, Q, F
from django.http import HttpResponse
from django.utils import timezone
from datetime import datetime, timedelta
import pandas as pd
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
import io
import logging

from centers.models import Center
from courses.models import Course
from students.models import Student
from users.models import User
from approvals.models import Approval
from attendance.models import Attendance, AttendanceSummary

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def head_office_reports(request):
    """Get head office report data - island-wide overview with real data"""
    try:
        if request.user.role != 'admin':
            return Response(
                {'error': 'Access denied - Admin access required for head office reports'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        total_districts = Center.objects.values('district').distinct().count()
        total_centers = Center.objects.count()
        total_students = Student.objects.count()
        total_courses = Course.objects.count()
        total_instructors = User.objects.filter(role='instructor').count()
        
        completed_students = Student.objects.filter(enrollment_status='Completed').count()
        completion_rate = round((completed_students / total_students * 100) if total_students > 0 else 0, 1)
        
        pending_approvals = Approval.objects.filter(status='Pending').count()
        
        district_performance = []
        districts = Center.objects.values('district').distinct()
        
        for district_data in districts:
            district = district_data['district']
            if not district:
                continue
            
            centers_count = Center.objects.filter(district=district).count()
            students_count = Student.objects.filter(district=district).count()
            instructors_count = User.objects.filter(role='instructor', district=district).count()
            
            district_completed = Student.objects.filter(
                district=district, enrollment_status='Completed'
            ).count()
            district_completion = round((district_completed / students_count * 100) if students_count > 0 else 0, 1)
            
            one_month_ago = timezone.now() - timedelta(days=30)
            new_students = Student.objects.filter(
                district=district, created_at__gte=one_month_ago
            ).count()
            growth = round((new_students / students_count * 100) if students_count > 0 else 0, 1)
            
            district_performance.append({
                'name': district,
                'centers': centers_count,
                'students': students_count,
                'instructors': instructors_count,
                'completion': district_completion,
                'growth': growth
            })
        
        island_trends = []
        today = timezone.now().date()
        for i in range(5, -1, -1):
            start_date = today - timedelta(days=30*(i+1))
            end_date = today - timedelta(days=30*i)
            
            period_enrollments = Student.objects.filter(
                enrollment_date__range=(start_date, end_date)
            ).count()
            
            period_completions = Student.objects.filter(
                enrollment_status='Completed',
                updated_at__range=(start_date, end_date)
            ).count()
            
            period_new_instructors = User.objects.filter(
                role='instructor',
                date_joined__range=(start_date, end_date)
            ).count()
            
            island_trends.append({
                'period': start_date.strftime('%b %Y'),
                'enrollment': period_enrollments,
                'completions': period_completions,
                'new_instructors': period_new_instructors
            })
        
        course_distribution = list(Course.objects.values('category').annotate(
            value=Count('id')
        ).order_by('-value')[:5])
        colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
        for idx, course in enumerate(course_distribution):
            course['color'] = colors[idx % len(colors)]
            course['name'] = course.pop('category') or 'Uncategorized'
        
        top_performing_centers = []
        centers_with_stats = Center.objects.annotate(
            total_students=Count('enrolled_students', distinct=True),
            completed_students=Count('enrolled_students', distinct=True, filter=Q(enrolled_students__enrollment_status='Completed'))
        ).order_by('-total_students')[:5]
        
        for center in centers_with_stats:
            completion_rate = round(
                (center.completed_students / center.total_students * 100) if center.total_students > 0 else 0, 
                1
            )
            instructor_count = User.objects.filter(role='instructor', center=center).count()
            
            top_performing_centers.append({
                'name': center.name,
                'district': center.district,
                'students': center.total_students,
                'instructors': instructor_count,
                'completion': completion_rate
            })
        
        instructor_summary = list(User.objects.filter(role='instructor').values('district').annotate(
            total=Count('id'),
            active=Count('id', filter=Q(is_active=True)),
            avg_rating=Avg('courses_teaching__progress')
        ).order_by('-total'))
        
        for summary in instructor_summary:
            summary['avg_rating'] = round(summary['avg_rating'] or 0, 1)
        
        report_data = {
            'summary': {
                'total_districts': total_districts,
                'total_centers': total_centers,
                'total_students': total_students,
                'total_courses': total_courses,
                'total_instructors': total_instructors,
                'completion_rate': completion_rate,
                'pending_approvals': pending_approvals
            },
            'district_performance': district_performance,
            'island_trends': island_trends,
            'course_distribution': course_distribution,
            'top_performing_centers': top_performing_centers,
            'instructor_summary': instructor_summary
        }
        
        return Response(report_data)
    
    except Exception as e:
        logger.error(f"Error generating head office reports: {str(e)}")
        return Response(
            {'error': 'Failed to generate reports'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_head_office_report(request):
    """Export head office report in PDF or Excel format"""
    try:
        if request.user.role != 'admin':
            return Response(
                {'error': 'Access denied - Admin access required'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        format_type = request.GET.get('format', 'pdf')
        period = request.GET.get('period', 'monthly')
        report_type = request.GET.get('report_type', 'comprehensive')
        start_date_str = request.GET.get('start_date')
        end_date_str = request.GET.get('end_date')
        include_districts = request.GET.get('include_districts', 'true') == 'true'
        include_centers = request.GET.get('include_centers', 'true') == 'true'
        include_courses = request.GET.get('include_courses', 'true') == 'true'
        include_instructors = request.GET.get('include_instructors', 'true') == 'true'
        
        if period == 'custom':
            if not (start_date_str and end_date_str):
                return Response({'error': 'Start and end dates required for custom period'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            today = timezone.now().date()
            if period == 'weekly':
                start_date = today - timedelta(days=7)
            elif period == 'monthly':
                start_date = today - timedelta(days=30)
            elif period == 'quarterly':
                start_date = today - timedelta(days=90)
            else:
                start_date = today - timedelta(days=30)  # Default monthly
            end_date = today
        
        report_data = head_office_reports(request).data
        
        if 'island_trends' in report_data:
            report_data['island_trends'] = [t for t in report_data['island_trends'] if start_date <= datetime.strptime(t['period'], '%b %Y').date() <= end_date]
        
        if format_type == 'excel':
            return generate_excel_report(report_data, report_type, period, include_districts, include_centers, include_courses, include_instructors)
        else:  # pdf
            return generate_pdf_report(report_data, report_type, period, include_districts, include_centers, include_courses, include_instructors)
    
    except Exception as e:
        logger.error(f"Error exporting head office report: {str(e)}")
        return Response({'error': 'Failed to export report'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def generate_excel_report(report_data, report_type, period, include_districts, include_centers, include_courses, include_instructors):
    """Generate Excel report using pandas"""
    try:
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            summary_df = pd.DataFrame([report_data['summary']])
            summary_df.to_excel(writer, sheet_name='Summary', index=False)
            
            if include_districts and 'district_performance' in report_data:
                district_df = pd.DataFrame(report_data['district_performance'])
                district_df.to_excel(writer, sheet_name='Districts', index=False)
            
            if 'island_trends' in report_data:
                trends_df = pd.DataFrame(report_data['island_trends'])
                trends_df.to_excel(writer, sheet_name='Trends', index=False)
            
            if include_courses and 'course_distribution' in report_data:
                courses_df = pd.DataFrame(report_data['course_distribution'])
                courses_df.to_excel(writer, sheet_name='Courses', index=False)
            
            if include_centers and 'top_performing_centers' in report_data:
                centers_df = pd.DataFrame(report_data['top_performing_centers'])
                centers_df.to_excel(writer, sheet_name='Top Centers', index=False)
            
            if include_instructors and 'instructor_summary' in report_data:
                instructors_df = pd.DataFrame(report_data['instructor_summary'])
                instructors_df.to_excel(writer, sheet_name='Instructors', index=False)
        
        file_content = buffer.getvalue()
        buffer.close()
        
        response = HttpResponse(file_content, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="head_office_report_{period}_{timezone.now().strftime("%Y%m%d")}.xlsx"'
        return response
    
    except Exception as e:
        logger.error(f"Error generating Excel report: {str(e)}")
        raise

def generate_pdf_report(report_data, report_type, period, include_districts, include_centers, include_courses, include_instructors):
    """Generate PDF report using reportlab"""
    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []
        
        story.append(Paragraph(f"Head Office Report - {report_type.capitalize()} ({period.capitalize()})", styles['Title']))
        story.append(Spacer(1, 12))
        story.append(Paragraph(f"Generated on: {timezone.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
        story.append(Spacer(1, 20))
        
        story.append(Paragraph("Summary Statistics", styles['Heading2']))
        summary_data = [
            ['Metric', 'Value'],
            ['Total Districts', str(report_data['summary']['total_districts'])],
            ['Total Centers', str(report_data['summary']['total_centers'])],
            ['Total Students', str(report_data['summary']['total_students'])],
            ['Total Courses', str(report_data['summary']['total_courses'])],
            ['Total Instructors', str(report_data['summary']['total_instructors'])],
            ['Completion Rate', f"{report_data['summary']['completion_rate']}%"],
            ['Pending Approvals', str(report_data['summary']['pending_approvals'])],
        ]
        
        summary_table = Table(summary_data)
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 20))
        
        if include_districts and 'district_performance' in report_data:
            story.append(Paragraph("District Performance", styles['Heading2']))
            district_data = [['District', 'Centers', 'Students', 'Instructors', 'Completion', 'Growth']]
            
            for district in report_data['district_performance']:
                district_data.append([
                    district['name'],
                    str(district['centers']),
                    str(district['students']),
                    str(district['instructors']),
                    f"{district['completion']}%",
                    f"{district['growth']}%"
                ])
            
            district_table = Table(district_data)
            district_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 0), (-1, -1), 8)
            ]))
            story.append(district_table)
            story.append(Spacer(1, 20))
        
        if 'island_trends' in report_data:
            story.append(Paragraph("Island-Wide Trends", styles['Heading2']))
            trends_data = [['Period', 'Enrollments', 'Completions', 'New Instructors']]
            
            for trend in report_data['island_trends']:
                trends_data.append([
                    trend['period'],
                    str(trend['enrollment']),
                    str(trend['completions']),
                    str(trend['new_instructors'])
                ])
            
            trends_table = Table(trends_data)
            trends_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(trends_table)
            story.append(Spacer(1, 20))
        
        if include_courses and 'course_distribution' in report_data:
            story.append(Paragraph("Course Distribution", styles['Heading2']))
            courses_data = [['Course', 'Students', 'Color']]
            
            for course in report_data['course_distribution']:
                courses_data.append([
                    course['name'],
                    str(course['value']),
                    course['color']
                ])
            
            courses_table = Table(courses_data)
            courses_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(courses_table)
            story.append(Spacer(1, 20))
        
        if include_centers and 'top_performing_centers' in report_data:
            story.append(Paragraph("Top Performing Centers", styles['Heading2']))
            centers_data = [['Name', 'District', 'Students', 'Instructors', 'Completion']]
            
            for center in report_data['top_performing_centers']:
                centers_data.append([
                    center['name'],
                    center['district'],
                    str(center['students']),
                    str(center['instructors']),
                    f"{center['completion']}%"
                ])
            
            centers_table = Table(centers_data)
            centers_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(centers_table)
            story.append(Spacer(1, 20))
        
        if include_instructors and 'instructor_summary' in report_data:
            story.append(Paragraph("Instructor Summary", styles['Heading2']))
            instructors_data = [['District', 'Total', 'Active', 'Avg Rating']]
            
            for instructor in report_data['instructor_summary']:
                instructors_data.append([
                    instructor['district'] or 'Unassigned',
                    str(instructor['total']),
                    str(instructor['active']),
                    str(instructor['avg_rating'])
                ])
            
            instructors_table = Table(instructors_data)
            instructors_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(instructors_table)
        
        doc.build(story)
        file_content = buffer.getvalue()
        buffer.close()
        
        response = HttpResponse(file_content, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="head_office_report_{period}_{timezone.now().strftime("%Y%m%d")}.pdf"'
        return response
        
    except Exception as e:
        logger.error(f"Error generating PDF report: {str(e)}")
        raise

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def district_reports(request):
    """Get district-specific report data for district managers"""
    try:
        # Permission: Only district managers
        if request.user.role != 'district_manager':
            return Response(
                {'error': 'Access denied - District Manager access required'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        district = request.user.district
        if not district:
            return Response({'error': 'No district assigned to user'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Summary statistics (filtered by district)
        total_centers = Center.objects.filter(district=district).count()
        total_courses = Course.objects.filter(district=district).count()
        total_users = User.objects.filter(district=district).count()
        pending_approvals = Approval.objects.filter(
            center__icontains=district, status='Pending'  # Assuming center field contains district
        ).count()
        active_students = Student.objects.filter(
            district=district, enrollment_status='Enrolled'
        ).count()
        completed_students = Student.objects.filter(
            district=district, enrollment_status='Completed'
        ).count()
        completion_rate = round((completed_students / (active_students + completed_students) * 100) if (active_students + completed_students) > 0 else 0, 1)
        
        # Center performance (in district)
        center_performance = []
        centers = Center.objects.filter(district=district)[:5]  # Top 5 centers
        for center in centers:
            students_count = Student.objects.filter(center=center).count()
            courses_count = Course.objects.filter(center=center).count()
            center_completed = Student.objects.filter(
                center=center, enrollment_status='Completed'
            ).count()
            center_completion = round((center_completed / students_count * 100) if students_count > 0 else 0, 1)
            
            center_performance.append({
                'name': center.name,
                'students': students_count,
                'courses': courses_count,
                'completion': center_completion
            })
        
        # Enrollment trend (last 6 months in district)
        enrollment_trend = []
        today = timezone.now().date()
        for i in range(5, -1, -1):
            start_date = today - timedelta(days=30*(i+1))
            end_date = today - timedelta(days=30*i)
            
            period_enrollments = Student.objects.filter(
                district=district,
                enrollment_date__range=(start_date, end_date)
            ).count()
            
            period_approvals = Approval.objects.filter(
                center__icontains=district,
                date_requested__range=(start_date, end_date)
            ).count()
            
            enrollment_trend.append({
                'period': start_date.strftime('%b'),
                'enrollment': period_enrollments,
                'approvals': period_approvals
            })
        
        # Course distribution (in district)
        course_distribution = list(Course.objects.filter(district=district).values('category').annotate(
            value=Count('id')
        ).order_by('-value')[:4])
        colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
        for idx, course in enumerate(course_distribution):
            course['color'] = colors[idx % len(colors)]
            course['name'] = course.pop('category') or 'Uncategorized'
        
        # Recent approvals (in district)
        recent_approvals = list(Approval.objects.filter(
            center__icontains=district
        ).order_by('-date_requested')[:5].values(
            'id', 'type', 'center', 'status', 'date_requested'
        ))
        for approval in recent_approvals:
            approval['name'] = approval.pop('center')
            approval['date'] = approval['date_requested'].strftime('%Y-%m-%d')
            del approval['date_requested']
        
        report_data = {
            'summary': {
                'totalCenters': {'current': total_centers},
                'totalCourses': {'current': total_courses},
                'totalUsers': {'current': total_users},
                'pendingApprovals': {'current': pending_approvals},
                'activeStudents': {'current': active_students},
                'completionRate': {'current': completion_rate}
            },
            'centerPerformance': center_performance,
            'enrollmentTrend': enrollment_trend,
            'courseDistribution': course_distribution,
            'recentApprovals': recent_approvals
        }
        
        return Response(report_data)
    
    except Exception as e:
        logger.error(f"Error generating district reports: {str(e)}")
        return Response({'error': 'Failed to generate district reports'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_district_report(request):
    """Export district report in PDF or Excel"""
    try:
        if request.user.role != 'district_manager':
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        district = request.user.district
        if not district:
            return Response({'error': 'No district assigned'}, status=status.HTTP_400_BAD_REQUEST)
        
        format_type = request.GET.get('format', 'pdf')
        period = request.GET.get('period', 'monthly')
        
        # Get report data
        report_data = district_reports(request).data
        
        if format_type == 'excel':
            return generate_district_excel_report(report_data, period)
        else:
            return generate_district_pdf_report(report_data, period)
    
    except Exception as e:
        logger.error(f"Error exporting district report: {str(e)}")
        return Response({'error': 'Failed to export report'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def generate_district_excel_report(report_data, period):
    """Generate Excel for district report"""
    try:
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            pd.DataFrame([report_data['summary']]).to_excel(writer, sheet_name='Summary', index=False)
            pd.DataFrame(report_data['centerPerformance']).to_excel(writer, sheet_name='Centers', index=False)
            pd.DataFrame(report_data['enrollmentTrend']).to_excel(writer, sheet_name='Trends', index=False)
            pd.DataFrame(report_data['courseDistribution']).to_excel(writer, sheet_name='Courses', index=False)
            pd.DataFrame(report_data['recentApprovals']).to_excel(writer, sheet_name='Approvals', index=False)
        
        file_content = buffer.getvalue()
        buffer.close()
        
        response = HttpResponse(file_content, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="district_report_{period}_{timezone.now().strftime("%Y%m%d")}.xlsx"'
        return response
    
    except Exception as e:
        logger.error(f"Error generating district Excel: {str(e)}")
        raise

def generate_district_pdf_report(report_data, period):
    """Generate PDF for district report"""
    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []
        
        story.append(Paragraph(f"District Report - {period.capitalize()}", styles['Title']))
        story.append(Spacer(1, 12))
        
        # Summary
        story.append(Paragraph("Summary", styles['Heading2']))
        summary_data = [
            ['Total Centers', str(report_data['summary']['totalCenters']['current'])],
            ['Total Courses', str(report_data['summary']['totalCourses']['current'])],
            ['Total Users', str(report_data['summary']['totalUsers']['current'])],
            ['Pending Approvals', str(report_data['summary']['pendingApprovals']['current'])],
            ['Active Students', str(report_data['summary']['activeStudents']['current'])],
            ['Completion Rate', f"{report_data['summary']['completionRate']['current']}%"]
        ]
        table = Table([['Metric', 'Value']] + summary_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(table)
        
        doc.build(story)
        file_content = buffer.getvalue()
        buffer.close()
        
        response = HttpResponse(file_content, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="district_report_{period}_{timezone.now().strftime("%Y%m%d")}.pdf"'
        return response
    
    except Exception as e:
        logger.error(f"Error generating district PDF: {str(e)}")
        raise

# ========== TRAINING OFFICER REPORTS ==========

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def training_officer_reports(request):
    """Get training officer report data for district-level training overview"""
    try:
        # Permission: Only training officers
        if request.user.role != 'training_officer':
            return Response(
                {'error': 'Access denied - Training Officer access required'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        district = request.user.district
        if not district:
            return Response({'error': 'No district assigned to user'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Overall statistics (filtered by district)
        total_students = Student.objects.filter(district=district).count()
        total_centers = Center.objects.filter(district=district).count()
        total_instructors = User.objects.filter(role='instructor', district=district).count()
        total_courses = Course.objects.filter(district=district).count()
        active_courses = Course.objects.filter(district=district, status='Active').count()
        
        # Completion rate calculation
        completed_students = Student.objects.filter(
            district=district, enrollment_status='Completed'
        ).count()
        completion_rate = round((completed_students / total_students * 100) if total_students > 0 else 0, 1)
        
        # Training programs statistics
        training_programs = {
            'total_programs': total_courses,
            'active_programs': active_courses,
            'pending_approval': Course.objects.filter(
                district=district, status='Pending'
            ).count(),
            'approved_programs': Course.objects.filter(
                district=district, status='Approved'
            ).count(),
            'completed_programs': Course.objects.filter(
                district=district, status='Completed'
            ).count(),
            'inactive_programs': Course.objects.filter(
                district=district, status='Inactive'
            ).count()
        }
        
        # Training progress statistics
        training_progress = {
            'total_trained': Student.objects.filter(
                district=district, training_received=True
            ).count(),
            'in_training': Student.objects.filter(
                district=district, enrollment_status='Enrolled'
            ).count(),
            'completed_training': completed_students,
            'awaiting_training': Student.objects.filter(
                district=district, enrollment_status='Pending'
            ).count(),
            'dropped_training': Student.objects.filter(
                district=district, enrollment_status='Dropped'
            ).count()
        }
        
        # Center performance (in district)
        center_performance = []
        centers = Center.objects.filter(district=district)
        
        for center in centers:
            center_students = Student.objects.filter(center=center).count()
            center_courses = Course.objects.filter(center=center).count()
            center_completed = Student.objects.filter(
                center=center, enrollment_status='Completed'
            ).count()
            center_completion = round((center_completed / center_students * 100) if center_students > 0 else 0, 1)
            
            # Calculate attendance rate (simplified - using related courses)
            center_course_ids = Course.objects.filter(center=center).values_list('id', flat=True)
            total_attendance_records = Attendance.objects.filter(
                course_id__in=center_course_ids
            ).count()
            present_records = Attendance.objects.filter(
                course_id__in=center_course_ids, status='present'
            ).count()
            attendance_rate = round((present_records / total_attendance_records * 100) if total_attendance_records > 0 else 0, 1)
            
            # Performance rating
            if center_completion >= 80:
                performance = 'Excellent'
            elif center_completion >= 60:
                performance = 'Good'
            elif center_completion >= 40:
                performance = 'Average'
            else:
                performance = 'Needs Improvement'
            
            center_performance.append({
                'center_name': center.name,
                'total_students': center_students,
                'total_courses': center_courses,
                'completion_rate': center_completion,
                'attendance_rate': attendance_rate,
                'performance': performance
            })
        
        # Instructor metrics (in district)
        instructor_metrics = []
        instructors = User.objects.filter(role='instructor', district=district)
        
        for instructor in instructors:
            instructor_courses = Course.objects.filter(instructor=instructor).count()
            instructor_students = Student.objects.filter(
                course__instructor=instructor
            ).count()
            instructor_completed = Student.objects.filter(
                course__instructor=instructor, enrollment_status='Completed'
            ).count()
            instructor_completion = round((instructor_completed / instructor_students * 100) if instructor_students > 0 else 0, 1)
            
            # Calculate attendance rate for instructor
            instructor_course_ids = Course.objects.filter(instructor=instructor).values_list('id', flat=True)
            instructor_attendance_records = Attendance.objects.filter(
                course_id__in=instructor_course_ids
            ).count()
            instructor_present_records = Attendance.objects.filter(
                course_id__in=instructor_course_ids, status='present'
            ).count()
            instructor_attendance = round((instructor_present_records / instructor_attendance_records * 100) if instructor_attendance_records > 0 else 0, 1)
            
            # Performance rating
            if instructor_completion >= 85:
                performance = 'Excellent'
            elif instructor_completion >= 70:
                performance = 'Good'
            elif instructor_completion >= 50:
                performance = 'Average'
            else:
                performance = 'Needs Improvement'
            
            instructor_metrics.append({
                'instructor_name': f"{instructor.first_name} {instructor.last_name}",
                'email': instructor.email,
                'total_courses': instructor_courses,
                'total_students': instructor_students,
                'completed_students': instructor_completed,
                'completion_rate': instructor_completion,
                'attendance_rate': instructor_attendance,
                'performance': performance
            })
        
        # Course effectiveness (in district) - FIXED: No instructor_details reference
        course_effectiveness = []
        courses = Course.objects.filter(district=district).select_related('instructor')
        
        for course in courses:
            course_enrolled = Student.objects.filter(course=course).count()
            course_completed = Student.objects.filter(
                course=course, enrollment_status='Completed'
            ).count()
            course_completion_rate = round((course_completed / course_enrolled * 100) if course_enrolled > 0 else 0, 1)
            
            # Calculate attendance rate for course
            course_attendance_records = Attendance.objects.filter(course=course).count()
            course_present_records = Attendance.objects.filter(
                course=course, status='present'
            ).count()
            course_attendance_rate = round((course_present_records / course_attendance_records * 100) if course_attendance_records > 0 else 0, 1)
            
            # Get instructor name safely
            instructor_name = 'Unassigned'
            if course.instructor:
                instructor_name = f"{course.instructor.first_name} {course.instructor.last_name}"
            
            course_effectiveness.append({
                'course_name': course.name,
                'course_code': course.code,
                'category': course.category or 'General',
                'instructor': instructor_name,
                'status': course.status,
                'total_enrolled': course_enrolled,
                'completion_rate': course_completion_rate,
                'attendance_rate': course_attendance_rate,
                'duration': course.duration or 'Not specified',
                'schedule': course.schedule or 'Flexible'
            })
        
        # Training trends (last 6 months)
        training_trends = []
        today = timezone.now().date()
        for i in range(5, -1, -1):
            start_date = today - timedelta(days=30*(i+1))
            end_date = today - timedelta(days=30*i)
            
            new_students = Student.objects.filter(
                district=district,
                enrollment_date__range=(start_date, end_date)
            ).count()
            
            completed_training = Student.objects.filter(
                district=district,
                enrollment_status='Completed',
                updated_at__range=(start_date, end_date)
            ).count()
            
            new_courses = Course.objects.filter(
                district=district,
                created_at__range=(start_date, end_date)
            ).count()
            
            training_trends.append({
                'month': start_date.strftime('%b %Y'),
                'new_students': new_students,
                'completed_training': completed_training,
                'new_courses': new_courses
            })
        
        # Pending approvals
        pending_approvals = {
            'course_approvals': Course.objects.filter(
                district=district, status='Pending'
            ).count(),
            'general_approvals': Approval.objects.filter(
                center__icontains=district, status='Pending'
            ).count()
        }
        
        report_data = {
            'overall_stats': {
                'total_students': total_students,
                'total_centers': total_centers,
                'total_instructors': total_instructors,
                'total_courses': total_courses,
                'active_courses': active_courses,
                'completion_rate': completion_rate
            },
            'training_programs': training_programs,
            'training_progress': training_progress,
            'center_performance': center_performance,
            'instructor_metrics': instructor_metrics,
            'course_effectiveness': course_effectiveness,
            'training_trends': training_trends,
            'pending_approvals': pending_approvals,
            'user_district': district,
            'period': 'current',
            'report_generated_at': timezone.now().isoformat(),
            'generated_by': f"{request.user.first_name} {request.user.last_name}"
        }
        
        return Response(report_data)
    
    except Exception as e:
        logger.error(f"Error generating training officer reports: {str(e)}")
        return Response(
            {'error': 'Failed to generate training officer reports'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_training_report(request):
    """Export training officer report in PDF or Excel format"""
    try:
        if request.user.role != 'training_officer':
            return Response(
                {'error': 'Access denied - Training Officer access required'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        format_type = request.GET.get('format', 'pdf')
        period = request.GET.get('period', 'monthly')
        report_type = request.GET.get('report_type', 'comprehensive')
        
        # Get report data
        report_data = training_officer_reports(request).data
        
        if format_type == 'excel':
            return generate_training_excel_report(report_data, period)
        else:
            return generate_training_pdf_report(report_data, period)
    
    except Exception as e:
        logger.error(f"Error exporting training officer report: {str(e)}")
        return Response(
            {'error': 'Failed to export training officer report'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def generate_training_excel_report(report_data, period):
    """Generate Excel report for training officer"""
    try:
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            # Overall Stats
            overall_stats_df = pd.DataFrame([report_data['overall_stats']])
            overall_stats_df.to_excel(writer, sheet_name='Overall Stats', index=False)
            
            # Training Programs
            training_programs_df = pd.DataFrame([report_data['training_programs']])
            training_programs_df.to_excel(writer, sheet_name='Training Programs', index=False)
            
            # Training Progress
            training_progress_df = pd.DataFrame([report_data['training_progress']])
            training_progress_df.to_excel(writer, sheet_name='Training Progress', index=False)
            
            # Center Performance
            if report_data['center_performance']:
                center_performance_df = pd.DataFrame(report_data['center_performance'])
                center_performance_df.to_excel(writer, sheet_name='Center Performance', index=False)
            
            # Instructor Metrics
            if report_data['instructor_metrics']:
                instructor_metrics_df = pd.DataFrame(report_data['instructor_metrics'])
                instructor_metrics_df.to_excel(writer, sheet_name='Instructor Metrics', index=False)
            
            # Course Effectiveness
            if report_data['course_effectiveness']:
                course_effectiveness_df = pd.DataFrame(report_data['course_effectiveness'])
                course_effectiveness_df.to_excel(writer, sheet_name='Course Effectiveness', index=False)
            
            # Training Trends
            if report_data['training_trends']:
                training_trends_df = pd.DataFrame(report_data['training_trends'])
                training_trends_df.to_excel(writer, sheet_name='Training Trends', index=False)
        
        file_content = buffer.getvalue()
        buffer.close()
        
        response = HttpResponse(
            file_content, 
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="training_officer_report_{period}_{timezone.now().strftime("%Y%m%d")}.xlsx"'
        return response
    
    except Exception as e:
        logger.error(f"Error generating training Excel report: {str(e)}")
        raise

def generate_training_pdf_report(report_data, period):
    """Generate PDF report for training officer"""
    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        story.append(Paragraph(f"Training Officer Report - {period.capitalize()}", styles['Title']))
        story.append(Spacer(1, 12))
        story.append(Paragraph(f"District: {report_data['user_district']}", styles['Normal']))
        story.append(Paragraph(f"Generated on: {timezone.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Overall Statistics
        story.append(Paragraph("Overall Statistics", styles['Heading2']))
        overall_data = [
            ['Metric', 'Value'],
            ['Total Students', str(report_data['overall_stats']['total_students'])],
            ['Total Centers', str(report_data['overall_stats']['total_centers'])],
            ['Total Instructors', str(report_data['overall_stats']['total_instructors'])],
            ['Total Courses', str(report_data['overall_stats']['total_courses'])],
            ['Active Courses', str(report_data['overall_stats']['active_courses'])],
            ['Completion Rate', f"{report_data['overall_stats']['completion_rate']}%"]
        ]
        
        overall_table = Table(overall_data)
        overall_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(overall_table)
        story.append(Spacer(1, 20))
        
        # Training Programs
        story.append(Paragraph("Training Programs", styles['Heading2']))
        programs_data = [
            ['Total Programs', str(report_data['training_programs']['total_programs'])],
            ['Active Programs', str(report_data['training_programs']['active_programs'])],
            ['Pending Approval', str(report_data['training_programs']['pending_approval'])],
            ['Completed Programs', str(report_data['training_programs']['completed_programs'])]
        ]
        
        programs_table = Table([['Program Type', 'Count']] + programs_data)
        programs_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(programs_table)
        story.append(Spacer(1, 20))
        
        # Center Performance (first 5 centers)
        if report_data['center_performance']:
            story.append(Paragraph("Center Performance", styles['Heading2']))
            center_data = [['Center', 'Students', 'Courses', 'Completion Rate', 'Performance']]
            
            for center in report_data['center_performance'][:5]:
                center_data.append([
                    center['center_name'],
                    str(center['total_students']),
                    str(center['total_courses']),
                    f"{center['completion_rate']}%",
                    center['performance']
                ])
            
            center_table = Table(center_data)
            center_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 0), (-1, -1), 8)
            ]))
            story.append(center_table)
            story.append(Spacer(1, 20))
        
        doc.build(story)
        file_content = buffer.getvalue()
        buffer.close()
        
        response = HttpResponse(file_content, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="training_officer_report_{period}_{timezone.now().strftime("%Y%m%d")}.pdf"'
        return response
        
    except Exception as e:
        logger.error(f"Error generating training PDF report: {str(e)}")
        raise