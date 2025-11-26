# reports/serializers.py
from rest_framework import serializers
from .models import HeadOfficeReport

class HeadOfficeReportSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.CharField(source='generated_by.get_full_name', read_only=True)
    
    class Meta:
        model = HeadOfficeReport
        fields = [
            'id', 'report_type', 'period', 'format', 'start_date', 'end_date',
            'include_districts', 'include_centers', 'include_courses', 'include_instructors',
            'generated_by', 'generated_by_name', 'file_path', 'file_name', 'status',
            'created_at', 'completed_at'
        ]
        read_only_fields = ['generated_by', 'file_path', 'file_name', 'status', 'created_at', 'completed_at']

class ReportExportSerializer(serializers.Serializer):
    format = serializers.ChoiceField(choices=['pdf', 'excel'])
    period = serializers.ChoiceField(choices=['weekly', 'monthly', 'quarterly', 'custom'])
    report_type = serializers.ChoiceField(choices=[
        'island', 'districts', 'centers', 'comprehensive', 'instructors'
    ])
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)
    include_districts = serializers.BooleanField(default=True)
    include_centers = serializers.BooleanField(default=True)
    include_courses = serializers.BooleanField(default=True)
    include_instructors = serializers.BooleanField(default=True)