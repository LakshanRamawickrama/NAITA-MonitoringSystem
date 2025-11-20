# overview/serializers.py
from rest_framework import serializers

class OverviewSerializer(serializers.Serializer):
    total_centers = serializers.IntegerField()
    active_students = serializers.IntegerField()
    total_instructors = serializers.IntegerField()
    completion_rate = serializers.FloatField()
    enrollment_data = serializers.ListField()
    center_performance_data = serializers.ListField()
    recent_activities = serializers.ListField()
    trends = serializers.DictField()