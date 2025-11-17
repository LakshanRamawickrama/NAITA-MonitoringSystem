from django.db import models


class Center(models.Model):
    name = models.CharField(max_length=255, unique=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    manager = models.CharField(max_length=255, blank=True, null=True)
    students = models.PositiveIntegerField(default=0, blank=True, null=True)
    instructors = models.PositiveIntegerField(default=0, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    status = models.CharField(max_length=20, default="Active")   # Active / Inactive
    performance = models.CharField(max_length=20, blank=True, null=True)  # Excellent / Good / …
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name