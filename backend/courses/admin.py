from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Course, CourseApproval

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'instructor', 'district', 'status', 'students', 'created_at']
    list_filter = ['status', 'district', 'category', 'created_at']
    search_fields = ['name', 'code', 'instructor__username', 'district']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(CourseApproval)
class CourseApprovalAdmin(admin.ModelAdmin):
    list_display = ['course', 'requested_by', 'approval_status', 'approved_by', 'created_at']
    list_filter = ['approval_status', 'created_at']
    search_fields = ['course__name', 'course__code', 'requested_by__username']
    readonly_fields = ['created_at']