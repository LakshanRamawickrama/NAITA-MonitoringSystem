# attendance/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Attendance(models.Model):
    ATTENDANCE_STATUS = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
    ]
    
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE)
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE)
    date = models.DateField()
    status = models.CharField(max_length=10, choices=ATTENDANCE_STATUS)
    check_in_time = models.TimeField(null=True, blank=True)
    remarks = models.TextField(blank=True, null=True)
    recorded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    recorded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['student', 'course', 'date']
        ordering = ['-date', 'student__full_name_english']
    
    def __str__(self):
        return f"{self.student.full_name_english} - {self.course.name} - {self.date}"

class AttendanceSummary(models.Model):
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE)
    date = models.DateField()
    total_students = models.IntegerField(default=0)
    present_count = models.IntegerField(default=0)
    absent_count = models.IntegerField(default=0)
    late_count = models.IntegerField(default=0)
    attendance_rate = models.FloatField(default=0.0)
    
    class Meta:
        unique_together = ['course', 'date']
        ordering = ['-date']