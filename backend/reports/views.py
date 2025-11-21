# reports/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Avg, F
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from centers.models import Center
from courses.models import Course
from students.models import Student
from approvals.models import Approval
import json

User = get_user_model()

class IsDistrictManager(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == "district_manager"

@api_view(['GET'])
@permission_classes([IsDistrictManager])
def district_manager_reports(request):
    """Comprehensive reports for district managers"""
    user = request.user
    district = user.district
    
    # Get period from query params
    period = request.GET.get('period', 'monthly')
    center_filter = request.GET.get('center', 'all')
    
    # Calculate date range based on period
    if period == 'weekly':
        start_date = timezone.now() - timedelta(days=7)
    elif period == 'monthly':
        start_date = timezone.now() - timedelta(days=30)
    elif period == 'quarterly':
        start_date = timezone.now() - timedelta(days=90)
    else:  # yearly
        start_date = timezone.now() - timedelta(days=365)
    
    # Base querysets filtered by district
    centers_queryset = Center.objects.filter(district=district)
    students_queryset = Student.objects.filter(district=district)
    courses_queryset = Course.objects.filter(district=district)
    
    # Apply center filter if specified
    if center_filter != 'all':
        centers_queryset = centers_queryset.filter(id=center_filter)
        students_queryset = students_queryset.filter(center_id=center_filter)
        courses_queryset = courses_queryset.filter(center_id=center_filter)
    
    # Real metrics calculation
    total_students = students_queryset.count()
    total_centers = centers_queryset.count()
    active_courses = courses_queryset.filter(status='Active').count()
    
    # Enrollment stats
    enrollment_stats = {
        'enrolled': students_queryset.filter(enrollment_status='Enrolled').count(),
        'completed': students_queryset.filter(enrollment_status='Completed').count(),
        'pending': students_queryset.filter(enrollment_status='Pending').count(),
        'dropped': students_queryset.filter(enrollment_status='Dropped').count()
    }
    
    # Training stats
    training_stats = {
        'trained': students_queryset.filter(training_received=True).count(),
        'not_trained': students_queryset.filter(training_received=False).count()
    }
    
    # Recent activity (last 7 days)
    recent_activity = {
        'new_students': students_queryset.filter(created_at__gte=timezone.now()-timedelta(days=7)).count(),
        'new_courses': courses_queryset.filter(created_at__gte=timezone.now()-timedelta(days=7)).count(),
        'completed_courses': students_queryset.filter(
            enrollment_status='Completed', 
            updated_at__gte=timezone.now()-timedelta(days=7)
        ).count()
    }
    
    # Pending approvals
    pending_approvals = Approval.objects.filter(
        status='Pending',
        center__in=[center.name for center in centers_queryset]
    ).count()
    
    # Enrollment trends (last 6 months)
    enrollment_data = []
    for i in range(6):
        month_start = timezone.now().replace(day=1) - timedelta(days=30*i)
        month_end = month_start + timedelta(days=30)
        month_students = students_queryset.filter(
            created_at__gte=month_start,
            created_at__lt=month_end
        ).count()
        
        enrollment_data.append({
            'month': month_start.strftime('%b'),
            'students': month_students
        })
    
    enrollment_data.reverse()
    
    # Center performance data
    center_performance_data = []
    for center in centers_queryset:
        center_students = students_queryset.filter(center=center)
        completion_rate = 0
        if center_students.count() > 0:
            completion_rate = (center_students.filter(enrollment_status='Completed').count() / center_students.count()) * 100
        
        if completion_rate >= 80:
            performance = 'Excellent'
            color = '#16a34a'
        elif completion_rate >= 60:
            performance = 'Good'
            color = '#eab308'
        elif completion_rate >= 40:
            performance = 'Average'
            color = '#38bdf8'
        else:
            performance = 'Needs Improvement'
            color = '#ef4444'
            
        center_performance_data.append({
            'name': performance,
            'value': 1,  # Count of centers in this performance category
            'color': color
        })
    
    # Course completion rates
    course_completion_data = []
    for course in courses_queryset.filter(status='Active')[:5]:  # Top 5 courses
        course_students = students_queryset.filter(course=course)
        completion_rate = 0
        if course_students.count() > 0:
            completion_rate = (course_students.filter(enrollment_status='Completed').count() / course_students.count()) * 100
        
        course_completion_data.append({
            'course': course.name,
            'completion': round(completion_rate, 1)
        })
    
    # Compile the response
    report_data = {
        'total_students': total_students,
        'total_centers': total_centers,
        'total_courses': courses_queryset.count(),
        'active_courses': active_courses,
        'pending_approvals': pending_approvals,
        'recent_activity': recent_activity,
        'enrollment_stats': enrollment_stats,
        'training_stats': training_stats,
        'enrollment_data': enrollment_data,
        'center_performance_data': center_performance_data,
        'course_completion_data': course_completion_data,
        'user_district': district,
        'period': period,
        'center_filter': center_filter
    }
    
    return Response(report_data)

@api_view(['GET'])
@permission_classes([IsDistrictManager])
def district_overview(request):
    """Overview data for district dashboard"""
    user = request.user
    district = user.district
    
    # Real data calculations
    total_centers = Center.objects.filter(district=district).count()
    active_students = Student.objects.filter(
        district=district, 
        enrollment_status='Enrolled'
    ).count()
    total_instructors = User.objects.filter(
        district=district, 
        role='instructor',
        is_active=True
    ).count()
    
    # Calculate completion rate
    total_completed = Student.objects.filter(
        district=district,
        enrollment_status='Completed'
    ).count()
    total_enrolled_or_completed = Student.objects.filter(
        district=district,
        enrollment_status__in=['Enrolled', 'Completed']
    ).count()
    
    completion_rate = 0
    if total_enrolled_or_completed > 0:
        completion_rate = round((total_completed / total_enrolled_or_completed) * 100, 1)
    
    # Enrollment data for charts
    enrollment_data = []
    for i in range(6):
        month_start = timezone.now().replace(day=1) - timedelta(days=30*i)
        month_end = month_start + timedelta(days=30)
        month_students = Student.objects.filter(
            district=district,
            created_at__gte=month_start,
            created_at__lt=month_end
        ).count()
        
        enrollment_data.append({
            'month': month_start.strftime('%b'),
            'students': month_students
        })
    
    enrollment_data.reverse()
    
    # Center performance distribution
    centers = Center.objects.filter(district=district)
    performance_counts = {'Excellent': 0, 'Good': 0, 'Average': 0, 'Needs Improvement': 0}
    
    for center in centers:
        center_students = Student.objects.filter(center=center, district=district)
        if center_students.count() > 0:
            completion_rate = (center_students.filter(enrollment_status='Completed').count() / center_students.count()) * 100
            
            if completion_rate >= 80:
                performance_counts['Excellent'] += 1
            elif completion_rate >= 60:
                performance_counts['Good'] += 1
            elif completion_rate >= 40:
                performance_counts['Average'] += 1
            else:
                performance_counts['Needs Improvement'] += 1
    
    center_performance_data = [
        {'name': 'Excellent', 'value': performance_counts['Excellent'], 'color': '#16a34a'},
        {'name': 'Good', 'value': performance_counts['Good'], 'color': '#eab308'},
        {'name': 'Average', 'value': performance_counts['Average'], 'color': '#38bdf8'},
        {'name': 'Needs Improvement', 'value': performance_counts['Needs Improvement'], 'color': '#ef4444'}
    ]
    
    # Recent activities (mock data - you can expand this with real activity logs)
    recent_activities = [
        {'id': '1', 'activity': f'New center registered in {district}', 'time': '2 hours ago', 'type': 'success'},
        {'id': '2', 'activity': 'Monthly report generated', 'time': '1 day ago', 'type': 'info'},
        {'id': '3', 'activity': 'Training completion rate improved', 'time': '2 days ago', 'type': 'success'},
        {'id': '4', 'activity': 'Pending approvals need attention', 'time': '3 days ago', 'type': 'warning'}
    ]
    
    # Trends (mock data - you can calculate real trends)
    trends = {
        'centers': {'value': 5, 'isPositive': True},
        'students': {'value': 12, 'isPositive': True},
        'instructors': {'value': 2, 'isPositive': True},
        'completion': {'value': 8, 'isPositive': True}
    }
    
    overview_data = {
        'total_centers': total_centers,
        'active_students': active_students,
        'total_instructors': total_instructors,
        'completion_rate': completion_rate,
        'enrollment_data': enrollment_data,
        'center_performance_data': center_performance_data,
        'recent_activities': recent_activities,
        'trends': trends,
        'user_district': district
    }
    
    return Response(overview_data)