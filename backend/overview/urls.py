from django.urls import path
from .views import OverviewView, DashboardStatsView, InstructorOverviewView


urlpatterns = [
    path('overview/', OverviewView.as_view(), name='overview'),  
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),  
    path('instructor/overview/', InstructorOverviewView.as_view(), name='instructor-overview'),  
]