# naita_backend/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path('', include('users.urls')),
    path("api/", include("users.urls")),      
    path("api/centers/", include("centers.urls")),   
    path('api/reports/', include('reports.urls')),
    path('api/approvals/', include('approvals.urls')),
    path('', include('courses.urls')),
    path('api/courses/', include('courses.urls')),
    
]