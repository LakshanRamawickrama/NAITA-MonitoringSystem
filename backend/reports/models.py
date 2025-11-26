# reports/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class HeadOfficeReport(models.Model):
    REPORT_TYPE_CHOICES = [
        ('island', 'Island Performance'),
        ('districts', 'District Comparison'),
        ('centers', 'Centers Analysis'),
        ('comprehensive', 'Island-Wide Comprehensive'),
        ('instructors', 'Instructors Summary'),
    ]
    
    PERIOD_CHOICES = [
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('custom', 'Custom Date Range'),
    ]
    
    FORMAT_CHOICES = [
        ('pdf', 'PDF'),
        ('excel', 'Excel'),
    ]
    
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES)
    period = models.CharField(max_length=20, choices=PERIOD_CHOICES)
    format = models.CharField(max_length=10, choices=FORMAT_CHOICES)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    include_districts = models.BooleanField(default=True)
    include_centers = models.BooleanField(default=True)
    include_courses = models.BooleanField(default=True)
    include_instructors = models.BooleanField(default=True)
    generated_by = models.ForeignKey(User, on_delete=models.CASCADE)
    file_path = models.CharField(max_length=500, blank=True, null=True)
    file_name = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, default='processing', choices=[
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Head Office Report - {self.report_type} - {self.created_at.strftime('%Y-%m-%d')}"