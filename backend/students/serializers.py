# students/serializers.py
from rest_framework import serializers
from .models import Student, EducationalQualification

class EducationalQualificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EducationalQualification
        fields = ['id', 'subject', 'grade', 'year', 'type']

class StudentSerializer(serializers.ModelSerializer):
    ol_results = EducationalQualificationSerializer(many=True, required=False, write_only=True)
    al_results = EducationalQualificationSerializer(many=True, required=False, write_only=True)
    
    class Meta:
        model = Student
        fields = [
            'id', 'registration_no', 'full_name_english', 'full_name_sinhala', 
            'name_with_initials', 'gender', 'date_of_birth', 'nic_id',
            'address_line', 'district', 'divisional_secretariat', 
            'grama_niladhari_division', 'village', 'residence_type',
            'mobile_no', 'email', 'ol_results', 'al_results',
            'training_received', 'training_provider', 'course_vocation_name',
            'training_duration', 'training_nature', 'training_establishment',
            'training_placement_preference', 'date_of_application',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['registration_no', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Separate O/L and A/L results for response
        representation['ol_results'] = EducationalQualificationSerializer(
            instance.qualifications.filter(type='OL'), many=True
        ).data
        representation['al_results'] = EducationalQualificationSerializer(
            instance.qualifications.filter(type='AL'), many=True
        ).data
        return representation
    
    def validate(self, data):
        request = self.context.get('request')
        
        # For data entry officers, ensure district matches their district
        if request and request.user.is_authenticated and request.user.role == 'data_entry':
            user_district = request.user.district
            student_district = data.get('district')
            
            if student_district and student_district != user_district:
                raise serializers.ValidationError({
                    "district": f"You can only add students from your assigned district ({user_district})."
                })
        
        return data
    
    def create(self, validated_data):
        request = self.context.get('request')
        ol_results_data = validated_data.pop('ol_results', [])
        al_results_data = validated_data.pop('al_results', [])
        
        # Auto-set district for data entry officers
        if request and request.user.is_authenticated and request.user.role == 'data_entry':
            if not validated_data.get('district'):
                validated_data['district'] = request.user.district
        
        student = Student.objects.create(**validated_data)
        
        # Create O/L qualifications
        for ol_data in ol_results_data:
            EducationalQualification.objects.create(student=student, **ol_data)
        
        # Create A/L qualifications
        for al_data in al_results_data:
            EducationalQualification.objects.create(student=student, **al_data)
        
        return student
    
    def update(self, instance, validated_data):
        request = self.context.get('request')
        ol_results_data = validated_data.pop('ol_results', [])
        al_results_data = validated_data.pop('al_results', [])
        
        # For data entry officers, prevent changing district
        if request and request.user.is_authenticated and request.user.role == 'data_entry':
            if 'district' in validated_data and validated_data['district'] != request.user.district:
                raise serializers.ValidationError({
                    "district": f"You can only manage students from your assigned district ({request.user.district})."
                })
        
        # Update student fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update qualifications - delete existing and create new
        if ol_results_data or al_results_data:
            instance.qualifications.all().delete()
            
            for ol_data in ol_results_data:
                EducationalQualification.objects.create(student=instance, **ol_data)
            
            for al_data in al_results_data:
                EducationalQualification.objects.create(student=instance, **al_data)
        
        return instance

class StudentImportSerializer(serializers.Serializer):
    file = serializers.FileField()
    
    class Meta:
        fields = ['file']