# reports/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('training-officer-reports/', views.training_officer_reports, name='training-officer-reports'),
    path('export-training-report/', views.export_training_report, name='export-training-report'),
]