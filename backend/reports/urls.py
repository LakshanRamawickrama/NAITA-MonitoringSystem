# reports/urls.py
from django.urls import path
from .views import head_office_reports, export_head_office_report, district_reports, export_district_report, training_officer_reports, export_training_report    

urlpatterns = [
    path('head-office/', head_office_reports, name='head-office-reports'),
    path('export-head-office/', export_head_office_report, name='export-head-office-report'),
    path('district/', district_reports, name='district-reports'),
    path('export-district/', export_district_report, name='export-district-report'),
    path('training-officer-reports/', training_officer_reports, name='training-officer-reports'), 
    path('export-training-report/', export_training_report, name='export-training-report'),  
]