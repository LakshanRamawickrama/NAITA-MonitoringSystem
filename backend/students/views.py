# students/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from django.db.models import Q
import pandas as pd
from django.http import HttpResponse
import csv
from django.utils import timezone

from .models import Student, EducationalQualification
from .serializers import StudentSerializer, StudentImportSerializer
from centers.models import Center
from courses.models import Course

class StudentPermission:
    """
    Custom permission class for student operations
    - Admin: Can manage all students
    - District Manager: Can manage students in their district
    - Training Officer: Can manage students in their district  
    - Data Entry: Can only manage students in their district (create/read/update)
    - Instructor: Read-only access to assigned students
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # All authenticated users can view students (with district restrictions)
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
            
        # Only specific roles can create/update/delete
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            return request.user.role in ['admin', 'district_manager', 'training_officer', 'data_entry']
        
        return False
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
            
        # Admin can do anything
        if request.user.role == 'admin':
            return True
            
        # District managers, training officers, and data entry can only manage their district students
        if request.user.role in ['district_manager', 'training_officer', 'data_entry']:
            return obj.district == request.user.district
            
        # Instructors can only view (handled in get_queryset)
        if request.user.role == 'instructor':
            return request.method in ['GET', 'HEAD', 'OPTIONS']
            
        return False

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated, StudentPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = [
        'registration_no', 'full_name_english', 'full_name_sinhala',
        'name_with_initials', 'nic_id', 'district', 'email'
    ]
    filterset_fields = ['district', 'center', 'course', 'enrollment_status', 'training_received']
    
    def get_queryset(self):
        queryset = Student.objects.all()
        user = self.request.user
        search_term = self.request.query_params.get('search', None)
        
        # Apply district restrictions based on user role
        if user.role in ['district_manager', 'training_officer', 'data_entry'] and user.district:
            queryset = queryset.filter(district=user.district)
        
        # Apply search filter
        if search_term:
            queryset = queryset.filter(
                Q(full_name_english__icontains=search_term) |
                Q(full_name_sinhala__icontains=search_term) |
                Q(name_with_initials__icontains=search_term) |
                Q(nic_id__icontains=search_term) |
                Q(registration_no__icontains=search_term) |
                Q(district__icontains=search_term) |
                Q(center__name__icontains=search_term) |
                Q(course__name__icontains=search_term)
            )
        
        return queryset.select_related('center', 'course')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        # Auto-set the creator
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get student statistics for dashboard"""
        user = request.user
        queryset = self.get_queryset()
        
        stats = {
            'total_students': queryset.count(),
            'trained_students': queryset.filter(training_received=True).count(),
            'enrolled_students': queryset.filter(enrollment_status='Enrolled').count(),
            'completed_students': queryset.filter(enrollment_status='Completed').count(),
            'pending_students': queryset.filter(enrollment_status='Pending').count(),
            'with_ol_results': queryset.filter(qualifications__type='OL').distinct().count(),
            'with_al_results': queryset.filter(qualifications__type='AL').distinct().count(),
            'recent_students': queryset.filter(created_at__gte=timezone.now() - timezone.timedelta(days=7)).count(),
        }
        
        # Center distribution
        center_stats = {}
        for student in queryset.select_related('center'):
            center_name = student.center.name if student.center else 'No Center'
            center_stats[center_name] = center_stats.get(center_name, 0) + 1
        
        stats['center_distribution'] = center_stats
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        format_type = request.query_params.get('format', 'csv')
        students = self.get_queryset()  # This already applies district filters
        
        if format_type == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="students.csv"'
            
            writer = csv.writer(response)
            writer.writerow([
                'Registration No', 'Full Name (English)', 'Full Name (Sinhala)',
                'Name with Initials', 'Gender', 'Date of Birth', 'NIC/ID',
                'Address', 'District', 'Divisional Secretariat', 'Grama Niladhari Division',
                'Village', 'Residence Type', 'Mobile No', 'Email', 'Training Received',
                'Training Provider', 'Course/Vocation', 'Training Duration',
                'Training Nature', 'Training Establishment', 'Placement Preference',
                'Center', 'Course', 'Enrollment Date', 'Enrollment Status',
                'Date of Application'
            ])
            
            for student in students:
                writer.writerow([
                    student.registration_no,
                    student.full_name_english,
                    student.full_name_sinhala,
                    student.name_with_initials,
                    student.gender,
                    student.date_of_birth,
                    student.nic_id,
                    student.address_line,
                    student.district,
                    student.divisional_secretariat,
                    student.grama_niladhari_division,
                    student.village,
                    student.residence_type,
                    student.mobile_no,
                    student.email,
                    'Yes' if student.training_received else 'No',
                    student.training_provider,
                    student.course_vocation_name,
                    student.training_duration,
                    student.training_nature,
                    student.training_establishment,
                    student.training_placement_preference,
                    student.center.name if student.center else '',
                    student.course.name if student.course else '',
                    student.enrollment_date,
                    student.enrollment_status,
                    student.date_of_application,
                ])
            
            return response
        
        elif format_type == 'excel':
            # Implement Excel export using pandas
            data = []
            for student in students:
                data.append({
                    'Registration No': student.registration_no,
                    'Full Name (English)': student.full_name_english,
                    'Full Name (Sinhala)': student.full_name_sinhala,
                    'Name with Initials': student.name_with_initials,
                    'Gender': student.gender,
                    'Date of Birth': student.date_of_birth,
                    'NIC/ID': student.nic_id,
                    'Address': student.address_line,
                    'District': student.district,
                    'Divisional Secretariat': student.divisional_secretariat,
                    'Grama Niladhari Division': student.grama_niladhari_division,
                    'Village': student.village,
                    'Residence Type': student.residence_type,
                    'Mobile No': student.mobile_no,
                    'Email': student.email,
                    'Training Received': 'Yes' if student.training_received else 'No',
                    'Training Provider': student.training_provider,
                    'Course/Vocation': student.course_vocation_name,
                    'Training Duration': student.training_duration,
                    'Training Nature': student.training_nature,
                    'Training Establishment': student.training_establishment,
                    'Placement Preference': student.training_placement_preference,
                    'Center': student.center.name if student.center else '',
                    'Course': student.course.name if student.course else '',
                    'Enrollment Date': student.enrollment_date,
                    'Enrollment Status': student.enrollment_status,
                    'Date of Application': student.date_of_application,
                })
            
            df = pd.DataFrame(data)
            response = HttpResponse(content_type='application/vnd.ms-excel')
            response['Content-Disposition'] = 'attachment; filename="students.xlsx"'
            df.to_excel(response, index=False)
            return response
        
        else:
            return Response(
                {'error': 'Unsupported format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def import_students(self, request):
        # Check permission for import
        if request.user.role not in ['admin', 'district_manager', 'training_officer', 'data_entry']:
            return Response(
                {'error': 'You do not have permission to import students'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = StudentImportSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['file']
        imported_count = 0
        errors = []
        
        try:
            if file.name.endswith('.csv'):
                df = pd.read_csv(file)
            elif file.name.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(file)
            else:
                return Response(
                    {'error': 'Unsupported file format'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            for index, row in df.iterrows():
                try:
                    # Get center and course objects
                    center_name = row.get('Center', '')
                    course_name = row.get('Course', '')
                    
                    center = None
                    course = None
                    
                    if center_name:
                        center = Center.objects.filter(name=center_name, district=request.user.district).first()
                    
                    if course_name:
                        course = Course.objects.filter(name=course_name, district=request.user.district).first()
                    
                    student_data = {
                        'full_name_english': row.get('Full Name (English)', ''),
                        'full_name_sinhala': row.get('Full Name (Sinhala)', ''),
                        'name_with_initials': row.get('Name with Initials', ''),
                        'gender': row.get('Gender', 'Male'),
                        'date_of_birth': row.get('Date of Birth', ''),
                        'nic_id': row.get('NIC/ID', ''),
                        'address_line': row.get('Address', ''),
                        'district': row.get('District', ''),
                        'divisional_secretariat': row.get('Divisional Secretariat', ''),
                        'grama_niladhari_division': row.get('Grama Niladhari Division', ''),
                        'village': row.get('Village', ''),
                        'residence_type': row.get('Residence Type', ''),
                        'mobile_no': row.get('Mobile No', ''),
                        'email': row.get('Email', ''),
                        'training_received': row.get('Training Received', 'No').lower() == 'yes',
                        'training_provider': row.get('Training Provider', ''),
                        'course_vocation_name': row.get('Course/Vocation', ''),
                        'training_duration': row.get('Training Duration', ''),
                        'training_nature': row.get('Training Nature', 'Initial'),
                        'training_establishment': row.get('Training Establishment', ''),
                        'training_placement_preference': row.get('Placement Preference', '1st'),
                        'center': center.id if center else None,
                        'course': course.id if course else None,
                        'enrollment_date': row.get('Enrollment Date', ''),
                        'enrollment_status': row.get('Enrollment Status', 'Pending'),
                        'date_of_application': row.get('Date of Application', ''),
                    }
                    
                    # For data entry officers, ensure district matches
                    if request.user.role == 'data_entry' and request.user.district:
                        student_data['district'] = request.user.district
                    
                    student_serializer = StudentSerializer(data=student_data, context={'request': request})
                    if student_serializer.is_valid():
                        student_serializer.save(created_by=request.user)
                        imported_count += 1
                    else:
                        errors.append(f"Row {index + 1}: {student_serializer.errors}")
                        
                except Exception as e:
                    errors.append(f"Row {index + 1}: {str(e)}")
            
            return Response({
                'message': f'Successfully imported {imported_count} students',
                'imported': imported_count,
                'errors': errors
            })
            
        except Exception as e:
            return Response(
                {'error': f'Error processing file: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # students/views.py - UPDATE THE STATS FUNCTION
@action(detail=False, methods=['get'])
def stats(self, request):
    """Get student statistics for dashboard"""
    user = request.user
    queryset = self.get_queryset()
    
    stats = {
        'total_students': queryset.count(),
        'trained_students': queryset.filter(training_received=True).count(),
        'enrolled_students': queryset.filter(enrollment_status='Enrolled').count(),
        'completed_students': queryset.filter(enrollment_status='Completed').count(),
        'pending_students': queryset.filter(enrollment_status='Pending').count(),
        'with_ol_results': queryset.filter(qualifications__type='OL').distinct().count(),
        'with_al_results': queryset.filter(qualifications__type='AL').distinct().count(),
        'recent_students': queryset.filter(created_at__gte=timezone.now() - timezone.timedelta(days=7)).count(),
    }
    
    # Center distribution - UPDATED related_name
    center_stats = {}
    for student in queryset.select_related('center'):
        center_name = student.center.name if student.center else 'No Center'
        center_stats[center_name] = center_stats.get(center_name, 0) + 1
    
    stats['center_distribution'] = center_stats
    
    return Response(stats)