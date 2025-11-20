# courses/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Course(models.Model):
    COURSE_STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    ]
    
    PRIORITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
    ]
    
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    duration = models.CharField(max_length=50, blank=True, null=True)
    schedule = models.CharField(max_length=100, blank=True, null=True)
    students = models.IntegerField(default=0)
    progress = models.IntegerField(default=0)
    next_session = models.CharField(max_length=100, blank=True, null=True)
    instructor = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='courses_teaching'
    )
    district = models.CharField(max_length=100)
    # ADD CENTER FIELD
    center = models.ForeignKey(
        'centers.Center',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='courses_offered'
    )
    status = models.CharField(max_length=20, choices=COURSE_STATUS_CHOICES, default='Pending')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Medium')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.code} - {self.name}"

class CourseApproval(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE)
    approval_status = models.CharField(max_length=20, choices=Course.COURSE_STATUS_CHOICES)
    comments = models.TextField(blank=True, null=True)
    approved_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='approved_courses'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Approval for {self.course.code} - {self.approval_status}"