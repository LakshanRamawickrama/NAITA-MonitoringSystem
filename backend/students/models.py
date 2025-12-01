# students/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator
from django.utils import timezone

User = get_user_model()

# NEW MODELS
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

# EXISTING STUDENT MODEL WITH UPDATES
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
    registration_no = models.CharField(max_length=50, unique=True, blank=True, editable=False)
    district_code = models.CharField(max_length=10, blank=True, editable=False)
    course_code = models.CharField(max_length=10, blank=True, editable=False)
    batch_year = models.CharField(max_length=4, blank=True, editable=False)
    student_number = models.IntegerField(default=0, editable=False)
    registration_year = models.CharField(max_length=4, blank=True, editable=False)
    
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
            models.Index(fields=['batch_year']),
        ]
    
    def generate_registration_number(self):
        """Generate registration number in format: District code/Course code/batch year/student number/year"""
        current_year = timezone.now().year
        
        # Get district code
        try:
            district_code_obj = DistrictCode.objects.filter(
                district_name__iexact=self.district
            ).first()
            if district_code_obj:
                self.district_code = district_code_obj.district_code
            else:
                # Fallback: first 3 letters uppercase
                self.district_code = self.district[:3].upper()
        except:
            self.district_code = self.district[:3].upper() if self.district else 'GEN'
        
        # Get course code
        self.course_code = "GEN"  # Default
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
        
        # Get batch year
        if self.enrollment_date:
            batch_year_full = self.enrollment_date.year
        else:
            batch_year_full = current_year
        
        self.batch_year = str(batch_year_full)[-2:]  # Last 2 digits
        
        # Get student number (sequential in district-course-batch)
        students_in_batch = Student.objects.filter(
            district=self.district,
            course=self.course,
            batch_year=self.batch_year
        ).exclude(id=self.id)  # Exclude current student
        
        self.student_number = students_in_batch.count() + 1
        
        # Get registration year
        self.registration_year = str(current_year)
        
        # Format: MT/WP/24/0010/2025
        return f"{self.district_code}/{self.course_code}/{self.batch_year}/{self.student_number:04d}/{self.registration_year}"
    
    def save(self, *args, **kwargs):
        # Only generate registration number if it doesn't exist
        if not self.registration_no:
            self.registration_no = self.generate_registration_number()
        
        # Ensure student_number is saved even if we're not generating a new registration
        if not self.student_number:
            # Get the highest student number for this district-course-batch
            max_student = Student.objects.filter(
                district=self.district,
                course=self.course,
                batch_year=self.batch_year
            ).exclude(id=self.id).order_by('-student_number').first()
            
            if max_student:
                self.student_number = max_student.student_number + 1
            else:
                self.student_number = 1
        
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