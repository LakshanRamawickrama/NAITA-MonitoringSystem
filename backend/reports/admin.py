# reports/admin.py
from django.contrib import admin
from .models import HeadOfficeReport

@admin.register(HeadOfficeReport)
class HeadOfficeReportAdmin(admin.ModelAdmin):
    list_display = ['report_type', 'period', 'format', 'status', 'generated_by', 'created_at']
    list_filter = ['report_type', 'period', 'format', 'status', 'created_at']
    search_fields = ['generated_by__username', 'generated_by__email']
    readonly_fields = ['created_at', 'completed_at']