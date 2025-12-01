# students/permissions.py - CREATE THIS NEW FILE
from rest_framework import permissions

class StudentPermission(permissions.BasePermission):
    """
    Custom permission for Student objects
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # All authenticated users can view
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Only specific roles can create/edit/delete
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            return request.user.role in ['admin', 'district_manager', 'training_officer', 'data_entry']
        
        return False
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
            
        # Admin can do everything
        if request.user.role == 'admin':
            return True
            
        # District managers, training officers, and data entry can manage their district
        if request.user.role in ['district_manager', 'training_officer', 'data_entry']:
            # Allow if student is in user's district
            if hasattr(request.user, 'district'):
                return obj.district == request.user.district
            
        # Instructors can only view
        if request.user.role == 'instructor':
            return request.method in permissions.SAFE_METHODS
            
        return False