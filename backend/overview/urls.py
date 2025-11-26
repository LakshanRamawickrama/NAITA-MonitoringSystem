# overview/urls.py - UPDATED VERSION
from django.urls import path
from .views import OverviewView, DashboardStatsView, InstructorOverviewView

urlpatterns = [
    path('', OverviewView.as_view(), name='overview'),
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('instructor/', InstructorOverviewView.as_view(), name='instructor-overview'),
]