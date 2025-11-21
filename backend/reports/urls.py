# reports/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('district-reports/', views.district_manager_reports, name='district-reports'),
    path('district-overview/', views.district_overview, name='district-overview'),
]