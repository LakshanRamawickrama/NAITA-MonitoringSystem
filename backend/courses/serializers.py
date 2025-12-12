# courses/serializers.py
from rest_framework import serializers
from .models import Course, CourseApproval, CourseCategory, CourseDuration
from django.contrib.auth import get_user_model
from centers.serializers import CenterSerializer  # ADD IMPORT

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class CourseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseCategory
        fields = ['id', 'name', 'description']

class CourseDurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseDuration
        fields = ['id', 'duration']

class CourseSerializer(serializers.ModelSerializer):
    instructor_details = UserSerializer(source='instructor', read_only=True)
    center_details = CenterSerializer(source='center', read_only=True)  # ADD THIS
    
    class Meta:
        model = Course
        fields = [
            'id', 'name', 'code', 'description', 'category', 'duration',
            'schedule', 'students', 'progress', 'next_session', 'instructor',
            'instructor_details', 'district', 'center', 'center_details', 'status', 'priority',  # ADD CENTER FIELDS
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class CourseApprovalSerializer(serializers.ModelSerializer):
    course_details = CourseSerializer(source='course', read_only=True)
    requested_by_details = UserSerializer(source='requested_by', read_only=True)
    approved_by_details = UserSerializer(source='approved_by', read_only=True)
    
    class Meta:
        model = CourseApproval
        fields = [
            'id', 'course', 'course_details', 'requested_by', 'requested_by_details',
            'approval_status', 'comments', 'approved_by', 'approved_by_details',
            'approved_at', 'created_at'
        ]
        read_only_fields = ['created_at']