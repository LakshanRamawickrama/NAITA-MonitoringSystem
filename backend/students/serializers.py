# students/serializers.py
from rest_framework import serializers
from django.utils import timezone
from datetime import datetime
from .models import Student, EducationalQualification, DistrictCode, CourseCode, BatchYear
from centers.models import Center
from courses.models import Course

class DistrictCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DistrictCode
        fields = ['id', 'district_name', 'district_code', 'description']

class CourseCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseCode
        fields = ['id', 'course_name', 'course_code', 'description']

class BatchYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = BatchYear
        fields = ['id', 'year_code', 'description', 'is_active']

class EducationalQualificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EducationalQualification
        fields = ['id', 'subject', 'grade', 'year', 'type']

class StudentSerializer(serializers.ModelSerializer):
    ol_results = EducationalQualificationSerializer(many=True, required=False, write_only=True)
    al_results = EducationalQualificationSerializer(many=True, required=False, write_only=True)
    center_name = serializers.CharField(source='center.name', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code_display = serializers.CharField(source='course.code', read_only=True)
    registration_components = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = [
            'id', 
            'registration_no', 
            'district_code', 
            'course_code', 
            'batch_year', 
            'student_number', 
            'registration_year',
            'registration_components',
            'full_name_english', 
            'full_name_sinhala', 
            'name_with_initials', 
            'gender', 
            'date_of_birth', 
            'nic_id',
            'address_line', 
            'district', 
            'divisional_secretariat', 
            'grama_niladhari_division', 
            'village', 
            'residence_type',
            'mobile_no', 
            'email', 
            'ol_results', 
            'al_results',
            'training_received', 
            'training_provider', 
            'course_vocation_name',
            'training_duration', 
            'training_nature', 
            'training_establishment',
            'training_placement_preference', 
            'date_of_application',
            'center', 
            'center_name', 
            'course', 
            'course_name', 
            'course_code_display',
            'enrollment_date', 
            'enrollment_status',
            'created_at', 
            'updated_at'
        ]
        read_only_fields = [
            'registration_no', 
            'district_code', 
            'course_code', 
            'batch_year', 
            'student_number', 
            'registration_year',
            'created_at', 
            'updated_at'
        ]
    
    def get_registration_components(self, obj):
        """Return registration number components as a dictionary"""
        if obj.registration_no:
            parts = obj.registration_no.split('/')
            if len(parts) == 5:
                return {
                    'district_code': parts[0],
                    'course_code': parts[1],
                    'batch_year': parts[2],
                    'student_number': parts[3],
                    'year': parts[4],
                    'format_explanation': f"{parts[0]} - District Code, {parts[1]} - Course Code, {parts[2]} - Batch Year, {parts[3]} - Student Number, {parts[4]} - Year"
                }
        return {}
    
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
            
            # Auto-assign center based on user's center if available
            if request.user.center and not data.get('center'):
                data['center'] = request.user.center
        
        # Validate center and course district matching
        center = data.get('center')
        course = data.get('course')
        district = data.get('district')
        
        if center and district and center.district != district:
            raise serializers.ValidationError({
                "center": "Selected center must be in the same district as the student."
            })
            
        if course and district and course.district != district:
            raise serializers.ValidationError({
                "course": "Selected course must be in the same district as the student."
            })
        
        # Validate required fields for registration number generation
        if not self.instance:  # Only on create
            required_fields = ['district']
            for field in required_fields:
                if not data.get(field):
                    raise serializers.ValidationError({
                        field: f"{field.replace('_', ' ').title()} is required to generate registration number."
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
        
        # Set created_by
        if request and request.user.is_authenticated:
            validated_data['created_by'] = request.user
        
        # Create student (registration number will be auto-generated in save() method)
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
        
        # Save (registration number will be regenerated if needed)
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

class RegistrationNumberPreviewSerializer(serializers.Serializer):
    """Serializer for registration number preview"""
    district = serializers.CharField(max_length=100)
    course_id = serializers.IntegerField(required=False, allow_null=True)
    enrollment_date = serializers.DateField(required=False, allow_null=True)
    
    def validate(self, data):
        # Validate that district exists
        district = data.get('district')
        if not DistrictCode.objects.filter(district_name__iexact=district).exists():
            # Don't raise error, just use fallback
            pass
        
        # Validate course if provided
        course_id = data.get('course_id')
        if course_id:
            try:
                Course.objects.get(id=course_id)
            except Course.DoesNotExist:
                raise serializers.ValidationError({
                    "course_id": "Invalid course ID."
                })
        
        return data