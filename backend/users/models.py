# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from centers.models import Center

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('district_manager', 'District Manager'),
        ('training_officer', 'Training Officer'),
        ('data_entry', 'Data Entry'),
        ('instructor', 'Instructor'),
    )

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='data_entry')
    center = models.ForeignKey(
        Center,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users'
    )
    district = models.CharField(max_length=100, blank=True, null=True)
    district = models.CharField(max_length=100, blank=True, null=True)
    epf_no = models.CharField(max_length=50, blank=True, null=True, verbose_name="EPF Number")
    phone_number = models.CharField(max_length=20, blank=True, null=True, verbose_name="Phone Number")

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email