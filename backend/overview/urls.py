# overview/urls.py
from django.urls import path
from .views import OverviewView, DashboardStatsView

urlpatterns = [
    path('overview/', OverviewView.as_view(), name='overview'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
]