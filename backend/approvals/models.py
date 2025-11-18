# approvals/models.py
from django.db import models
from django.conf import settings

class Approval(models.Model):
    TYPE_CHOICES = [
        ('Equipment Request', 'Equipment Request'),
        ('Staff Recruitment', 'Staff Recruitment'),
        ('Course Addition', 'Course Addition'),
        ('Infrastructure', 'Infrastructure'),
        ('Training Materials', 'Training Materials'),
    ]

    PRIORITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
    ]

    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Under Review', 'Under Review'),
    ]

    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    center = models.CharField(max_length=100)
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='approvals_requested')
    description = models.TextField()
    date_requested = models.DateField(auto_now_add=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')

    def __str__(self):
        return f"{self.type} - {self.center}"