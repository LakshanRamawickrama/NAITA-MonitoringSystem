from django.db import models
from centers.models import Center  # Import from centers app

class Enrollment(models.Model):
    center = models.ForeignKey(Center, on_delete=models.CASCADE, related_name='enrollments')
    month = models.DateField()  # e.g., first day of month
    students = models.IntegerField(default=0)
    completed_students = models.IntegerField(default=0)  # For completion rates

    class Meta:
        unique_together = ('center', 'month')
        ordering = ['-month']

class Course(models.Model):
    name = models.CharField(max_length=100)
    center = models.ForeignKey(Center, on_delete=models.CASCADE, related_name='courses')
    students = models.IntegerField(default=0)  # Enrolled in this course

    class Meta:
        ordering = ['name']