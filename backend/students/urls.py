# students/urls.py - COMPLETE UPDATED VERSION
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'students', views.StudentViewSet)
router.register(r'district-codes', views.DistrictCodeViewSet, basename='districtcode')
router.register(r'course-codes', views.CourseCodeViewSet, basename='coursecode')
router.register(r'batches', views.BatchViewSet, basename='batch')
router.register(r'batch-years', views.BatchYearViewSet, basename='batchyear')

urlpatterns = [
    path('', include(router.urls)),
]