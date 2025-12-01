# students/admin.py - COMPLETE UPDATED VERSION
from django.contrib import admin
from django.utils.html import format_html
from .models import Student, EducationalQualification, DistrictCode, CourseCode, Batch, BatchYear

@admin.register(DistrictCode)
class DistrictCodeAdmin(admin.ModelAdmin):
    list_display = ['district_code', 'district_name', 'description']
    search_fields = ['district_code', 'district_name']
    list_filter = ['district_code']
    ordering = ['district_code']
    fields = ['district_name', 'district_code', 'description']

@admin.register(CourseCode)
class CourseCodeAdmin(admin.ModelAdmin):
    list_display = ['course_code', 'course_name', 'description']
    search_fields = ['course_code', 'course_name']
    list_filter = ['course_code']
    ordering = ['course_code']
    fields = ['course_name', 'course_code', 'description']

@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = ['batch_code', 'batch_name', 'is_active', 'display_order', 'student_count']
    list_editable = ['is_active', 'display_order']
    search_fields = ['batch_code', 'batch_name']
    list_filter = ['is_active']
    ordering = ['display_order', 'batch_code']
    fields = ['batch_code', 'batch_name', 'description', 'is_active', 'display_order']
    
    def get_queryset(self, request):
        return super().get_queryset(request).order_by('display_order', 'batch_code')
    
    def student_count(self, obj):
        return obj.students.count()
    student_count.short_description = 'Students'

@admin.register(BatchYear)
class BatchYearAdmin(admin.ModelAdmin):
    list_display = ['year_code', 'description', 'is_active']
    search_fields = ['year_code', 'description']
    list_filter = ['is_active']
    ordering = ['-year_code']
    fields = ['year_code', 'description', 'is_active']

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['registration_no', 'full_name_english', 'nic_id', 'district', 'course', 'batch', 'date_of_application', 'created_by']
    list_filter = ['district', 'gender', 'training_received', 'created_at', 'course', 'enrollment_status', 'batch']
    search_fields = ['registration_no', 'full_name_english', 'nic_id', 'district', 'district_code', 'course_code']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Registration Information', {
            'fields': (
                'registration_no', 
                ('district_code', 'course_code', 'batch'),
                ('student_number', 'registration_year'),
                'date_of_application', 
                'enrollment_date', 
                'enrollment_status'
            )
        }),
        ('Personal Information', {
            'fields': (
                'full_name_english', 
                'full_name_sinhala', 
                'name_with_initials', 
                'gender', 
                'date_of_birth', 
                'nic_id'
            )
        }),
        ('Address Information', {
            'fields': (
                'address_line', 
                'district', 
                'divisional_secretariat',
                'grama_niladhari_division', 
                'village', 
                'residence_type'
            )
        }),
        ('Contact Information', {
            'fields': ('mobile_no', 'email')
        }),
        ('Training Details', {
            'fields': (
                'training_received', 
                'training_provider', 
                'course_vocation_name',
                'training_duration', 
                'training_nature', 
                'training_establishment',
                'training_placement_preference'
            )
        }),
        ('Center & Course Information', {
            'fields': (
                'center', 
                'course'
            )
        }),
        ('System Information', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('center', 'course', 'created_by', 'batch')
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

@admin.register(EducationalQualification)
class EducationalQualificationAdmin(admin.ModelAdmin):
    list_display = ['student', 'subject', 'grade', 'year', 'type']
    list_filter = ['type', 'year']
    search_fields = ['student__full_name_english', 'subject']
    raw_id_fields = ['student']