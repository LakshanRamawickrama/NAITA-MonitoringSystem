# overview/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class DashboardSnapshot(models.Model):
    """Store dashboard data snapshots for performance"""
    total_centers = models.IntegerField()
    active_students = models.IntegerField()
    total_instructors = models.IntegerField()
    completion_rate = models.FloatField()
    snapshot_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'overview_dashboard_snapshot'