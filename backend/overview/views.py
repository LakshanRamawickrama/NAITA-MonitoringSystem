# overview/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Count, Q, Avg
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
            # Check user role and permissions
            user = request.user
            
            # District managers can only view their district data
            if user.role == 'district_manager':
                data = self.get_district_manager_data(user)
            elif user.role in ['admin', 'head_office']:
                data = self.get_admin_data()
            else:
                return Response(
                    {'error': 'You do not have permission to view this data'}, 
                    status=403
                )

            return Response(data)
            
        except Exception as e:
            return Response(
                {'error': f'Error loading overview data: {str(e)}'}, 
                status=500
            )

    def get_district_manager_data(self, user):
        """Get data specific to district manager's district"""
        if not user.district:
            return {
                'error': 'No district assigned to your account'
            }

        # Filter all data by district
        district_filter = Q(district=user.district)
        
        # Basic counts for district
        total_centers = Center.objects.filter(district_filter).count()
        active_students = Student.objects.filter(
            district_filter, 
            enrollment_status='Enrolled'
        ).count()
        total_instructors = User.objects.filter(
            district_filter,
            role='instructor', 
            is_active=True
        ).count()
        
        # Course completion rate for district
        district_courses = Course.objects.filter(district_filter)
        total_courses = district_courses.count()
        completed_courses = district_courses.filter(progress=100).count()
        completion_rate = round((completed_courses / total_courses * 100) if total_courses > 0 else 0, 1)

        # Enrollment trends for district (last 6 months)
        enrollment_data = self.get_district_enrollment_data(user.district)
        
        # Center performance for district
        center_performance_data = self.get_district_center_performance(user.district)
        
        # Recent activities in district
        recent_activities = self.get_district_recent_activities(user.district)
        
        # Trends compared to previous period
        trends = self.get_district_trends(user.district)

        return {
            'total_centers': total_centers,
            'active_students': active_students,
            'total_instructors': total_instructors,
            'completion_rate': completion_rate,
            'enrollment_data': enrollment_data,
            'center_performance_data': center_performance_data,
            'recent_activities': recent_activities,
            'trends': trends,
            'user_district': user.district
        }

    def get_admin_data(self):
        """Get system-wide data for admin users"""
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

    def get_district_enrollment_data(self, district):
        """Get enrollment data for specific district"""
        enrollment_data = []
        for i in range(5, -1, -1):
            month_start = timezone.now().replace(day=1) - timedelta(days=30*i)
            month_name = month_start.strftime('%b')
            
            monthly_students = Student.objects.filter(
                district=district,
                created_at__year=month_start.year,
                created_at__month=month_start.month
            ).count()
            
            enrollment_data.append({
                'month': month_name,
                'students': monthly_students
            })
        
        return enrollment_data

    def get_district_center_performance(self, district):
        """Get center performance distribution for district"""
        performance_data = Center.objects.filter(district=district).values('performance').annotate(
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

    def get_district_recent_activities(self, district):
        """Get recent activities for district"""
        activities = []
        
        # Recent centers in district
        recent_centers = Center.objects.filter(district=district).order_by('-created_at')[:3]
        for center in recent_centers:
            activities.append({
                'id': f"center_{center.id}",
                'activity': f'New center registered: {center.name}',
                'time': self.get_time_ago(center.created_at),
                'type': 'success'
            })
        
        # Recent course approvals in district
        recent_approvals = CourseApproval.objects.filter(
            course__district=district,
            approval_status='approved'
        ).order_by('-approved_at')[:2]
        
        for approval in recent_approvals:
            activities.append({
                'id': f"approval_{approval.id}",
                'activity': f'Course approved: {approval.course.name}',
                'time': self.get_time_ago(approval.approved_at),
                'type': 'info'
            })
        
        # Pending approvals in district
        pending_count = Approval.objects.filter(
            center=district,  # Using center field to store district for approvals
            status='pending'
        ).count()
        if pending_count > 0:
            activities.append({
                'id': "pending_approvals",
                'activity': f'{pending_count} approvals pending review in {district}',
                'time': 'Just now',
                'type': 'warning'
            })
        
        return activities

    def get_district_trends(self, district):
        """Calculate trends for district compared to previous period"""
        last_month = timezone.now() - timedelta(days=30)
        
        # Center trend
        previous_centers = Center.objects.filter(
            district=district,
            created_at__lt=last_month
        ).count()
        current_centers = Center.objects.filter(district=district).count()
        center_trend = current_centers - previous_centers
        
        # Student trend
        previous_students = Student.objects.filter(
            district=district,
            created_at__lt=last_month
        ).count()
        current_students = Student.objects.filter(district=district).count()
        student_trend = current_students - previous_students
        
        # Instructor trend
        previous_instructors = User.objects.filter(
            district=district,
            date_joined__lt=last_month,
            role='instructor'
        ).count()
        current_instructors = User.objects.filter(
            district=district,
            role='instructor'
        ).count()
        instructor_trend = current_instructors - previous_instructors
        
        # Completion rate trend
        previous_courses = Course.objects.filter(
            district=district,
            created_at__lt=last_month
        ).count()
        previous_completed = Course.objects.filter(
            district=district,
            created_at__lt=last_month,
            progress=100
        ).count()
        previous_rate = round((previous_completed / previous_courses * 100) if previous_courses > 0 else 0, 1)
        
        current_courses = Course.objects.filter(district=district).count()
        current_completed = Course.objects.filter(
            district=district,
            progress=100
        ).count()
        current_rate = round((current_completed / current_courses * 100) if current_courses > 0 else 0, 1)
        
        completion_trend = current_rate - previous_rate

        return {
            'centers': {'value': abs(center_trend), 'isPositive': center_trend > 0},
            'students': {'value': abs(student_trend), 'isPositive': student_trend > 0},
            'instructors': {'value': abs(instructor_trend), 'isPositive': instructor_trend > 0},
            'completion': {'value': abs(completion_trend), 'isPositive': completion_trend > 0},
        }

    # Keep the original methods for admin users
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
    # Add this to overview/views.py
class DashboardStatsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            
            if user.role == 'district_manager':
                data = self.get_district_dashboard_stats(user.district)
            else:
                data = self.get_system_dashboard_stats()
            
            return Response(data)
            
        except Exception as e:
            return Response(
                {'error': f'Error loading dashboard stats: {str(e)}'}, 
                status=500
            )

    def get_district_dashboard_stats(self, district):
        """Get dashboard stats for specific district"""
        # Total counts
        total_students = Student.objects.filter(district=district).count()
        total_centers = Center.objects.filter(district=district).count()
        total_courses = Course.objects.filter(district=district).count()
        active_courses = Course.objects.filter(district=district, status='Active').count()
        
        # Pending approvals
        pending_approvals = Approval.objects.filter(
            center=district,
            status='pending'
        ).count()
        
        # Enrollment stats
        enrollment_stats = {
            'enrolled': Student.objects.filter(district=district, enrollment_status='Enrolled').count(),
            'completed': Student.objects.filter(district=district, enrollment_status='Completed').count(),
            'pending': Student.objects.filter(district=district, enrollment_status='Pending').count(),
            'dropped': Student.objects.filter(district=district, enrollment_status='Dropped').count(),
        }
        
        # Training stats
        training_stats = {
            'trained': Student.objects.filter(district=district, training_received=True).count(),
            'not_trained': Student.objects.filter(district=district, training_received=False).count(),
        }
        
        # Recent activity (last 7 days)
        week_ago = timezone.now() - timedelta(days=7)
        recent_activity = {
            'new_students': Student.objects.filter(
                district=district, 
                created_at__gte=week_ago
            ).count(),
            'new_courses': Course.objects.filter(
                district=district,
                created_at__gte=week_ago
            ).count(),
            'completed_courses': Course.objects.filter(
                district=district,
                progress=100,
                updated_at__gte=week_ago
            ).count(),
        }

        return {
            'total_students': total_students,
            'total_centers': total_centers,
            'total_courses': total_courses,
            'active_courses': active_courses,
            'pending_approvals': pending_approvals,
            'enrollment_stats': enrollment_stats,
            'training_stats': training_stats,
            'recent_activity': recent_activity,
        }

    def get_system_dashboard_stats(self):
        """Get system-wide dashboard stats"""
        # Similar logic but without district filtering
        total_students = Student.objects.count()
        total_centers = Center.objects.count()
        total_courses = Course.objects.count()
        active_courses = Course.objects.filter(status='Active').count()
        pending_approvals = Approval.objects.filter(status='pending').count()
        
        enrollment_stats = {
            'enrolled': Student.objects.filter(enrollment_status='Enrolled').count(),
            'completed': Student.objects.filter(enrollment_status='Completed').count(),
            'pending': Student.objects.filter(enrollment_status='Pending').count(),
            'dropped': Student.objects.filter(enrollment_status='Dropped').count(),
        }
        
        training_stats = {
            'trained': Student.objects.filter(training_received=True).count(),
            'not_trained': Student.objects.filter(training_received=False).count(),
        }
        
        week_ago = timezone.now() - timedelta(days=7)
        recent_activity = {
            'new_students': Student.objects.filter(created_at__gte=week_ago).count(),
            'new_courses': Course.objects.filter(created_at__gte=week_ago).count(),
            'completed_courses': Course.objects.filter(progress=100, updated_at__gte=week_ago).count(),
        }

        return {
            'total_students': total_students,
            'total_centers': total_centers,
            'total_courses': total_courses,
            'active_courses': active_courses,
            'pending_approvals': pending_approvals,
            'enrollment_stats': enrollment_stats,
            'training_stats': training_stats,
            'recent_activity': recent_activity,
        }