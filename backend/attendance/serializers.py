# attendance/serializers.py
from rest_framework import serializers
from .models import Attendance, AttendanceSummary
from students.serializers import StudentSerializer
from courses.serializers import CourseSerializer

class AttendanceSerializer(serializers.ModelSerializer):
    student_details = StudentSerializer(source='student', read_only=True)
    course_details = CourseSerializer(source='course', read_only=True)
    recorded_by_details = serializers.StringRelatedField(source='recorded_by', read_only=True)
    
    class Meta:
        model = Attendance
        fields = '__all__'

class AttendanceSummarySerializer(serializers.ModelSerializer):
    course_details = CourseSerializer(source='course', read_only=True)
    
    class Meta:
        model = AttendanceSummary
        fields = '__all__'