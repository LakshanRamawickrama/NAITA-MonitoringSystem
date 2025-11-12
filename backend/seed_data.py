# seed_data.py
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'naita_backend.settings')
django.setup()

from users.models import User
from centers.models import Center
from courses.models import Course
from instructors.models import Instructor
from students.models import Student
from attendance.models import Attendance
from reports.models import Report

from datetime import date, timedelta
import random

# Clear old data
User.objects.all().delete()
Center.objects.all().delete()
Course.objects.all().delete()
Instructor.objects.all().delete()
Student.objects.all().delete()
Attendance.objects.all().delete()
Report.objects.all().delete()

# --- USERS ---
head_office = User.objects.create_user(username='headoffice', password='1234', role='admin', email='head@naita.lk')
manager = User.objects.create_user(username='manager1', password='1234', role='center_manager', email='manager@naita.lk')
instructor = User.objects.create_user(username='instructor1', password='1234', role='instructor', email='instructor@naita.lk')
data_entry = User.objects.create_user(username='data_entry1', password='1234', role='data_entry', email='data@naita.lk')

# --- CENTERS ---
centers = []
for i in range(1, 5):
    centers.append(Center.objects.create(name=f"Center {i}", location=f"District {i}", manager=manager))

# --- COURSES ---
courses = []
for i in range(1, 6):
    courses.append(Course.objects.create(
        name=f"Course {i}",
        code=f"CSE{i:03}",
        duration="6 Months",
        center=random.choice(centers),
    ))

# --- INSTRUCTORS ---
instructors = []
for i in range(1, 4):
    instructors.append(Instructor.objects.create(
        name=f"Instructor {i}",
        email=f"instructor{i}@mail.com",
        phone=f"07700000{i}",
        specialization="IT",
        center=random.choice(centers),
    ))

# --- STUDENTS ---
students = []
for i in range(1, 20):
    students.append(Student.objects.create(
        name=f"Student {i}",
        nic=f"2000{i:04}V",
        course=random.choice(courses),
        center=random.choice(centers),
    ))

# --- ATTENDANCE ---
for student in students:
    for d in range(5):
        Attendance.objects.create(
            student=student,
            date=date.today() - timedelta(days=d),
            status=random.choice(["present", "absent", "late"]),
        )

# --- REPORTS ---
for i in range(3):
    Report.objects.create(
        title=f"Monthly Report {i+1}",
        content="All centers performing well.",
        created_by=head_office,
    )

print("✅ Seed data successfully added!")
