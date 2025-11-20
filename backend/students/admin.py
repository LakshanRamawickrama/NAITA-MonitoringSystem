# students/admin.py
from django.contrib import admin
from .models import Student, EducationalQualification

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['registration_no', 'full_name_english', 'nic_id', 'district', 'date_of_application', 'created_by']
    list_filter = ['district', 'gender', 'training_received', 'created_at']
    search_fields = ['registration_no', 'full_name_english', 'nic_id', 'district']
    readonly_fields = ['registration_no', 'created_at', 'updated_at']
    fieldsets = (
        ('Personal Information', {
            'fields': (
                'registration_no', 'full_name_english', 'full_name_sinhala', 
                'name_with_initials', 'gender', 'date_of_birth', 'nic_id'
            )
        }),
        ('Address Information', {
            'fields': (
                'address_line', 'district', 'divisional_secretariat',
                'grama_niladhari_division', 'village', 'residence_type'
            )
        }),
        ('Contact Information', {
            'fields': ('mobile_no', 'email')
        }),
        ('Training Details', {
            'fields': (
                'training_received', 'training_provider', 'course_vocation_name',
                'training_duration', 'training_nature', 'training_establishment',
                'training_placement_preference', 'date_of_application'
            )
        }),
        ('System Information', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(EducationalQualification)
class EducationalQualificationAdmin(admin.ModelAdmin):
    list_display = ['student', 'subject', 'grade', 'year', 'type']
    list_filter = ['type', 'year']
    search_fields = ['student__full_name_english', 'subject']