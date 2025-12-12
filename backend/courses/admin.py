# courses/admin.py
from django.contrib import admin
from .models import Course, CourseApproval, CourseCategory, CourseDuration

@admin.register(CourseCategory)
class CourseCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name', 'description')

@admin.register(CourseDuration)
class CourseDurationAdmin(admin.ModelAdmin):
    list_display = ('duration', 'order', 'created_at')
    list_editable = ('order',)
    search_fields = ('duration',)
    ordering = ('order', 'duration')

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'instructor', 'center', 'district', 'status')
    list_filter = ('district', 'status', 'category', 'center')
    search_fields = ('name', 'code', 'instructor__username', 'center__name')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(CourseApproval)
class CourseApprovalAdmin(admin.ModelAdmin):
    list_display = ('course', 'requested_by', 'approval_status', 'created_at')
    list_filter = ('approval_status',)