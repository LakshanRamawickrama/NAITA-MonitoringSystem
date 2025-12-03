# instructors/models.py
from django.db import models
from django.contrib.auth import get_user_model
from centers.models import Center

User = get_user_model()

class InstructorProfile(models.Model):
    """Extended profile for instructors"""
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='instructor_profile'
    )
    specialization = models.CharField(max_length=200)
    experience_years = models.IntegerField(default=0)
    qualifications = models.TextField(blank=True)
    bio = models.TextField(blank=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    available_hours = models.IntegerField(default=40)
    is_verified = models.BooleanField(default=False)
    joined_date = models.DateField(auto_now_add=True)
    
    # Contact information
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    
    # Centers where instructor works
    centers = models.ManyToManyField(Center, related_name='instructors', blank=True)
    
    # Ratings and performance
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    total_ratings = models.IntegerField(default=0)
    performance_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    
    class Meta:
        ordering = ['-average_rating', 'user__first_name']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.specialization}"
    
    def get_total_courses(self):
        """Get total courses taught by this instructor"""
        from courses.models import Course
        return Course.objects.filter(instructor=self.user).count()
    
    def get_active_courses(self):
        """Get active courses taught by this instructor"""
        from courses.models import Course
        return Course.objects.filter(instructor=self.user, status='Active').count()
    
    def get_total_students(self):
        """Get total students across all courses"""
        from courses.models import Course
        total = 0
        courses = Course.objects.filter(instructor=self.user)
        for course in courses:
            total += course.students
        return total

class InstructorAvailability(models.Model):
    """Instructor availability schedule"""
    instructor = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='availability_slots'
    )
    day_of_week = models.IntegerField(choices=[
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ])
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['day_of_week', 'start_time']
        unique_together = ['instructor', 'day_of_week', 'start_time', 'end_time']
    
    def __str__(self):
        return f"{self.instructor.get_full_name()} - {self.get_day_of_week_display()} {self.start_time}-{self.end_time}"

class InstructorPerformance(models.Model):
    """Instructor performance metrics"""
    instructor = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='performance_metrics'
    )
    month = models.DateField()
    courses_taught = models.IntegerField(default=0)
    students_taught = models.IntegerField(default=0)
    completion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    attendance_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    student_satisfaction = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-month']
        unique_together = ['instructor', 'month']
    
    def __str__(self):
        return f"{self.instructor.get_full_name()} - {self.month.strftime('%B %Y')}"