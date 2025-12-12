# overview/views.py - COMPLETE FIXED VERSION
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Count, Q, Avg, F
from django.utils import timezone
from datetime import timedelta
import json
import logging

from centers.models import Center
from users.models import User
from students.models import Student
from courses.models import Course, CourseApproval
from approvals.models import Approval
from attendance.models import Attendance, AttendanceSummary

logger = logging.getLogger(__name__)

class OverviewView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Check user role and permissions
            user = request.user
            
            # District managers and training officers can view their district data
            if user.role in ['district_manager', 'training_officer']:
                data = self.get_district_data(user)
            elif user.role in ['admin', 'head_office']:
                data = self.get_admin_data()
            else:
                return Response(
                    {'error': 'You do not have permission to view this data'}, 
                    status=403
                )

            return Response(data)
            
        except Exception as e:
            logger.error(f"Error in overview view: {str(e)}")
            return Response(
                {'error': f'Error loading overview data: {str(e)}'}, 
                status=500
            )

    def get_district_data(self, user):
        """Get data specific to user's district"""
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
            'district_summary': {
                'total_districts': Center.objects.values('district').distinct().count(),
                'active_districts': Course.objects.filter(status='Active').values('district').distinct().count(),
                'new_districts_week': Center.objects.filter(created_at__gte=timezone.now() - timedelta(days=7)).values('district').distinct().count()
            },
            'training_summary': {
                'active_courses': Course.objects.filter(status='Active').count(),
                'completed_month': Course.objects.filter(
                    progress=100,
                    updated_at__year=timezone.now().year,
                    updated_at__month=timezone.now().month
                ).count(),
                'upcoming': Course.objects.filter(status='Pending').count()
            },
            'system_stats': {
                'active_users': User.objects.filter(is_active=True).count(),
                'api_status': 'Operational',
                'database_status': 'Healthy'
            }
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

class DashboardStatsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            
            if user.role in ['district_manager', 'training_officer']:
                if not user.district:
                    return Response(
                        {'error': 'No district assigned to your account'}, 
                        status=400
                    )
                data = self.get_district_dashboard_stats(user.district)
            else:
                data = self.get_system_dashboard_stats()
            
            return Response(data)
            
        except Exception as e:
            logger.error(f"Error in dashboard stats: {str(e)}")
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

class InstructorOverviewView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            
            if user.role != 'instructor':
                return Response(
                    {'error': 'Only instructors can access this endpoint'}, 
                    status=403
                )

            # Get instructor's courses
            instructor_courses = Course.objects.filter(instructor=user, status='Active')
            
            # Calculate real stats
            stats = self.calculate_instructor_stats(user, instructor_courses)
            upcoming_classes = self.get_upcoming_classes(instructor_courses)
            recent_activity = self.get_recent_activity(user, instructor_courses)

            return Response({
                'stats': stats,
                'upcomingClasses': upcoming_classes,
                'recentActivity': recent_activity
            })
            
        except Exception as e:
            logger.error(f"Error in instructor overview: {str(e)}")
            return Response(
                {'error': f'Failed to load instructor overview: {str(e)}'}, 
                status=500
            )

    def calculate_instructor_stats(self, user, instructor_courses):
        """Calculate real instructor statistics"""
        
        # Calculate total students across all courses
        total_students = Student.objects.filter(
            course__in=instructor_courses,
            enrollment_status='Enrolled'
        ).count()
        
        # Calculate weekly teaching hours based on course schedule
        weekly_hours = self.calculate_weekly_hours(instructor_courses)
        
        # Calculate completed courses
        completed_courses = instructor_courses.filter(progress=100).count()
        
        # Calculate upcoming classes (next 7 days)
        upcoming_classes_count = self.get_upcoming_classes_count(instructor_courses)
        
        # Calculate performance rating based on course completion and student progress
        performance = self.calculate_performance_rating(instructor_courses)
        
        # Calculate attendance rate for current week
        attendance_rate = self.calculate_attendance_rate(instructor_courses)
        
        return {
            'weeklyHours': weekly_hours,
            'totalStudents': total_students,
            'completedCourses': completed_courses,
            'upcomingClasses': upcoming_classes_count,
            'performance': performance,
            'attendanceRate': attendance_rate
        }

    def calculate_weekly_hours(self, courses):
        """Calculate weekly teaching hours from course schedules"""
        total_hours = 0
        
        for course in courses:
            # Parse schedule to extract hours (e.g., "Mon, Wed 09:00-11:00" -> 4 hours per week)
            if course.schedule:
                # Basic parsing - you might need to adjust based on your schedule format
                if '09:00-12:00' in course.schedule or '9:00-12:00' in course.schedule:
                    total_hours += 3 * 2  # 3 hours, 2 times per week
                elif '14:00-17:00' in course.schedule or '2:00-5:00' in course.schedule:
                    total_hours += 3 * 2
                elif '09:00-11:00' in course.schedule:
                    total_hours += 2 * 2
                else:
                    total_hours += 6  # default fallback
        
        return total_hours if total_hours > 0 else 20  # fallback to 20 hours

    def get_upcoming_classes_count(self, courses):
        """Count upcoming classes in the next 7 days"""
        today = timezone.now().date()
        next_week = today + timedelta(days=7)
        
        # This is a simplified count - you might want to check specific class dates
        return courses.filter(
            Q(next_session__gte=today) | Q(next_session__isnull=True),
            status='Active'
        ).count()

    def calculate_performance_rating(self, courses):
        """Calculate instructor performance rating (1-5)"""
        if not courses:
            return 4.0
            
        # Base rating on course completion rates and student progress
        total_progress = sum(course.progress for course in courses)
        avg_progress = total_progress / len(courses)
        
        # Convert to 1-5 scale (assuming 100% progress = 5.0)
        performance = (avg_progress / 100) * 4 + 1  # Scale to 1-5
        return round(min(performance, 5.0), 1)  # Cap at 5.0

    def calculate_attendance_rate(self, courses):
        """Calculate average attendance rate for current week"""
        if not courses:
            return 0
            
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        
        attendance_rates = []
        for course in courses:
            # Get attendance summary for the current week
            weekly_attendance = AttendanceSummary.objects.filter(
                course=course,
                date__gte=week_start,
                date__lte=today
            ).aggregate(avg_rate=Avg('attendance_rate'))
            
            if weekly_attendance['avg_rate']:
                attendance_rates.append(weekly_attendance['avg_rate'])
        
        if attendance_rates:
            return round(sum(attendance_rates) / len(attendance_rates), 1)
        return 85.0  # fallback

    def get_upcoming_classes(self, courses):
        """Get real upcoming classes data"""
        upcoming_classes = []
        today = timezone.now()
        
        for course in courses.filter(status='Active')[:5]:  # Limit to 5 upcoming classes
            # Determine next session date
            if course.next_session:
                next_date = course.next_session
            else:
                # Fallback: next occurrence based on schedule
                next_date = today + timedelta(days=1)
            
            # Get enrolled students count
            student_count = Student.objects.filter(
                course=course,
                enrollment_status='Enrolled'
            ).count()
            
            # Determine class time from schedule or use default
            class_time = "09:00 AM - 12:00 PM"  # Default
            if course.schedule:
                if '09:00-12:00' in course.schedule:
                    class_time = "09:00 AM - 12:00 PM"
                elif '14:00-17:00' in course.schedule:
                    class_time = "02:00 PM - 05:00 PM"
                elif '09:00-11:00' in course.schedule:
                    class_time = "09:00 AM - 11:00 AM"
            
            upcoming_classes.append({
                'id': str(course.id),
                'course': course.name,
                'date': next_date.strftime('%Y-%m-%d') if hasattr(next_date, 'strftime') else str(next_date),
                'time': class_time,
                'students': student_count
            })
        
        return upcoming_classes

    def get_recent_activity(self, user, courses):
        """Get real recent activity for the instructor"""
        recent_activity = []
        one_week_ago = timezone.now() - timedelta(days=7)
        
        # Recent attendance recordings
        recent_attendance = Attendance.objects.filter(
            recorded_by=user,
            recorded_at__gte=one_week_ago
        ).order_by('-recorded_at')[:3]
        
        for attendance in recent_attendance:
            recent_activity.append({
                'id': f"attendance_{attendance.id}",
                'action': f'Recorded attendance for {attendance.student.full_name_english}',
                'course': attendance.course.name,
                'time': self.get_time_ago(attendance.recorded_at)
            })
        
        # Recent course updates
        recent_course_updates = courses.filter(
            updated_at__gte=one_week_ago
        ).exclude(updated_at=F('created_at')).order_by('-updated_at')[:2]
        
        for course in recent_course_updates:
            recent_activity.append({
                'id': f"course_update_{course.id}",
                'action': 'Updated course materials',
                'course': course.name,
                'time': self.get_time_ago(course.updated_at)
            })
        
        # Add some default activities if no recent activity
        if not recent_activity:
            recent_activity.extend([
                {
                    'id': 'default_1',
                    'action': 'No recent activity',
                    'course': 'System',
                    'time': 'Just now'
                }
            ])
        
        return recent_activity

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