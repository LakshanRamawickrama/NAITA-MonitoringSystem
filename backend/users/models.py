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
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    center = models.ForeignKey(Center, on_delete=models.SET_NULL, null=True, blank=True)

    USERNAME_FIELD = 'email'  # login with email
    REQUIRED_FIELDS = ['username']  # username still required
