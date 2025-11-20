# overview/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
import json

from centers.models import Center
from users.models import User
from students.models import Student
from courses.models import Course, CourseApproval
from approvals.models import Approval

class OverviewView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Check if user has permission to view overview (admin or head office role)
            if request.user.role not in ['admin', 'head_office']:
                return Response(
                    {'error': 'You do not have permission to view this data'}, 
                    status=403
                )

            # Get real data from all models
            data = self.get_overview_data()
            return Response(data)
            
        except Exception as e:
            return Response(
                {'error': f'Error loading overview data: {str(e)}'}, 
                status=500
            )

    def get_overview_data(self):
        """Collect real data from all models"""
        
        # Basic counts
        total_centers = Center.objects.count()
        active_students = Student.objects.filter(enrollment_status='Enrolled').count()
        total_instructors = User.objects.filter(role='instructor', is_active=True).count()
        
        # Completion rate from courses
        total_courses = Course.objects.count()
        completed_courses = Course.objects.filter(progress=100).count()
        completion_rate = round((completed_courses / total_courses * 100) if total_courses > 0 else 0, 1)

        # Enrollment trends (last 6 months)
        enrollment_data = self.get_enrollment_data()
        
        # Center performance
        center_performance_data = self.get_center_performance_data()
        
        # Recent activities
        recent_activities = self.get_recent_activities()
        
        # Trends
        trends = self.get_trends_data()

        return {
            'total_centers': total_centers,
            'active_students': active_students,
            'total_instructors': total_instructors,
            'completion_rate': completion_rate,
            'enrollment_data': enrollment_data,
            'center_performance_data': center_performance_data,
            'recent_activities': recent_activities,
            'trends': trends,
        }

    def get_enrollment_data(self):
        """Get real enrollment data for the last 6 months"""
        enrollment_data = []
        for i in range(5, -1, -1):
            month_start = timezone.now().replace(day=1) - timedelta(days=30*i)
            month_name = month_start.strftime('%b')
            
            monthly_students = Student.objects.filter(
                created_at__year=month_start.year,
                created_at__month=month_start.month
            ).count()
            
            enrollment_data.append({
                'month': month_name,
                'students': monthly_students
            })
        
        return enrollment_data

    def get_center_performance_data(self):
        """Get real center performance distribution"""
        performance_data = Center.objects.values('performance').annotate(
            count=Count('id')
        ).order_by('-count')
        
        colors = {
            'Excellent': '#16a34a',
            'Good': '#eab308',
            'Average': '#38bdf8',
            'Needs Improvement': '#ef4444',
            None: '#9ca3af'
        }
        
        return [
            {
                'name': item['performance'] or 'Not Rated',
                'value': item['count'],
                'color': colors.get(item['performance'], '#9ca3af')
            }
            for item in performance_data
        ]

    def get_recent_activities(self):
        """Get real recent activities from all models"""
        activities = []
        
        # Recent centers
        recent_centers = Center.objects.order_by('-created_at')[:3]
        for center in recent_centers:
            activities.append({
                'id': f"center_{center.id}",
                'activity': f'New center registered: {center.name}',
                'time': self.get_time_ago(center.created_at),
                'type': 'success'
            })
        
        # Recent course approvals
        recent_approvals = CourseApproval.objects.filter(
            approval_status='approved'
        ).order_by('-approved_at')[:2]
        
        for approval in recent_approvals:
            activities.append({
                'id': f"approval_{approval.id}",
                'activity': f'Course approved: {approval.course.name}',
                'time': self.get_time_ago(approval.approved_at),
                'type': 'info'
            })
        
        # Pending approvals
        pending_count = Approval.objects.filter(status='pending').count()
        if pending_count > 0:
            activities.append({
                'id': "pending_approvals",
                'activity': f'{pending_count} approvals pending review',
                'time': 'Just now',
                'type': 'warning'
            })
        
        return activities

    def get_trends_data(self):
        """Calculate real trends compared to previous period"""
        last_month = timezone.now() - timedelta(days=30)
        
        # Center trend
        previous_centers = Center.objects.filter(created_at__lt=last_month).count()
        current_centers = Center.objects.count()
        center_trend = current_centers - previous_centers
        
        # Student trend
        previous_students = Student.objects.filter(created_at__lt=last_month).count()
        current_students = Student.objects.count()
        student_trend = current_students - previous_students
        
        # Instructor trend
        previous_instructors = User.objects.filter(
            date_joined__lt=last_month,
            role='instructor'
        ).count()
        current_instructors = User.objects.filter(role='instructor').count()
        instructor_trend = current_instructors - previous_instructors
        
        # Completion rate trend
        previous_courses = Course.objects.filter(created_at__lt=last_month).count()
        previous_completed = Course.objects.filter(
            created_at__lt=last_month,
            progress=100
        ).count()
        previous_rate = round((previous_completed / previous_courses * 100) if previous_courses > 0 else 0, 1)
        
        current_courses = Course.objects.count()
        current_completed = Course.objects.filter(progress=100).count()
        current_rate = round((current_completed / current_courses * 100) if current_courses > 0 else 0, 1)
        
        completion_trend = current_rate - previous_rate

        return {
            'centers': {'value': abs(center_trend), 'isPositive': center_trend > 0},
            'students': {'value': abs(student_trend), 'isPositive': student_trend > 0},
            'instructors': {'value': abs(instructor_trend), 'isPositive': instructor_trend > 0},
            'completion': {'value': abs(completion_trend), 'isPositive': completion_trend > 0},
        }

    def get_time_ago(self, date):
        """Convert datetime to human readable time ago"""
        now = timezone.now()
        diff = now - date
        
        if diff.days > 0:
            return f'{diff.days} days ago'
        elif diff.seconds // 3600 > 0:
            return f'{diff.seconds // 3600} hours ago'
        elif diff.seconds // 60 > 0:
            return f'{diff.seconds // 60} minutes ago'
        else:
            return 'Just now'