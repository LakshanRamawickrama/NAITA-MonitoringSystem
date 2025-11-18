# users/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from centers.models import Center

User = get_user_model()

class CenterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Center
        fields = ["id", "name", "district"]

class UserListSerializer(serializers.ModelSerializer):
    center = CenterSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "role", "center", "district", "is_active", "is_staff", "last_login"
        ]

class UserCreateSerializer(serializers.ModelSerializer):
    center_id = serializers.PrimaryKeyRelatedField(
        queryset=Center.objects.all(),
        source="center",
        required=False,
        allow_null=True,
        write_only=True
    )
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            "username", "email", "password", "first_name", "last_name",
            "role", "center_id", "district", "is_active", "is_staff"
        ]

    def validate(self, data):
        request = self.context.get('request')
        
        # Check if the current user is a district manager trying to create another district manager
        if request and request.user.is_authenticated:
            if (request.user.role == 'district_manager' and 
                data.get('role') == 'district_manager'):
                raise serializers.ValidationError({
                    "role": "District managers cannot create other district managers."
                })
        
        return data

    def create(self, validated_data):
        request = self.context.get('request')
        
        # Set district automatically for district managers
        if request and request.user.is_authenticated:
            if request.user.role == 'district_manager' and request.user.district:
                validated_data['district'] = request.user.district
        
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        center = validated_data.pop("center", None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if center is not None:
            instance.center = center
        if password:
            instance.set_password(password)
        instance.save()
        return instance