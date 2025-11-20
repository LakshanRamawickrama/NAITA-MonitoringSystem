# students/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator

User = get_user_model()

class Student(models.Model):
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]
    
    TRAINING_NATURE_CHOICES = [
        ('Initial', 'Initial'),
        ('Further', 'Further'),
        ('Re-training', 'Re-training'),
    ]
    
    PLACEMENT_PREFERENCE_CHOICES = [
        ('1st', '1st Preference'),
        ('2nd', '2nd Preference'),
        ('3rd', '3rd Preference'),
    ]

    # Personal Information
    registration_no = models.CharField(max_length=20, unique=True, blank=True)
    full_name_english = models.CharField(max_length=200)
    full_name_sinhala = models.CharField(max_length=200, blank=True)
    name_with_initials = models.CharField(max_length=100)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    date_of_birth = models.DateField()
    nic_id = models.CharField(max_length=20, unique=True)
    
    # Address Information
    address_line = models.TextField(blank=True)
    district = models.CharField(max_length=100)
    divisional_secretariat = models.CharField(max_length=100)
    grama_niladhari_division = models.CharField(max_length=100)
    village = models.CharField(max_length=100)
    residence_type = models.CharField(max_length=50, blank=True)
    
    # Contact Information
    mobile_no = models.CharField(
        max_length=15,
        validators=[RegexValidator(regex=r'^\+?1?\d{9,15}$')]
    )
    email = models.EmailField(blank=True)
    
    # Training Details
    training_received = models.BooleanField(default=False)
    training_provider = models.CharField(max_length=200, blank=True)
    course_vocation_name = models.CharField(max_length=200, blank=True)
    training_duration = models.CharField(max_length=100, blank=True)
    training_nature = models.CharField(max_length=20, choices=TRAINING_NATURE_CHOICES, default='Initial')
    training_establishment = models.CharField(max_length=200, blank=True)
    training_placement_preference = models.CharField(max_length=3, choices=PLACEMENT_PREFERENCE_CHOICES, default='1st')
    date_of_application = models.DateField(auto_now_add=True)
    
    # System fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_students')
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['registration_no']),
            models.Index(fields=['nic_id']),
            models.Index(fields=['district']),
            models.Index(fields=['created_at']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.registration_no:
            # Auto-generate registration number
            last_student = Student.objects.order_by('-id').first()
            last_id = last_student.id if last_student else 0
            self.registration_no = f"REG{last_id + 1:06d}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.registration_no} - {self.full_name_english}"

class EducationalQualification(models.Model):
    QUALIFICATION_TYPE_CHOICES = [
        ('OL', 'G.C.E. O/L'),
        ('AL', 'G.C.E. A/L'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='qualifications')
    subject = models.CharField(max_length=100)
    grade = models.CharField(max_length=10)
    year = models.IntegerField()
    type = models.CharField(max_length=2, choices=QUALIFICATION_TYPE_CHOICES)
    
    class Meta:
        ordering = ['type', 'year', 'subject']
    
    def __str__(self):
        return f"{self.student.name_with_initials} - {self.subject} ({self.grade})"