# naita_backend/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path('', include('users.urls')),
    path('', include('courses.urls')),
    path("api/", include("users.urls")),
    path('api/', include('students.urls')),    
    path('api/', include('overview.urls')),
    path('api/auth/', include('users.urls')),       
    path("api/centers/", include("centers.urls")),   
    path('api/reports/', include('reports.urls')),
    path('api/approvals/', include('approvals.urls')),
    path('api/courses/', include('courses.urls')),
    path('api/overview/', include('overview.urls')),
    path('api/attendance/', include('attendance.urls')),
    path('api/instructors/', include('instructors.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)