# centers/models.py
from django.db import models

class Center(models.Model):
    name = models.CharField(max_length=255, unique=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    district = models.CharField(max_length=100, blank=True, null=True)
    manager = models.CharField(max_length=255, blank=True, null=True)
    student_count = models.PositiveIntegerField(default=0, blank=True, null=True)  # CHANGED FROM 'students'
    instructor_count = models.PositiveIntegerField(default=0, blank=True, null=True)  # CHANGED FROM 'instructors'
    phone = models.CharField(max_length=20, blank=True, null=True)
    status = models.CharField(max_length=20, default="Active")
    performance = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name