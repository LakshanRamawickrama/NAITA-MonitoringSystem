# centers/serializers.py
from rest_framework import serializers
from .models import Center


class CenterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Center
        fields = [
            "id", "name", "location", "manager",
            "students", "instructors", "phone",
            "status", "performance"
        ]