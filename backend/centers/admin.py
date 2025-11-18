from django.contrib import admin
from .models import Center

@admin.register(Center)
class CenterAdmin(admin.ModelAdmin):
    list_display = ('name', 'district', 'location', 'manager', 'status', 'created_at')
    list_filter = ('district', 'status', 'performance')
    search_fields = ('name', 'location', 'district', 'manager')