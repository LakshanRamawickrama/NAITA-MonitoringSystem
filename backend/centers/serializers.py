# centers/serializers.py
from rest_framework import serializers
from .models import Center

class CenterSerializer(serializers.ModelSerializer):
    enrolled_students_count = serializers.SerializerMethodField()  # ADD THIS
    
    class Meta:
        model = Center
        fields = '__all__'
    
    def get_enrolled_students_count(self, obj):
        return obj.enrolled_students.count()  # CHANGED FROM 'students'