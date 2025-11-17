from rest_framework import serializers
from .models import Enrollment, Course

class EnrollmentSerializer(serializers.ModelSerializer):
    month = serializers.DateField(format='%b')  # e.g., 'Jan'

    class Meta:
        model = Enrollment
        fields = ['month', 'students']

class CompletionRateSerializer(serializers.Serializer):
    center = serializers.CharField()
    rate = serializers.IntegerField()

class CourseDistributionSerializer(serializers.Serializer):
    name = serializers.CharField()
    value = serializers.IntegerField()
    color = serializers.CharField()