# instructors/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from centers.models import Center
from courses.models import Course
from .models import InstructorProfile, InstructorAvailability, InstructorPerformance

User = get_user_model()

class CenterMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Center
        fields = ['id', 'name', 'district', 'location']

class CourseMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'name', 'code', 'category', 'duration', 'students', 'progress', 'status']

class UserMinimalSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name']
    
    def get_full_name(self, obj):
        return obj.get_full_name()

class InstructorProfileSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)
    centers = CenterMinimalSerializer(many=True, read_only=True)
    total_courses = serializers.SerializerMethodField()
    active_courses = serializers.SerializerMethodField()
    total_students = serializers.SerializerMethodField()
    
    class Meta:
        model = InstructorProfile
        fields = [
            'id', 'user', 'specialization', 'experience_years', 'qualifications', 'bio',
            'hourly_rate', 'available_hours', 'is_verified', 'joined_date',
            'phone', 'address', 'centers', 'average_rating', 'total_ratings',
            'performance_score', 'total_courses', 'active_courses', 'total_students'
        ]
        read_only_fields = ['average_rating', 'total_ratings', 'performance_score']
    
    def get_total_courses(self, obj):
        return obj.get_total_courses()
    
    def get_active_courses(self, obj):
        return obj.get_active_courses()
    
    def get_total_students(self, obj):
        return obj.get_total_students()

class InstructorListSerializer(serializers.ModelSerializer):
    user_details = UserMinimalSerializer(source='user', read_only=True)
    centers = CenterMinimalSerializer(many=True, read_only=True)
    courses_count = serializers.SerializerMethodField()
    students_count = serializers.SerializerMethodField()
    
    class Meta:
        model = InstructorProfile
        fields = [
            'id', 'user', 'user_details', 'specialization', 'experience_years',
            'is_verified', 'average_rating', 'performance_score',
            'centers', 'courses_count', 'students_count'
        ]
    
    def get_courses_count(self, obj):
        return obj.get_total_courses()
    
    def get_students_count(self, obj):
        return obj.get_total_students()

class InstructorAvailabilitySerializer(serializers.ModelSerializer):
    instructor = UserMinimalSerializer(read_only=True)
    
    class Meta:
        model = InstructorAvailability
        fields = ['id', 'instructor', 'day_of_week', 'start_time', 'end_time', 'is_available']

class InstructorPerformanceSerializer(serializers.ModelSerializer):
    instructor = UserMinimalSerializer(read_only=True)
    
    class Meta:
        model = InstructorPerformance
        fields = [
            'id', 'instructor', 'month', 'courses_taught', 'students_taught',
            'completion_rate', 'attendance_rate', 'student_satisfaction', 'created_at'
        ]

class InstructorStatsSerializer(serializers.Serializer):
    """Serializer for instructor statistics"""
    total_instructors = serializers.IntegerField()
    active_instructors = serializers.IntegerField()
    inactive_instructors = serializers.IntegerField()
    verified_instructors = serializers.IntegerField()
    average_courses_per_instructor = serializers.DecimalField(max_digits=5, decimal_places=2)
    average_experience = serializers.DecimalField(max_digits=5, decimal_places=2)
    top_specializations = serializers.DictField()
    by_district = serializers.DictField()
    by_center = serializers.DictField()
    
    class Meta:
        fields = [
            'total_instructors', 'active_instructors', 'inactive_instructors',
            'verified_instructors', 'average_courses_per_instructor',
            'average_experience', 'top_specializations', 'by_district', 'by_center'
        ]