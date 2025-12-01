# students/views.py
from rest_framework import viewsets, status, generics
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
from datetime import datetime

from .models import Student, EducationalQualification, DistrictCode, CourseCode, BatchYear
from .serializers import (
    StudentSerializer, StudentImportSerializer, 
    DistrictCodeSerializer, CourseCodeSerializer, BatchYearSerializer,
    RegistrationNumberPreviewSerializer
)
from centers.models import Center
from courses.models import Course

class StudentPermission:
    """
    Custom permission class for student operations
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
        'name_with_initials', 'nic_id', 'district', 'email',
        'district_code', 'course_code', 'batch_year'
    ]
    filterset_fields = ['district', 'center', 'course', 'enrollment_status', 'training_received', 'district_code', 'course_code', 'batch_year']
    
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
                Q(course__name__icontains=search_term) |
                Q(district_code__icontains=search_term) |
                Q(course_code__icontains=search_term) |
                Q(batch_year__icontains=search_term)
            )
        
        return queryset.select_related('center', 'course', 'created_by')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        serializer.save()

    @action(detail=False, methods=['post'])
    def preview_registration(self, request):
        """Preview the registration number that would be generated"""
        serializer = RegistrationNumberPreviewSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        district = data.get('district')
        course_id = data.get('course_id')
        enrollment_date = data.get('enrollment_date')
        
        current_year = timezone.now().year
        
        # Get district code
        try:
            district_code_obj = DistrictCode.objects.filter(
                district_name__iexact=district
            ).first()
            if district_code_obj:
                district_code = district_code_obj.district_code
            else:
                district_code = district[:3].upper()
        except:
            district_code = district[:3].upper() if district else 'GEN'
        
        # Get course code
        course_code = "GEN"
        if course_id:
            try:
                course = Course.objects.get(id=course_id)
                course_code_obj = CourseCode.objects.filter(
                    course_name__icontains=course.name
                ).first()
                if course_code_obj:
                    course_code = course_code_obj.course_code
                elif course.code:
                    course_code = course.code[:3].upper()
            except Course.DoesNotExist:
                pass
        
        # Get batch year
        if enrollment_date:
            try:
                enrollment_date_obj = datetime.strptime(str(enrollment_date), '%Y-%m-%d').date()
                batch_year_full = enrollment_date_obj.year
            except:
                batch_year_full = current_year
        else:
            batch_year_full = current_year
        
        batch_year = str(batch_year_full)[-2:]
        
        # Get next student number
        students_in_batch = Student.objects.filter(
            district=district,
            course_id=course_id,
            batch_year=batch_year
        )
        
        student_number = students_in_batch.count() + 1
        
        # Generate preview
        full_registration = f"{district_code}/{course_code}/{batch_year}/{student_number:04d}/{current_year}"
        
        return Response({
            'district_code': district_code,
            'course_code': course_code,
            'batch_year': batch_year,
            'student_number': str(student_number).zfill(4),
            'year': str(current_year),
            'full_registration': full_registration,
            'explanation': {
                'district_code': f'Code for {district} district',
                'course_code': f'Code for the selected course' if course_id else 'General course code',
                'batch_year': f'Batch of {batch_year_full}',
                'student_number': f'Student #{student_number} in this batch',
                'year': f'Registration year: {current_year}'
            }
        })
    
    @action(detail=False, methods=['get'])
    def available_district_codes(self, request):
        """Get all available district codes"""
        district_codes = DistrictCode.objects.all()
        serializer = DistrictCodeSerializer(district_codes, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def available_course_codes(self, request):
        """Get all available course codes"""
        course_codes = CourseCode.objects.all()
        serializer = CourseCodeSerializer(course_codes, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def available_batch_years(self, request):
        """Get all available batch years"""
        batch_years = BatchYear.objects.filter(is_active=True)
        serializer = BatchYearSerializer(batch_years, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def registration_formats(self, request):
        """Get example registration number formats"""
        examples = [
            {
                'format': 'MT/WP/24/0010/2025',
                'explanation': 'Matara (MT) / Web Programming (WP) / 2024 Batch (24) / Student #10 (0010) / Registration Year 2025'
            },
            {
                'format': 'CO/GD/23/0045/2024',
                'explanation': 'Colombo (CO) / Graphic Design (GD) / 2023 Batch (23) / Student #45 (0045) / Registration Year 2024'
            },
            {
                'format': 'GA/DM/25/0001/2026',
                'explanation': 'Gampaha (GA) / Digital Marketing (DM) / 2025 Batch (25) / Student #1 (0001) / Registration Year 2026'
            }
        ]
        return Response({
            'format': 'District code/Course code/Batch year/Student number/Year',
            'examples': examples,
            'note': 'Registration numbers are auto-generated when left empty'
        })
    
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
        
        # Registration number stats
        registration_stats = {
            'by_district': {},
            'by_course': {},
            'by_batch': {}
        }
        
        for student in queryset:
            # District stats
            district = student.district_code or 'Unknown'
            registration_stats['by_district'][district] = registration_stats['by_district'].get(district, 0) + 1
            
            # Course stats
            course = student.course_code or 'GEN'
            registration_stats['by_course'][course] = registration_stats['by_course'].get(course, 0) + 1
            
            # Batch stats
            batch = student.batch_year or 'Unknown'
            registration_stats['by_batch'][batch] = registration_stats['by_batch'].get(batch, 0) + 1
        
        stats['registration_stats'] = registration_stats
        
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
                'Registration No', 'District Code', 'Course Code', 'Batch Year',
                'Student Number', 'Registration Year', 'Full Name (English)', 
                'Full Name (Sinhala)', 'Name with Initials', 'Gender', 'Date of Birth', 
                'NIC/ID', 'Address', 'District', 'Divisional Secretariat', 
                'Grama Niladhari Division', 'Village', 'Residence Type', 'Mobile No', 
                'Email', 'Training Received', 'Training Provider', 'Course/Vocation', 
                'Training Duration', 'Training Nature', 'Training Establishment', 
                'Placement Preference', 'Center', 'Course', 'Enrollment Date', 
                'Enrollment Status', 'Date of Application'
            ])
            
            for student in students:
                writer.writerow([
                    student.registration_no,
                    student.district_code,
                    student.course_code,
                    student.batch_year,
                    student.student_number,
                    student.registration_year,
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
            data = []
            for student in students:
                data.append({
                    'Registration No': student.registration_no,
                    'District Code': student.district_code,
                    'Course Code': student.course_code,
                    'Batch Year': student.batch_year,
                    'Student Number': student.student_number,
                    'Registration Year': student.registration_year,
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
            
            with pd.ExcelWriter(response, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Students')
            
            return response
        
        else:
            return Response(
                {'error': 'Unsupported format'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def import_students(self, request):
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

# NEW VIEWSETS FOR ADMIN MODELS
class DistrictCodeViewSet(viewsets.ModelViewSet):
    queryset = DistrictCode.objects.all()
    serializer_class = DistrictCodeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter]
    search_fields = ['district_name', 'district_code']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

class CourseCodeViewSet(viewsets.ModelViewSet):
    queryset = CourseCode.objects.all()
    serializer_class = CourseCodeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter]
    search_fields = ['course_name', 'course_code']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

class BatchYearViewSet(viewsets.ModelViewSet):
    queryset = BatchYear.objects.all()
    serializer_class = BatchYearSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter]
    search_fields = ['year_code', 'description']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]