# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from centers.models import Center

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('center_manager', 'Center Manager'),
        ('instructor', 'Instructor'),
        ('data_entry', 'Data Entry'),
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

    USERNAME_FIELD = 'email'           # Login with email
    REQUIRED_FIELDS = ['username']     # Still need username

    def __str__(self):
        return self.email