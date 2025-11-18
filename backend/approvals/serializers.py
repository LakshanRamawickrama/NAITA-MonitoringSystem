# approvals/serializers.py
from rest_framework import serializers
from .models import Approval
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

class ApprovalSerializer(serializers.ModelSerializer):
    requested_by = UserSerializer(read_only=True)

    class Meta:
        model = Approval
        fields = '__all__'

    def create(self, validated_data):
        # Set requested_by to current user
        validated_data['requested_by'] = self.context['request'].user
        return super().create(validated_data)