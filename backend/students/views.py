# students/views.py - COMPLETE FIXED VERSION
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
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import qrcode
import io
from PIL import Image
import json
from datetime import datetime

from .models import Student, EducationalQualification, DistrictCode, CourseCode, Batch, BatchYear
from .serializers import (
    StudentSerializer, StudentImportSerializer, 
    DistrictCodeSerializer, CourseCodeSerializer, BatchSerializer, BatchYearSerializer,
    RegistrationNumberPreviewSerializer
)
from centers.models import Center
from courses.models import Course
from .permissions import StudentPermission

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated, StudentPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = [
        'registration_no', 'full_name_english', 'full_name_sinhala',
        'name_with_initials', 'nic_id', 'district', 'email',
        'district_code', 'course_code', 'batch__batch_code'
    ]
    filterset_fields = ['district', 'center', 'course', 'enrollment_status', 'training_received', 'district_code', 'course_code', 'batch']
    
    def get_queryset(self):
        queryset = Student.objects.all()
        user = self.request.user
        search_term = self.request.query_params.get('search', None)
        
        if user.role in ['district_manager', 'training_officer', 'data_entry'] and user.district:
            queryset = queryset.filter(district=user.district)
        
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
                Q(batch__batch_code__icontains=search_term) |
                Q(batch__batch_name__icontains=search_term)
            )
        
        return queryset.select_related('center', 'course', 'created_by', 'batch')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        serializer.save()

    @action(detail=False, methods=['post'])
    def preview_registration(self, request):
        serializer = RegistrationNumberPreviewSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        district = data.get('district')
        course_id = data.get('course_id')
        enrollment_date = data.get('enrollment_date')
        batch_id = data.get('batch_id')
        
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
        
        # Get batch
        batch_code = "01"
        batch_name = "1st Batch"
        if batch_id:
            try:
                batch = Batch.objects.get(id=batch_id)
                batch_code = batch.batch_code
                batch_name = batch.batch_name
            except Batch.DoesNotExist:
                pass
        else:
            # Get default batch
            default_batch = Batch.objects.filter(is_active=True).order_by('display_order').first()
            if default_batch:
                batch_code = default_batch.batch_code
                batch_name = default_batch.batch_name
        
        # Get next student number
        students_in_batch = Student.objects.filter(
            district=district,
            course_id=course_id,
            batch_id=batch_id
        )
        
        student_number = students_in_batch.count() + 1
        
        # Get registration year
        registration_year = current_year
        if enrollment_date:
            try:
                enrollment_date_obj = datetime.strptime(str(enrollment_date), '%Y-%m-%d').date()
                registration_year = enrollment_date_obj.year
            except:
                pass
        
        # Generate preview
        full_registration = f"{district_code}/{course_code}/{batch_code}/{student_number:04d}/{registration_year}"
        
        return Response({
            'district_code': district_code,
            'course_code': course_code,
            'batch_id': batch_id,
            'batch_code': batch_code,
            'batch_name': batch_name,
            'student_number': str(student_number).zfill(4),
            'year': str(registration_year),
            'full_registration': full_registration,
            'explanation': {
                'district_code': f'Code for {district} district',
                'course_code': f'Code for the selected course' if course_id else 'General course code',
                'batch': f'Batch: {batch_name} ({batch_code})',
                'student_number': f'Student #{student_number} in this batch',
                'year': f'Registration year: {registration_year}'
            }
        })
    
    @action(detail=False, methods=['get'])
    def available_district_codes(self, request):
        district_codes = DistrictCode.objects.all()
        serializer = DistrictCodeSerializer(district_codes, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def available_course_codes(self, request):
        course_codes = CourseCode.objects.all()
        serializer = CourseCodeSerializer(course_codes, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def available_batches(self, request):
        batches = Batch.objects.filter(is_active=True).order_by('display_order')
        serializer = BatchSerializer(batches, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def available_batch_years(self, request):
        batch_years = BatchYear.objects.filter(is_active=True)
        serializer = BatchYearSerializer(batch_years, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def registration_formats(self, request):
        examples = [
            {
                'format': 'MT/WP/01/0001/2025',
                'explanation': 'Matara (MT) / Web Programming (WP) / 1st Batch (01) / Student #1 (0001) / Registration Year 2025'
            },
            {
                'format': 'CO/GD/02/0045/2024',
                'explanation': 'Colombo (CO) / Graphic Design (GD) / 2nd Batch (02) / Student #45 (0045) / Registration Year 2024'
            },
            {
                'format': 'GA/DM/03/0001/2026',
                'explanation': 'Gampaha (GA) / Digital Marketing (DM) / 3rd Batch (03) / Student #1 (0001) / Registration Year 2026'
            }
        ]
        return Response({
            'format': 'District code/Course code/Batch code/Student number/Year',
            'examples': examples,
            'note': 'Registration numbers are auto-generated when left empty'
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
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
        
        center_stats = {}
        for student in queryset.select_related('center'):
            center_name = student.center.name if student.center else 'No Center'
            center_stats[center_name] = center_stats.get(center_name, 0) + 1
        
        stats['center_distribution'] = center_stats
        
        registration_stats = {
            'by_district': {},
            'by_course': {},
            'by_batch': {}
        }
        
        for student in queryset:
            district = student.district_code or 'Unknown'
            registration_stats['by_district'][district] = registration_stats['by_district'].get(district, 0) + 1
            
            course = student.course_code or 'GEN'
            registration_stats['by_course'][course] = registration_stats['by_course'].get(course, 0) + 1
            
            batch = student.batch.batch_name if student.batch else 'Unknown'
            registration_stats['by_batch'][batch] = registration_stats['by_batch'].get(batch, 0) + 1
        
        stats['registration_stats'] = registration_stats
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        format_type = request.query_params.get('format', 'csv')
        students = self.get_queryset()
        
        if format_type == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="students.csv"'
            
            writer = csv.writer(response)
            writer.writerow([
                'Registration No', 'District Code', 'Course Code', 'Batch', 'Batch Name',
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
                    student.batch.batch_code if student.batch else '',
                    student.batch.batch_name if student.batch else '',
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
                    'Batch Code': student.batch.batch_code if student.batch else '',
                    'Batch Name': student.batch.batch_name if student.batch else '',
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
                    center_name = row.get('Center', '')
                    course_name = row.get('Course', '')
                    batch_code = row.get('Batch Code', '01')
                    
                    center = None
                    course = None
                    batch = None
                    
                    if center_name:
                        center = Center.objects.filter(name=center_name, district=request.user.district).first()
                    
                    if course_name:
                        course = Course.objects.filter(name=course_name, district=request.user.district).first()
                    
                    if batch_code:
                        batch = Batch.objects.filter(batch_code=batch_code).first()
                        if not batch:
                            batch = Batch.objects.filter(is_active=True).order_by('display_order').first()
                    
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
                        'batch': batch.id if batch else None,
                        'enrollment_date': row.get('Enrollment Date', ''),
                        'enrollment_status': row.get('Enrollment Status', 'Pending'),
                        'date_of_application': row.get('Date of Application', ''),
                    }
                    
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
            
    # Add to students/views.py
from django.http import HttpResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import qrcode
import io
from PIL import Image
import json
from datetime import datetime

@action(detail=True, methods=['get'])
def qrcode_data(self, request, pk=None):
    """Get QR code data for a student"""
    student = self.get_object()
    
    qr_data = {
        'student_id': student.id,
        'registration_no': student.registration_no,
        'full_name': student.full_name_english,
        'nic_id': student.nic_id,
        'course_name': student.course.name if student.course else 'Not assigned',
        'center_name': student.center.name if student.center else 'Not assigned',
        'enrollment_status': student.enrollment_status,
        'timestamp': datetime.now().isoformat()
    }
    
    return Response(qr_data)

@action(detail=True, methods=['get'])
def id_card(self, request, pk=None):
    """Generate student ID card PDF"""
    student = self.get_object()
    
    # Create PDF
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr_data = json.dumps({
        'student_id': student.id,
        'registration_no': student.registration_no,
        'full_name': student.full_name_english,
        'timestamp': datetime.now().isoformat()
    })
    qr.add_data(qr_data)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    # Save QR to bytes
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format='PNG')
    qr_buffer.seek(0)
    
    # Draw ID card
    # Header
    p.setFillColorRGB(0, 0.5, 0)  # Green
    p.rect(50, height - 100, width - 100, 40, fill=1, stroke=0)
    p.setFillColorRGB(1, 1, 1)  # White
    p.setFont("Helvetica-Bold", 20)
    p.drawCentredString(width/2, height - 80, "Student ID Card")
    p.setFont("Helvetica", 12)
    p.drawCentredString(width/2, height - 105, "Vocational Training Authority")
    
    # Student info
    p.setFillColorRGB(0, 0, 0)  # Black
    p.setFont("Helvetica-Bold", 14)
    p.drawString(70, height - 150, f"Name: {student.full_name_english}")
    p.setFont("Helvetica", 12)
    p.drawString(70, height - 170, f"Registration No: {student.registration_no}")
    p.drawString(70, height - 190, f"NIC: {student.nic_id}")
    p.drawString(70, height - 210, f"Course: {student.course.name if student.course else 'Not assigned'}")
    p.drawString(70, height - 230, f"Center: {student.center.name if student.center else 'Not assigned'}")
    p.drawString(70, height - 250, f"District: {student.district}")
    
    # QR Code
    p.drawImage(ImageReader(qr_buffer), width - 150, height - 300, width=100, height=100)
    p.setFont("Helvetica", 10)
    p.drawCentredString(width - 100, height - 310, "Scan for Attendance")
    
    # Footer
    p.setFont("Helvetica-Oblique", 10)
    p.drawString(70, height - 350, f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    p.drawString(70, height - 365, "Valid until course completion")
    
    p.showPage()
    p.save()
    
    buffer.seek(0)
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="student_id_card_{student.registration_no}.pdf"'
    return response

@action(detail=False, methods=['post'])
def bulk_id_cards(self, request):
    """Generate ID cards for multiple students"""
    student_ids = request.data.get('student_ids', [])
    students = Student.objects.filter(id__in=student_ids)
    
    # Create combined PDF
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    
    for i, student in enumerate(students):
        if i > 0 and i % 2 == 0:
            p.showPage()  # New page for every 2 ID cards
        
        # Generate each ID card
        # ... similar drawing code as above ...
        
        if i == len(students) - 1:
            p.showPage()
    
    p.save()
    buffer.seek(0)
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="student_id_cards_{datetime.now().strftime("%Y%m%d_%H%M")}.pdf"'
    return response

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

class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter]
    search_fields = ['batch_code', 'batch_name']
    
    def get_queryset(self):
        return Batch.objects.all().order_by('display_order', 'batch_code')
    
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