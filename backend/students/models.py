# students/models.py - COMPLETE FIXED VERSION
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator
from django.utils import timezone

User = get_user_model()

class DistrictCode(models.Model):
    """Model to store district codes for registration numbers"""
    district_name = models.CharField(max_length=100, unique=True)
    district_code = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "District Code"
        verbose_name_plural = "District Codes"
        ordering = ['district_name']
    
    def __str__(self):
        return f"{self.district_code} - {self.district_name}"

class CourseCode(models.Model):
    """Model to store course codes for registration numbers"""
    course_name = models.CharField(max_length=200)
    course_code = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Course Code"
        verbose_name_plural = "Course Codes"
        ordering = ['course_code']
    
    def __str__(self):
        return f"{self.course_code} - {self.course_name}"

class Batch(models.Model):
    """Model to define batches for registration numbers"""
    batch_code = models.CharField(max_length=2, unique=True, help_text="Batch code in 2-digit format (e.g., 01 for 1st batch)")
    batch_name = models.CharField(max_length=50, help_text="e.g., 1st Batch, 2nd Batch, etc.")
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=1, help_text="Order in which batches appear in dropdowns")
    
    class Meta:
        verbose_name = "Batch"
        verbose_name_plural = "Batches"
        ordering = ['display_order', 'batch_code']
    
    def __str__(self):
        return f"{self.batch_code} - {self.batch_name}"
    
    def save(self, *args, **kwargs):
        # Ensure batch_code is 2 digits with leading zero
        if self.batch_code and len(self.batch_code) == 1:
            self.batch_code = f"0{self.batch_code}"
        super().save(*args, **kwargs)

class BatchYear(models.Model):
    """Model to define batch years for registration numbers"""
    year_code = models.CharField(max_length=4, unique=True, help_text="Year in YY format (e.g., 24 for 2024)")
    description = models.CharField(max_length=100, help_text="e.g., 2024 Batch")
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Batch Year"
        verbose_name_plural = "Batch Years"
        ordering = ['-year_code']
    
    def __str__(self):
        return f"{self.year_code} - {self.description}"

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
    
    ENROLLMENT_STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Enrolled', 'Enrolled'),
        ('Completed', 'Completed'),
        ('Dropped', 'Dropped'),
    ]

    # Registration Information
    registration_no = models.CharField(max_length=50, unique=True, blank=True)
    district_code = models.CharField(max_length=10, blank=True)
    course_code = models.CharField(max_length=10, blank=True)
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    batch_year = models.CharField(max_length=4, blank=True)
    student_number = models.IntegerField(default=0)
    registration_year = models.CharField(max_length=4, blank=True)
    
    # Personal Information
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
    marital_status = models.CharField(max_length=20, choices=[
        ('Single', 'Single'),
        ('Married', 'Married'),
        ('Divorced', 'Divorced'),
        ('Widowed', 'Widowed')
    ], blank=True)
    
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
    
    # Profile Photo 
    profile_photo = models.ImageField(
        upload_to='student_photos/',
        null=True,
        blank=True,
        help_text='Student profile photo'
    )
    
    # Center and Course Information
    center = models.ForeignKey(
        'centers.Center', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='enrolled_students'
    )
    
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='enrolled_students'
    )
    
    enrollment_date = models.DateField(null=True, blank=True)
    enrollment_status = models.CharField(
        max_length=20,
        choices=ENROLLMENT_STATUS_CHOICES,
        default='Pending'
    )
    
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
            models.Index(fields=['center']),
            models.Index(fields=['course']),
            models.Index(fields=['district_code']),
            models.Index(fields=['course_code']),
            models.Index(fields=['batch']),
        ]
    
    def generate_registration_number(self, use_existing_components=False):
        """Generate registration number in format: District code/Course code/batch code/student number/year"""
        
        if use_existing_components and all([
            self.district_code,
            self.course_code,
            self.batch,
            self.student_number,
            self.registration_year
        ]):
            batch_code = self.batch.batch_code if self.batch else "01"
            return f"{self.district_code}/{self.course_code}/{batch_code}/{self.student_number:04d}/{self.registration_year}"
        
        current_year = timezone.now().year
        
        # Get district code
        if not self.district_code:
            try:
                district_code_obj = DistrictCode.objects.filter(
                    district_name__iexact=self.district
                ).first()
                if district_code_obj:
                    self.district_code = district_code_obj.district_code
                else:
                    self.district_code = self.district[:3].upper() if self.district else 'GEN'
            except:
                self.district_code = self.district[:3].upper() if self.district else 'GEN'
        
        # Get course code
        if not self.course_code:
            self.course_code = "GEN"
            if self.course:
                try:
                    course_code_obj = CourseCode.objects.filter(
                        course_name__icontains=self.course.name
                    ).first()
                    if course_code_obj:
                        self.course_code = course_code_obj.course_code
                    elif self.course.code:
                        self.course_code = self.course.code[:3].upper()
                except:
                    if self.course.code:
                        self.course_code = self.course.code[:3].upper()
        
        # Get batch
        if not self.batch:
            default_batch = Batch.objects.filter(is_active=True).order_by('display_order').first()
            if default_batch:
                self.batch = default_batch
            else:
                default_batch, created = Batch.objects.get_or_create(
                    batch_code='01',
                    defaults={
                        'batch_name': '1st Batch',
                        'description': 'Default 1st Batch',
                        'is_active': True,
                        'display_order': 1
                    }
                )
                self.batch = default_batch
        
        # Get student number
        if not self.student_number or self.student_number == 0:
            students_in_batch = Student.objects.filter(
                district=self.district,
                course=self.course,
                batch=self.batch
            ).exclude(id=self.id)
            
            self.student_number = students_in_batch.count() + 1
        
        # Get registration year
        if not self.registration_year:
            if self.enrollment_date:
                self.registration_year = str(self.enrollment_date.year)
            else:
                self.registration_year = str(current_year)
        
        batch_code = self.batch.batch_code if self.batch else "01"
        return f"{self.district_code}/{self.course_code}/{batch_code}/{self.student_number:04d}/{self.registration_year}"
    
    def save(self, *args, **kwargs):
        manual_components = all([
            self.district_code,
            self.course_code,
            self.batch,
            self.student_number,
            self.registration_year
        ])
        
        if not self.registration_no or not manual_components:
            self.registration_no = self.generate_registration_number(use_existing_components=manual_components)
        elif manual_components and self.registration_no:
            batch_code = self.batch.batch_code if self.batch else "01"
            expected_format = f"{self.district_code}/{self.course_code}/{batch_code}/{self.student_number:04d}/{self.registration_year}"
            if self.registration_no != expected_format:
                self.registration_no = expected_format
        
        if self.batch:
            self.batch_year = self.batch.batch_code
        
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