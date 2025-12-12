import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, Edit, Trash2, User, Clock, Save, X, Eye,
  MapPin, Building, ChevronDown, ChevronUp, Info, RefreshCw,
  Phone, BookOpen, Upload, Camera, QrCode, IdCard, Printer,
} from 'lucide-react';
import {
  type StudentType,
  type EducationalQualificationType,
  type Center,
  type CourseType,
  type RegistrationNumberPreview,
  type BatchType,
  fetchStudents,
  deleteStudent,
  fetchCentersForStudent,
  fetchCoursesForStudent,
  getUserDistrict,
  getUserRole,
  previewRegistrationNumber,
  fetchRegistrationFormats,
  fetchAvailableDistrictCodes,
  fetchAvailableCourseCodes,
  fetchAvailableBatches,

} from '../../api/api';
import api from '../../api/api';

// Import Student ID Card Component
import StudentIDCard from '../../components/StudentIDCard';

// Import Bulk ID Card Generator Component
import BulkIDCardGenerator from '../../components/BulkIDCardGenerator';

// Mobile Student Card Component
interface MobileStudentCardProps {
  student: StudentType;
  onViewDetails: (student: StudentType) => void;
  onEdit: (student: StudentType) => void;
  onDelete: (id: number) => void;
  onShowIDCard: (student: StudentType) => void;

}

const MobileStudentCard: React.FC<MobileStudentCardProps> = ({
  student,
  onViewDetails,
  onEdit,
  onDelete,
  onShowIDCard,

}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper to safely parse qualifications
  const parseQualifications = (data: any): EducationalQualificationType[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    try {
      if (typeof data === 'string') {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error('Error parsing qualifications:', e);
      return [];
    }
    return [];
  };

  const olResults = parseQualifications(student.ol_results);
  const alResults = parseQualifications(student.al_results);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          {/* Selection Checkbox */}


          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${student.profile_photo_url ? '' : 'bg-gradient-to-br from-green-100 to-blue-100'
            }`}>
            {student.profile_photo_url ? (
              <img
                src={student.profile_photo_url}
                alt={student.full_name_english}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-green-100', 'to-blue-100');
                }}
              />
            ) : (
              <User className="w-6 h-6 text-green-600" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 text-sm break-words">{student.full_name_english}</h3>
            <p className="text-green-600 font-bold text-xs mt-1 break-words">{student.registration_no}</p>
            <p className="text-gray-500 text-xs">NIC: {student.nic_id}</p>
            <div className="flex items-center mt-1">
              <MapPin className="w-3 h-3 text-gray-400 mr-1" />
              <span className="text-gray-500 text-xs">{student.district}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-2 p-1 text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${student.enrollment_status === 'Enrolled' ? 'bg-green-100 text-green-800 border border-green-200' :
          student.enrollment_status === 'Completed' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
            student.enrollment_status === 'Dropped' ? 'bg-red-100 text-red-800 border border-red-200' :
              'bg-yellow-100 text-yellow-800 border border-yellow-200'
          }`}>
          {student.enrollment_status || 'Pending'}
        </span>
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${student.training_received
          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200'
          : 'bg-gray-100 text-gray-800 border border-gray-200'
          }`}>
          {student.training_received ? 'Trained' : 'Not Trained'}
        </span>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-2 border border-blue-100">
            <div className="text-xs font-semibold text-gray-700 mb-1">Registration Details:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center">
                <div className="font-bold text-gray-900">{student.district_code || 'N/A'}</div>
                <div className="text-gray-600">District Code</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900">{student.course_code || 'N/A'}</div>
                <div className="text-gray-600">Course Code</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900">{student.batch_display || student.batch_code || 'N/A'}</div>
                <div className="text-gray-600">Batch</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900">{student.student_number || 'N/A'}</div>
                <div className="text-gray-600">Student #</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600 flex items-center">
                <Phone className="w-3 h-3 mr-1" /> Mobile:
              </span>
              <span className="font-medium">{student.mobile_no}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600 flex items-center">
                <Building className="w-3 h-3 mr-1" /> Center:
              </span>
              <span className="font-medium text-right">{student.center_name || 'No Center'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600 flex items-center">
                <BookOpen className="w-3 h-3 mr-1" /> Course:
              </span>
              <span className="font-medium text-right">{student.course_name || 'No Course'}</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-2 border border-gray-100">
            <div className="text-xs font-semibold text-gray-700 mb-1">Education:</div>
            <div className="space-y-2">
              <div>
                <div className="text-[10px] font-semibold text-gray-600 mb-0.5">O/L Results ({olResults.length}):</div>
                {olResults.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {olResults.map((res, i) => (
                      <span key={i} className="inline-block px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] text-gray-800">
                        {res.subject}: {res.grade}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] text-gray-400 italic">No results</div>
                )}
              </div>
              <div>
                <div className="text-[10px] font-semibold text-gray-600 mb-0.5">A/L Results ({alResults.length}):</div>
                {alResults.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {alResults.map((res, i) => (
                      <span key={i} className="inline-block px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] text-gray-800">
                        {res.subject}: {res.grade}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] text-gray-400 italic">No results</div>
                )}
              </div>
            </div>
          </div>

          {/* QR Code and ID Card Actions */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-2 border border-purple-100">
            <div className="text-xs font-semibold text-purple-700 mb-2">Quick Actions:</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onShowIDCard(student)}
                className="flex items-center justify-center space-x-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-2 px-3 rounded-lg text-xs font-medium hover:from-purple-600 hover:to-purple-700 transition-all"
              >
                <IdCard className="w-3 h-3" />
                <span>ID Card</span>
              </button>
              <button
                onClick={() => {
                  // Generate QR code data
                  const qrData = {
                    student_id: student.id,
                    registration_no: student.registration_no,
                    full_name: student.full_name_english,
                    nic_id: student.nic_id,
                    course_name: student.course_name || 'Not assigned',
                    center_name: student.center_name || 'Not assigned',
                    enrollment_status: student.enrollment_status || 'Pending'
                  };

                  // Create downloadable QR code JSON
                  const qrString = JSON.stringify(qrData, null, 2);
                  const blob = new Blob([qrString], { type: 'application/json' });
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `qr_${student.registration_no}.json`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                }}
                className="flex items-center justify-center space-x-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-3 rounded-lg text-xs font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
              >
                <QrCode className="w-3 h-3" />
                <span>QR Code</span>
              </button>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => onViewDetails(student)}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-3 rounded-lg text-xs font-medium hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center space-x-1 shadow-sm hover:shadow"
            >
              <Eye className="w-3 h-3" />
              <span>Details</span>
            </button>
            <button
              onClick={() => onEdit(student)}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-3 rounded-lg text-xs font-medium hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center space-x-1 shadow-sm hover:shadow"
            >
              <Edit className="w-3 h-3" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => student.id && onDelete(student.id)}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-3 rounded-lg text-xs font-medium hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center space-x-1 shadow-sm hover:shadow"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const DataEntryStudents: React.FC = () => {
  const [students, setStudents] = useState<StudentType[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null);
  const [editingStudent, setEditingStudent] = useState<StudentType | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [userDistrict, setUserDistrict] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [registrationPreview, setRegistrationPreview] = useState<RegistrationNumberPreview | null>(null);
  const [registrationFormats, setRegistrationFormats] = useState<any>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isAutoGenerateRegNo, setIsAutoGenerateRegNo] = useState(true);
  const [manualRegNo, setManualRegNo] = useState(false);
  const [districtCodes, setDistrictCodes] = useState<any[]>([]);
  const [courseCodes, setCourseCodes] = useState<any[]>([]);
  const [batches, setBatches] = useState<BatchType[]>([]);

  // Profile photo states
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);

  // QR Code and ID Card states
  const [showIDCard, setShowIDCard] = useState(false);
  const [selectedIDCardStudent, setSelectedIDCardStudent] = useState<StudentType | null>(null);
  const [showBulkIDCardGenerator, setShowBulkIDCardGenerator] = useState(false);



  const [regComponents, setRegComponents] = useState({
    district_code: '',
    course_code: '',
    batch_year: '',
    student_number: '',
    registration_year: new Date().getFullYear().toString()
  });

  const [formData, setFormData] = useState<Partial<StudentType>>({
    full_name_english: '',
    full_name_sinhala: '',
    name_with_initials: '',
    gender: 'Male',
    date_of_birth: '',
    nic_id: '',
    address_line: '',
    district: '',
    divisional_secretariat: '',
    grama_niladhari_division: '',
    village: '',
    marital_status: 'Single',
    mobile_no: '',
    email: '',
    ol_results: [],
    al_results: [],
    training_received: false,
    training_provider: '',
    course_vocation_name: '',
    training_duration: '',
    training_nature: 'Initial',
    training_establishment: '',
    training_placement_preference: '1st',
    center: null,
    course: null,
    batch: null,
    enrollment_date: new Date().toISOString().split('T')[0],
    enrollment_status: 'Pending',
    registration_no: '',
    district_code: '',
    course_code: '',
    student_number: 0,
    registration_year: new Date().getFullYear().toString(),
    date_of_application: new Date().toISOString().split('T')[0],
    // Note: profile_photo is NOT included here, handled separately
  });

  const [newOlSubject, setNewOlSubject] = useState('');
  const [newOlGrade, setNewOlGrade] = useState('');
  const [newOlYear, setNewOlYear] = useState('');
  const [newAlSubject, setNewAlSubject] = useState('');
  const [newAlGrade, setNewAlGrade] = useState('');
  const [newAlYear, setNewAlYear] = useState('');

  useEffect(() => {
    const loadUserInfo = async () => {
      const district = getUserDistrict();
      const role = getUserRole();

      setUserDistrict(district);
      setUserRole(role);

      if (role === 'data_entry' && district) {
        setFormData(prev => ({
          ...prev,
          district: district
        }));
      }

      try {
        const formats = await fetchRegistrationFormats();
        setRegistrationFormats(formats);
      } catch (error) {
        console.error('Error loading registration formats:', error);
      }

      try {
        const [districtCodesRes, courseCodesRes, batchesRes] = await Promise.all([
          fetchAvailableDistrictCodes(),
          fetchAvailableCourseCodes(),
          fetchAvailableBatches()
        ]);

        setDistrictCodes(districtCodesRes);
        setCourseCodes(courseCodesRes);
        setBatches(batchesRes);

        // Set default batch (first active batch)
        if (batchesRes.length > 0) {
          const defaultBatch = batchesRes[0];
          setFormData(prev => ({
            ...prev,
            batch: defaultBatch.id
          }));
        }
      } catch (error) {
        console.error('Error loading registration codes:', error);
      }
    };

    loadUserInfo();
    loadStudents();
    loadCenters();
  }, []);

  const generateRegistrationPreview = async (overrides?: Partial<StudentType>) => {
    const data = { ...formData, ...overrides };

    if (!data.district) {
      setRegistrationPreview(null);
      return;
    }

    try {
      setIsGeneratingPreview(true);
      const preview = await previewRegistrationNumber({
        district: data.district,
        course_id: data.course || undefined,
        enrollment_date: data.enrollment_date || undefined,
        batch_id: data.batch || undefined
      });
      setRegistrationPreview(preview);

      if (isAutoGenerateRegNo && !manualRegNo) {
        setFormData(prev => ({
          ...prev,
          registration_no: preview.full_registration,
          district_code: preview.district_code,
          course_code: preview.course_code,
          batch: preview.batch_id,
          student_number: parseInt(preview.student_number),
          registration_year: preview.year
        }));
      }
    } catch (error) {
      console.error('Error generating registration preview:', error);
      setRegistrationPreview(null);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  useEffect(() => {
    if ((formData.district || formData.course || formData.enrollment_date || formData.batch) && isAutoGenerateRegNo && !manualRegNo) {
      const timer = setTimeout(() => {
        generateRegistrationPreview();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [formData.district, formData.course, formData.enrollment_date, formData.batch, isAutoGenerateRegNo, manualRegNo]);

  const handleRegComponentChange = (field: string, value: string) => {
    setRegComponents(prev => ({
      ...prev,
      [field]: value
    }));

    setFormData(prev => {
      const updated = { ...prev };

      switch (field) {
        case 'district_code':
          updated.district_code = value;
          break;
        case 'course_code':
          updated.course_code = value;
          break;
        case 'batch_year':
          updated.batch_year = value;
          // Find batch by code
          const batch = batches.find(b => b.batch_code === value);
          if (batch) {
            updated.batch = batch.id;
          }
          break;
        case 'student_number':
          updated.student_number = parseInt(value) || 0;
          break;
        case 'registration_year':
          updated.registration_year = value;
          break;
      }

      if (updated.district_code && updated.course_code && updated.batch_year &&
        updated.student_number && updated.registration_year) {
        const studentNumStr = updated.student_number.toString().padStart(4, '0');
        updated.registration_no = `${updated.district_code}/${updated.course_code}/${updated.batch_year}/${studentNumStr}/${updated.registration_year}`;
      }

      return updated;
    });
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await fetchStudents(searchTerm);
      setStudents(data);

    } catch (error) {
      console.error('Error fetching students:', error);
      alert('Error loading students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadCenters = async () => {
    try {
      setLoadingCenters(true);
      const data = await fetchCentersForStudent();
      setCenters(data);
    } catch (error) {
      console.error('Error fetching centers:', error);
    } finally {
      setLoadingCenters(false);
    }
  };

  const loadCourses = async (centerId: number) => {
    try {
      setLoadingCourses(true);
      const data = await fetchCoursesForStudent(centerId);
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [searchTerm]);

  const handleCenterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const centerId = e.target.value ? parseInt(e.target.value) : null;
    setFormData({
      ...formData,
      center: centerId,
      course: null // Reset course when center changes
    });
    if (centerId) {
      loadCourses(centerId);
    } else {
      setCourses([]);
    }
  };

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const courseId = e.target.value ? parseInt(e.target.value) : null;
    setFormData({
      ...formData,
      course: courseId
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create FormData for file upload
      const formDataObj = new FormData();

      // Prepare form data for submission
      const submissionData = { ...formData };

      // Ensure center and course are just IDs (not objects)
      if (submissionData.center && typeof submissionData.center === 'object') {
        submissionData.center = (submissionData.center as any).id || submissionData.center;
      }

      if (submissionData.course && typeof submissionData.course === 'object') {
        submissionData.course = (submissionData.course as any).id || submissionData.course;
      }

      // Ensure batch is just ID
      if (submissionData.batch && typeof submissionData.batch === 'object') {
        submissionData.batch = (submissionData.batch as any).id || submissionData.batch;
      }

      // Append all form data
      Object.entries(submissionData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          // Skip empty strings for optional fields
          if (value === '' && key !== 'registration_no') {
            return;
          }

          if (Array.isArray(value)) {
            formDataObj.append(key, JSON.stringify(value));
          } else if (typeof value === 'boolean') {
            formDataObj.append(key, value.toString());
          } else if (value && typeof value === 'object') {
            // Check if it's a File or Blob object
            const objValue = value as any;
            if (objValue instanceof File || objValue instanceof Blob ||
              (objValue.constructor && objValue.constructor.name === 'File') ||
              (objValue.constructor && objValue.constructor.name === 'Blob')) {
              formDataObj.append(key, objValue);
            } else {
              formDataObj.append(key, JSON.stringify(value));
            }
          } else {
            formDataObj.append(key, value.toString());
          }
        }
      });

      // Append profile photo only if a new one was uploaded
      if (profilePhoto) {
        formDataObj.append('profile_photo', profilePhoto);
      }
      // If editing without changing photo, don't send anything

      let updatedStudent;

      if (editingStudent && editingStudent.id) {
        const response = await api.patch(`/api/students/${editingStudent.id}/`, formDataObj, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        updatedStudent = response.data;
      } else {
        const response = await api.post('/api/students/', formDataObj, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        updatedStudent = response.data;
      }

      if (editingStudent && editingStudent.id) {
        setStudents(students.map(student =>
          student.id === editingStudent.id ? updatedStudent : student
        ));
      } else {
        setStudents([...students, updatedStudent]);
      }

      resetForm();
      setShowForm(false);
      setEditingStudent(null);
    } catch (error: any) {
      console.error('Error saving student:', error);
      const errorMessage = error.response?.data?.detail ||
        error.response?.data?.message ||
        (typeof error.response?.data === 'object' ? JSON.stringify(error.response.data) : 'Error saving student. Please try again.');
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;

    try {
      await deleteStudent(id);
      setStudents(students.filter(student => student.id !== id));

    } catch (error: any) {
      console.error('Error deleting student:', error);
      alert(error.response?.data?.detail || 'Error deleting student. Please try again.');
    }
  };

  const handleEdit = (student: StudentType) => {
    setFormData({
      ...student,
      ol_results: student.ol_results || [],
      al_results: student.al_results || [],
      batch: student.batch || null,
      // Handle center - extract just the ID if it's an object
      center: typeof student.center === 'object' && student.center !== null
        ? (student.center as any).id || student.center
        : student.center,
      // Handle course - extract just the ID if it's an object
      course: typeof student.course === 'object' && student.course !== null
        ? (student.course as any).id || student.course
        : student.course,
      // Don't include profile_photo in formData state
    });

    // Set profile photo preview if exists
    if (student.profile_photo_url) {
      setProfilePhotoPreview(student.profile_photo_url);
    } else {
      setProfilePhotoPreview(null);
    }

    if (student.registration_no) {
      const parts = student.registration_no.split('/');
      if (parts.length === 5) {
        setRegComponents({
          district_code: parts[0],
          course_code: parts[1],
          batch_year: parts[2] || '',
          student_number: parts[3],
          registration_year: parts[4]
        });
      }
    }

    setEditingStudent(student);
    setShowForm(true);
    setIsAutoGenerateRegNo(false);
    setManualRegNo(true);

    // Load courses if center is set
    if (student.center) {
      const centerId = typeof student.center === 'object' && student.center !== null
        ? (student.center as any).id || student.center
        : student.center;
      if (centerId) {
        loadCourses(Number(centerId));
      }
    }
  };

  const handleViewDetails = (student: StudentType) => {
    setSelectedStudent(student);
    setShowDetails(true);
  };

  const handleShowIDCard = (student: StudentType) => {
    setSelectedIDCardStudent(student);
    setShowIDCard(true);
  };

  const resetForm = () => {
    const defaultBatch = batches.length > 0 ? batches[0].id : null;

    setFormData({
      full_name_english: '',
      full_name_sinhala: '',
      name_with_initials: '',
      gender: 'Male',
      date_of_birth: '',
      nic_id: '',
      address_line: '',
      district: userRole === 'data_entry' ? userDistrict : '',
      divisional_secretariat: '',
      grama_niladhari_division: '',
      village: '',
      marital_status: 'Single',
      mobile_no: '',
      email: '',
      ol_results: [],
      al_results: [],
      training_received: false,
      training_provider: '',
      course_vocation_name: '',
      training_duration: '',
      training_nature: 'Initial',
      training_establishment: '',
      training_placement_preference: '1st',
      center: null,
      course: null,
      batch: defaultBatch,
      enrollment_date: new Date().toISOString().split('T')[0],
      enrollment_status: 'Pending',
      registration_no: '',
      district_code: '',
      course_code: '',
      student_number: 0,
      registration_year: new Date().getFullYear().toString(),
      date_of_application: new Date().toISOString().split('T')[0],
      // Don't include profile_photo here
    });

    setRegComponents({
      district_code: '',
      course_code: '',
      batch_year: defaultBatch ? batches.find(b => b.id === defaultBatch)?.batch_code || '' : '',
      student_number: '',
      registration_year: new Date().getFullYear().toString()
    });

    // Reset profile photo
    setProfilePhoto(null);
    setProfilePhotoPreview(null);

    setEditingStudent(null);
    setCourses([]);
    setRegistrationPreview(null);
    setIsAutoGenerateRegNo(true);
    setManualRegNo(false);

    setTimeout(() => {
      generateRegistrationPreview();
    }, 100);
  };

  const addOlResult = () => {
    if (newOlSubject && newOlGrade && newOlYear) {
      const newResult: EducationalQualificationType = {
        subject: newOlSubject,
        grade: newOlGrade,
        year: parseInt(newOlYear),
        type: 'OL'
      };

      setFormData(prev => ({
        ...prev,
        ol_results: [...(prev.ol_results || []), newResult]
      }));
      setNewOlSubject('');
      setNewOlGrade('');
      setNewOlYear('');
    }
  };

  const addAlResult = () => {
    if (newAlSubject && newAlGrade && newAlYear) {
      const newResult: EducationalQualificationType = {
        subject: newAlSubject,
        grade: newAlGrade,
        year: parseInt(newAlYear),
        type: 'AL'
      };

      setFormData(prev => ({
        ...prev,
        al_results: [...(prev.al_results || []), newResult]
      }));
      setNewAlSubject('');
      setNewAlGrade('');
      setNewAlYear('');
    }
  };

  const removeOlResult = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ol_results: (prev.ol_results || []).filter((_, i) => i !== index)
    }));
  };

  const removeAlResult = (index: number) => {
    setFormData(prev => ({
      ...prev,
      al_results: (prev.al_results || []).filter((_, i) => i !== index)
    }));
  };





  const filteredStudents = students;

  const recentStudents = [...students]
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    .slice(0, 3);

  const ProfilePhotoSection = () => {
    return (
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Profile Photo
        </label>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="relative">
            <div className={`w-32 h-32 rounded-full border-3 ${profilePhotoPreview || editingStudent?.profile_photo_url
              ? 'border-green-300 shadow-lg'
              : 'border-dashed border-gray-300'
              } overflow-hidden bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center transition-all duration-300`}>
              {profilePhotoPreview ? (
                <img
                  src={profilePhotoPreview}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
              ) : editingStudent?.profile_photo_url ? (
                <img
                  src={editingStudent.profile_photo_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-green-50', 'to-blue-50');
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-4">
                  <Camera className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-xs text-gray-500 text-center">No photo uploaded</span>
                </div>
              )}
            </div>
            {(profilePhotoPreview || editingStudent?.profile_photo_url) && (
              <button
                type="button"
                onClick={() => {
                  setProfilePhoto(null);
                  setProfilePhotoPreview(null);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-all shadow-md hover:shadow-lg"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex-1">
            <div className="mb-3">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Upload Photo
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  id="profile-photo-upload"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validate file size (max 2MB)
                      if (file.size > 2 * 1024 * 1024) {
                        alert('File size too large. Maximum size is 2MB.');
                        return;
                      }

                      // Validate file type
                      if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
                        alert('Only JPG and PNG files are allowed.');
                        return;
                      }

                      setProfilePhoto(file);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setProfilePhotoPreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="profile-photo-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-sm hover:shadow"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Choose Photo</span>
                </label>
              </div>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <p className="flex items-center">
                <Info className="w-3 h-3 mr-1 text-green-500" />
                Recommended: Square image, max 2MB
              </p>
              <p className="flex items-center">
                <Info className="w-3 h-3 mr-1 text-green-500" />
                Formats: JPG, PNG
              </p>
              <p className="flex items-center">
                <Info className="w-3 h-3 mr-1 text-green-500" />
                Ideal size: 400x400 pixels
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ManualRegistrationSection = () => {
    return (
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200 mb-4 shadow-sm">
        <h4 className="text-sm font-semibold text-yellow-800 mb-3 flex items-center">
          <Info className="w-4 h-4 mr-2 text-yellow-600" />
          Manual Registration Number Editing
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              District Code *
            </label>
            <select
              value={regComponents.district_code}
              onChange={(e) => handleRegComponentChange('district_code', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm transition-all"
            >
              <option value="">Select District Code</option>
              {districtCodes.map((code) => (
                <option key={code.id} value={code.district_code}>
                  {code.district_code} - {code.district_name}
                </option>
              ))}
              <option value="GEN">GEN - General</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">e.g., MT (Matara)</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Course Code *
            </label>
            <select
              value={regComponents.course_code}
              onChange={(e) => handleRegComponentChange('course_code', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm transition-all"
            >
              <option value="">Select Course Code</option>
              {courseCodes.map((code) => (
                <option key={code.id} value={code.course_code}>
                  {code.course_code} - {code.course_name}
                </option>
              ))}
              <option value="GEN">GEN - General</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">e.g., WP (Web Programming)</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Batch *
            </label>
            <select
              value={regComponents.batch_year}
              onChange={(e) => handleRegComponentChange('batch_year', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm transition-all"
            >
              <option value="">Select Batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.batch_code}>
                  {batch.batch_code} - {batch.batch_name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">e.g., 01 - 1st Batch</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Student Number *
            </label>
            <input
              type="number"
              value={regComponents.student_number}
              onChange={(e) => handleRegComponentChange('student_number', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm transition-all"
              placeholder="0001"
              min="1"
              max="9999"
            />
            <p className="text-xs text-gray-500 mt-1">4 digits (0001-9999)</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Year *
            </label>
            <input
              type="text"
              value={regComponents.registration_year}
              onChange={(e) => handleRegComponentChange('registration_year', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm transition-all"
              placeholder="2025"
              maxLength={4}
            />
            <p className="text-xs text-gray-500 mt-1">Enrollment year</p>
          </div>
        </div>

        {formData.registration_no && (
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-yellow-100 shadow-sm">
            <div className="text-sm font-semibold text-gray-700 mb-1">
              Registration Number Preview:
            </div>
            <div className="text-lg sm:text-xl font-bold text-blue-600 bg-gradient-to-r from-blue-50 to-green-50 p-3 rounded-lg border border-blue-100">
              {formData.registration_no}
            </div>
            <div className="text-xs text-gray-500 mt-2 grid grid-cols-2 md:grid-cols-5 gap-2">
              <div className="bg-blue-50 p-2 rounded">
                <span className="font-medium text-blue-700">District:</span> {regComponents.district_code || 'MT'}
              </div>
              <div className="bg-green-50 p-2 rounded">
                <span className="font-medium text-green-700">Course:</span> {regComponents.course_code || 'WP'}
              </div>
              <div className="bg-yellow-50 p-2 rounded">
                <span className="font-medium text-yellow-700">Batch:</span> {
                  batches.find(b => b.batch_code === regComponents.batch_year)?.batch_name || '1st Batch'
                }
              </div>
              <div className="bg-purple-50 p-2 rounded">
                <span className="font-medium text-purple-700">Student #:</span> {regComponents.student_number?.padStart(4, '0') || '0001'}
              </div>
              <div className="bg-pink-50 p-2 rounded">
                <span className="font-medium text-pink-700">Year:</span> {regComponents.registration_year || '2025'}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const RegistrationPreviewSection = () => {
    const handleBatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const batchId = e.target.value;

      const batch = batches.find(b => b.id.toString() === batchId);
      if (batch) {
        const batchIdNum = batch.id;
        setFormData(prev => ({
          ...prev,
          batch: batchIdNum
        }));

        // Pass override to generate immediately without waiting for state update
        generateRegistrationPreview({ batch: batchIdNum });
      }
    };

    if (!registrationPreview) return null;

    return (
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-blue-800 flex items-center">
            <Info className="w-4 h-4 mr-2 text-blue-600" />
            Auto-generated Registration Number
          </h4>
          <button
            type="button"
            onClick={() => generateRegistrationPreview()}
            disabled={isGeneratingPreview}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center transition-colors"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isGeneratingPreview ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Select Batch
          </label>
          <select
            value={formData.batch?.toString() || ''}
            onChange={handleBatchChange}
            className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
          >
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id.toString()}>
                {batch.batch_code} - {batch.batch_name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Choose the batch for registration</p>
        </div>

        <div className="mb-2">
          <div className="text-lg sm:text-xl font-bold text-blue-900 mb-2 bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
            {registrationPreview.full_registration}
          </div>
          <div className="text-xs text-gray-600 grid grid-cols-2 md:grid-cols-5 gap-1">
            <div className="bg-blue-50 p-2 rounded"><span className="font-medium text-blue-700">District:</span> {registrationPreview.district_code}</div>
            <div className="bg-green-50 p-2 rounded"><span className="font-medium text-green-700">Course:</span> {registrationPreview.course_code}</div>
            <div className="bg-yellow-50 p-2 rounded">
              <span className="font-medium text-yellow-700">Batch:</span> {registrationPreview.batch_name || `${registrationPreview.batch_code}th Batch`}
            </div>
            <div className="bg-purple-50 p-2 rounded"><span className="font-medium text-purple-700">Student #:</span> {registrationPreview.student_number}</div>
            <div className="bg-pink-50 p-2 rounded"><span className="font-medium text-pink-700">Year:</span> {registrationPreview.year}</div>
          </div>
        </div>

        <div className="text-xs text-gray-500 italic bg-white/50 p-2 rounded border border-blue-100">
          This number will be assigned when you save the student record.
        </div>
      </div>
    );
  };

  const RegistrationFormatInfo = () => {
    if (!registrationFormats) return null;

    return (
      <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm">
        <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center">
          <Info className="w-4 h-4 mr-2 text-green-600" />
          Registration Number Format
        </h4>
        <div className="text-xs text-gray-700 mb-2">
          <code className="bg-green-100 px-3 py-1.5 rounded-lg border border-green-200 font-mono">{registrationFormats.format}</code>
        </div>

        <div className="text-xs text-gray-600">
          <div className="font-medium mb-2 text-gray-700">Examples:</div>
          {registrationFormats.examples.map((example: any, index: number) => (
            <div key={index} className="mb-2 last:mb-0">
              <code className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 font-mono block mb-1">{example.format}</code>
              <div className="text-gray-500 text-xs ml-1">{example.explanation}</div>
            </div>
          ))}
        </div>

        <div className="text-xs text-green-600 mt-3 p-2 bg-green-50 rounded border border-green-100">
          {registrationFormats.note}
        </div>
      </div>
    );
  };

  const CenterAndCourseSection = () => (
    <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200 hover:border-green-300 transition-all duration-300 shadow-sm hover:shadow">
      <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-800 flex items-center">
        <Building className="w-5 h-5 mr-2 text-green-600" />
        Center & Course Assignment
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Training Center
          </label>
          <select
            value={formData.center || ''}
            onChange={handleCenterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-400 transition-all text-sm"
          >
            <option value="">Select Center</option>
            {centers.map(center => (
              <option key={center.id} value={center.id}>
                {center.name} - {center.district}
              </option>
            ))}
          </select>
          {loadingCenters && <p className="text-xs text-gray-500 mt-2 animate-pulse">Loading centers...</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course
          </label>
          <select
            value={formData.course || ''}
            onChange={handleCourseChange}
            disabled={!formData.center || loadingCourses}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 hover:border-green-400 transition-all text-sm"
          >
            <option value="">Select Course</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {course.name} - {course.code}
              </option>
            ))}
          </select>
          {loadingCourses && <p className="text-xs text-gray-500 mt-2 animate-pulse">Loading courses...</p>}
          {!formData.center && <p className="text-xs text-gray-500 mt-2">Please select a center first</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enrollment Date *
          </label>
          <input
            type="date"
            required
            value={formData.enrollment_date || ''}
            onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-400 transition-all text-sm"
          />
          <p className="text-xs text-gray-500 mt-2">Used to determine registration year</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enrollment Status
          </label>
          <select
            value={formData.enrollment_status || 'Pending'}
            onChange={(e) => setFormData({ ...formData, enrollment_status: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-400 transition-all text-sm"
          >
            <option value="Pending">Pending</option>
            <option value="Enrolled">Enrolled</option>
            <option value="Completed">Completed</option>
            <option value="Dropped">Dropped</option>
          </select>
        </div>
      </div>
    </div>
  );

  const StudentDetailsModal = () => {
    if (!selectedStudent) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-2 animate-in fade-in-0 zoom-in-95 duration-300">
          <div className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Student Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600 transition-all hover:scale-110"
              >
                <X className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center bg-gradient-to-r from-green-50 to-blue-50 p-4 sm:p-6 rounded-xl border border-green-200">
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 ${selectedStudent.profile_photo_url ? 'border-green-300' : 'border-green-200'
                  } overflow-hidden bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center mr-4 sm:mr-6 shadow-lg`}>
                  {selectedStudent.profile_photo_url ? (
                    <img
                      src={selectedStudent.profile_photo_url}
                      alt={selectedStudent.full_name_english}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-green-100', 'to-blue-100');
                      }}
                    />
                  ) : (
                    <User className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" />
                  )}
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {selectedStudent.full_name_english}
                  </h1>
                  <p className="text-green-600 font-bold text-sm sm:text-base mt-1">
                    {selectedStudent.registration_no}
                  </p>
                  <p className="text-gray-600 text-sm mt-2">{selectedStudent.name_with_initials}</p>
                </div>
              </div>

              {/* Registration Information */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 sm:p-6 rounded-xl border border-blue-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Info className="w-5 h-5 mr-2 text-green-600" />
                    Registration Information
                  </h3>
                  <button
                    onClick={() => handleShowIDCard(selectedStudent)}
                    className="flex items-center space-x-2 bg-white text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition text-sm font-medium"
                  >
                    <IdCard className="w-4 h-4" />
                    <span>Generate ID Card</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <div className="mb-4">
                      <div className="text-lg font-bold text-green-600 bg-white p-3 rounded-lg border border-green-100 shadow-sm">
                        {selectedStudent.registration_no}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                        <div className="text-xs text-blue-700 font-medium">District Code</div>
                        <div className="font-bold text-gray-900">{selectedStudent.district_code || 'N/A'}</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                        <div className="text-xs text-green-700 font-medium">Course Code</div>
                        <div className="font-bold text-gray-900">{selectedStudent.course_code || 'N/A'}</div>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 rounded-lg border border-yellow-200">
                        <div className="text-xs text-yellow-700 font-medium">Batch</div>
                        <div className="font-bold text-gray-900">{selectedStudent.batch_display || selectedStudent.batch_code || 'N/A'}</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                        <div className="text-xs text-purple-700 font-medium">Student #</div>
                        <div className="font-bold text-gray-900">{selectedStudent.student_number || 'N/A'}</div>
                      </div>
                      <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-3 rounded-lg border border-pink-200">
                        <div className="text-xs text-pink-700 font-medium">Year</div>
                        <div className="font-bold text-gray-900">{selectedStudent.registration_year || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Application</label>
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.date_of_application}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Date</label>
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.enrollment_date || 'Not set'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Status</label>
                    <div className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${selectedStudent.enrollment_status === 'Enrolled' ? 'bg-green-100 text-green-800 border border-green-200' :
                      selectedStudent.enrollment_status === 'Completed' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        selectedStudent.enrollment_status === 'Dropped' ? 'bg-red-100 text-red-800 border border-red-200' :
                          'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      }`}>
                      {selectedStudent.enrollment_status || 'Pending'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 sm:p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (English)</label>
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.full_name_english}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (Sinhala/Tamil)</label>
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.full_name_sinhala}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name with Initials</label>
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.name_with_initials}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.gender}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.date_of_birth}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIC/ID Card No.</label>
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.nic_id}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.marital_status || 'Single'}</div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 sm:p-6 rounded-xl border border-blue-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile No.</label>
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.mobile_no}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.email || 'Not provided'}</div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 rounded-xl border border-green-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.district}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Divisional Secretariat</label>
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.divisional_secretariat || 'Not provided'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grama Niladhari Division</label>
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.grama_niladhari_division || 'Not provided'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.village || 'Not provided'}</div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line</label>
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.address_line || 'Not provided'}</div>
                  </div>
                </div>
              </div>

              {/* Center & Course Information */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 sm:p-6 rounded-xl border border-purple-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Center & Course Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Training Center</label>
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.center_name || 'Not assigned'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.course_name || 'Not assigned'}</div>
                    {selectedStudent.course_code_display && (
                      <div className="text-xs text-gray-600 mt-1">Code: {selectedStudent.course_code_display}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Educational Qualifications */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 sm:p-6 rounded-xl border border-yellow-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Educational Qualifications</h3>



                <div>
                  <h4 className="font-medium text-gray-700 mb-3 text-base">G.C.E. O/L Results</h4>
                  {selectedStudent.ol_results && selectedStudent.ol_results.length > 0 ? (
                    <div className="overflow-hidden border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedStudent.ol_results.map((result, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm text-gray-900">{result.subject}</td>
                              <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                                <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-medium ${result.grade === 'A' ? 'bg-green-100 text-green-800' :
                                  result.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                    result.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                      result.grade === 'S' ? 'bg-gray-100 text-gray-800' :
                                        'bg-red-100 text-red-800'
                                  }`}>
                                  {result.grade}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">{result.year}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm bg-white p-3 rounded-lg border border-gray-200 italic">No O/L results recorded</div>
                  )}
                </div>

                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-3 text-base">G.C.E. A/L Results</h4>
                  {selectedStudent.al_results && selectedStudent.al_results.length > 0 ? (
                    <div className="overflow-hidden border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedStudent.al_results.map((result, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm text-gray-900">{result.subject}</td>
                              <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                                <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-medium ${result.grade === 'A' ? 'bg-green-100 text-green-800' :
                                  result.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                    result.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                      result.grade === 'S' ? 'bg-gray-100 text-gray-800' :
                                        'bg-red-100 text-red-800'
                                  }`}>
                                  {result.grade}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">{result.year}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm bg-white p-3 rounded-lg border border-gray-200 italic">No A/L results recorded</div>
                  )}
                </div>
              </div>

              {/* Training Details */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 sm:p-6 rounded-xl border border-emerald-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Training Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-full border ${selectedStudent.training_received
                      ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200'
                      : 'bg-gray-100 text-gray-800 border-gray-200'
                      }`}>
                      {selectedStudent.training_received ? 'Trained' : 'Not Trained'}
                    </div>
                  </div>

                  {selectedStudent.training_received && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Training Provider</label>
                        <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.training_provider || 'Not provided'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Course/Vocation Name</label>
                        <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.course_vocation_name || 'Not provided'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                        <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.training_duration || 'Not provided'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nature of Training</label>
                        <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.training_nature || 'Initial'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Training Establishment</label>
                        <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.training_establishment || 'Not provided'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Placement Preference</label>
                        <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.training_placement_preference || '1st'}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>


            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Student Data Entry</h1>
                <p className="text-gray-600 mt-1">Manage student records and information</p>
              </div>
            </div>
            {userDistrict && (
              <div className="flex items-center mt-3 text-sm text-green-600 bg-gradient-to-r from-green-50 to-emerald-50 p-2 rounded-lg border border-green-200 inline-flex">
                <MapPin className="w-4 h-4 mr-2" />
                <span>District: {userDistrict}</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3">

            <button
              onClick={() => setShowBulkIDCardGenerator(true)}
              disabled={students.length === 0}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2.5 rounded-xl flex items-center space-x-2 hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl text-sm sm:text-base disabled:opacity-50"
            >
              <Printer className="w-5 h-5" />
              <span>Bulk Print ID Cards</span>
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2.5 rounded-xl flex items-center space-x-2 hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <Plus className="w-5 h-5" />
              <span>Add Student</span>
            </button>
          </div>
        </div>

        {/* Add/Edit Student Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto mx-2 animate-in fade-in-0 zoom-in-95 duration-300">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingStudent ? 'Edit Student' : 'Add New Student'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-all hover:scale-110"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Profile Photo Section */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border border-green-200">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                      <Camera className="w-5 h-5 mr-2 text-green-600" />
                      Profile Photo
                    </h3>
                    <ProfilePhotoSection />
                  </div>

                  <RegistrationFormatInfo />

                  {/* Registration Number Options */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Registration Number</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-all cursor-pointer"
                        onClick={() => {
                          setManualRegNo(false);
                          setIsAutoGenerateRegNo(true);
                          generateRegistrationPreview();
                        }}>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="auto-generate"
                            checked={!manualRegNo}
                            onChange={() => {
                              setManualRegNo(false);
                              setIsAutoGenerateRegNo(true);
                              generateRegistrationPreview();
                            }}
                            className="mr-3 h-4 w-4 text-green-600 focus:ring-green-500"
                          />
                          <label htmlFor="auto-generate" className="block text-sm font-medium text-gray-700 cursor-pointer">
                            Auto-generate Registration Number
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 ml-7">
                          Registration number will be automatically generated
                        </p>
                      </div>

                      <div className="p-3 rounded-lg border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-all cursor-pointer"
                        onClick={() => {
                          setManualRegNo(true);
                          setIsAutoGenerateRegNo(false);
                        }}>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="manual-edit"
                            checked={manualRegNo}
                            onChange={() => {
                              setManualRegNo(true);
                              setIsAutoGenerateRegNo(false);
                            }}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="manual-edit" className="block text-sm font-medium text-gray-700 cursor-pointer">
                            Edit Registration Number Manually
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 ml-7">
                          You can manually set each component
                        </p>
                      </div>
                    </div>
                  </div>

                  {manualRegNo ? (
                    <ManualRegistrationSection />
                  ) : (
                    <RegistrationPreviewSection />
                  )}

                  {/* Personal Information */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name (English) *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.full_name_english || ''}
                          onChange={(e) => setFormData({ ...formData, full_name_english: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-400 transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name (Sinhala/Tamil) *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.full_name_sinhala || ''}
                          onChange={(e) => setFormData({ ...formData, full_name_sinhala: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-400 transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Name with Initials *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name_with_initials || ''}
                          onChange={(e) => setFormData({ ...formData, name_with_initials: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-400 transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Gender *
                        </label>
                        <select
                          value={formData.gender || 'Male'}
                          onChange={(e) => setFormData({
                            ...formData,
                            gender: e.target.value as 'Male' | 'Female' | 'Other'
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-400 transition-all text-sm"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date of Birth *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.date_of_birth || ''}
                          onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-400 transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          NIC/ID Card No. *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.nic_id || ''}
                          onChange={(e) => setFormData({ ...formData, nic_id: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-400 transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Marital Status
                        </label>
                        <select
                          value={formData.marital_status || 'Single'}
                          onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-400 transition-all text-sm"
                        >
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Divorced">Divorced</option>
                          <option value="Widowed">Widowed</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Address Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address Line
                        </label>
                        <input
                          type="text"
                          value={formData.address_line || ''}
                          onChange={(e) => setFormData({ ...formData, address_line: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-400 transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          District *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.district || ''}
                          onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                          readOnly={userRole === 'data_entry'}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-400 transition-all text-sm ${userRole === 'data_entry' ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                        />
                        {userRole === 'data_entry' && (
                          <p className="text-xs text-gray-500 mt-2">
                            District is automatically set to your assigned district
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Divisional Secretariat
                        </label>
                        <input
                          type="text"
                          value={formData.divisional_secretariat || ''}
                          onChange={(e) => setFormData({ ...formData, divisional_secretariat: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-400 transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Grama Niladhari Division
                        </label>
                        <input
                          type="text"
                          value={formData.grama_niladhari_division || ''}
                          onChange={(e) => setFormData({ ...formData, grama_niladhari_division: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-400 transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Village
                        </label>
                        <input
                          type="text"
                          value={formData.village || ''}
                          onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-400 transition-all text-sm"
                        />
                      </div>

                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-xl border border-blue-200">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mobile No. *
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.mobile_no || ''}
                          onChange={(e) => setFormData({ ...formData, mobile_no: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-400 transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-400 transition-all text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <CenterAndCourseSection />

                  {/* Educational Qualifications */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Educational Qualifications</h3>

                    {/* O/L Results */}
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-700 mb-3 text-base">G.C.E. O/L Results</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                        <div>
                          <input
                            type="text"
                            placeholder="Subject"
                            value={newOlSubject}
                            onChange={(e) => setNewOlSubject(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Grade"
                            value={newOlGrade}
                            onChange={(e) => setNewOlGrade(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="Year"
                            value={newOlYear}
                            onChange={(e) => setNewOlYear(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={addOlResult}
                          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all text-sm font-medium"
                        >
                          Add O/L Result
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(formData.ol_results || []).map((result, index) => (
                          <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 hover:bg-green-50 transition-all">
                            <span className="text-sm">{result.subject} - {result.grade} ({result.year})</span>
                            <button
                              type="button"
                              onClick={() => removeOlResult(index)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* A/L Results */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3 text-base">G.C.E. A/L Results</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                        <div>
                          <input
                            type="text"
                            placeholder="Subject"
                            value={newAlSubject}
                            onChange={(e) => setNewAlSubject(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Grade"
                            value={newAlGrade}
                            onChange={(e) => setNewAlGrade(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="Year"
                            value={newAlYear}
                            onChange={(e) => setNewAlYear(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={addAlResult}
                          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all text-sm font-medium"
                        >
                          Add A/L Result
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(formData.al_results || []).map((result, index) => (
                          <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 hover:bg-green-50 transition-all">
                            <span className="text-sm">{result.subject} - {result.grade} ({result.year})</span>
                            <button
                              type="button"
                              onClick={() => removeAlResult(index)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Training Details */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Training Details</h3>
                    <div className="space-y-4">
                      <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
                        <input
                          type="checkbox"
                          checked={formData.training_received || false}
                          onChange={(e) => setFormData({ ...formData, training_received: e.target.checked })}
                          className="mr-3 h-5 w-5 text-green-600 rounded focus:ring-green-500"
                        />
                        <label className="text-sm font-medium text-gray-700">
                          Training Received
                        </label>
                      </div>

                      {(formData.training_received) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Training Provider
                            </label>
                            <input
                              type="text"
                              value={formData.training_provider || ''}
                              onChange={(e) => setFormData({ ...formData, training_provider: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-400 transition-all text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Course/Vocation Name
                            </label>
                            <input
                              type="text"
                              value={formData.course_vocation_name || ''}
                              onChange={(e) => setFormData({ ...formData, course_vocation_name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-400 transition-all text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Duration
                            </label>
                            <input
                              type="text"
                              value={formData.training_duration || ''}
                              onChange={(e) => setFormData({ ...formData, training_duration: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-400 transition-all text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Nature of Training
                            </label>
                            <select
                              value={formData.training_nature || 'Initial'}
                              onChange={(e) => setFormData({ ...formData, training_nature: e.target.value as any })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-400 transition-all text-sm"
                            >
                              <option value="Initial">Initial</option>
                              <option value="Further">Further</option>
                              <option value="Re-training">Re-training</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Training Establishment
                            </label>
                            <input
                              type="text"
                              value={formData.training_establishment || ''}
                              onChange={(e) => setFormData({ ...formData, training_establishment: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-400 transition-all text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Placement Preference
                            </label>
                            <select
                              value={formData.training_placement_preference || '1st'}
                              onChange={(e) => setFormData({ ...formData, training_placement_preference: e.target.value as any })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-green-400 transition-all text-sm"
                            >
                              <option value="1st">1st Preference</option>
                              <option value="2nd">2nd Preference</option>
                              <option value="3rd">3rd Preference</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        resetForm();
                      }}
                      className="px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all transform hover:scale-105 text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2.5 rounded-xl hover:from-green-600 hover:to-green-700 transition-all flex items-center space-x-2 disabled:opacity-50 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm font-medium"
                    >
                      <Save className="w-4 h-4" />
                      <span>{loading ? 'Saving...' : (editingStudent ? 'Update Student' : 'Save Student')}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showDetails && <StudentDetailsModal />}

        {/* Student ID Card Modal */}
        {showIDCard && selectedIDCardStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-300">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Student ID Card
                  </h2>
                  <button
                    onClick={() => {
                      setShowIDCard(false);
                      setSelectedIDCardStudent(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-all hover:scale-110"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <StudentIDCard
                  student={selectedIDCardStudent}
                  onClose={() => {
                    setShowIDCard(false);
                    setSelectedIDCardStudent(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Bulk ID Card Generator Modal */}
        {showBulkIDCardGenerator && (
          <BulkIDCardGenerator
            students={students}
            onClose={() => setShowBulkIDCardGenerator(false)}
          />
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students by name, NIC, registration no, district, center, or course..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent hover:border-green-400 transition-all text-sm shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium">
              <Filter className="w-5 h-5" />
              <span>Filter</span>
            </button>
          </div>
        </div>



        {/* Recent Records */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-green-600" />
            Recent Records
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {recentStudents.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-xl p-4 flex items-center justify-between hover:shadow-xl transition-all cursor-pointer transform hover:scale-105 border border-gray-200"
                onClick={() => handleViewDetails(student)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden ${student.profile_photo_url ? '' : 'bg-gradient-to-br from-green-100 to-blue-100'
                    }`}>
                    {student.profile_photo_url ? (
                      <img
                        src={student.profile_photo_url}
                        alt={student.full_name_english}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-green-100', 'to-blue-100');
                        }}
                      />
                    ) : (
                      <User className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{student.full_name_english}</p>
                    <p className="text-green-600 font-bold text-xs">{student.registration_no}</p>
                    <p className="text-xs text-gray-400">{student.nic_id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${student.training_received ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {student.training_received ? 'Trained' : 'Not Trained'}
                  </span>
                  {student.enrollment_status && (
                    <span className={`block text-xs px-2 py-1 rounded-full mt-1 ${student.enrollment_status === 'Enrolled' ? 'bg-green-100 text-green-800' :
                      student.enrollment_status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                        student.enrollment_status === 'Dropped' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                      }`}>
                      {student.enrollment_status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Student Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          <div className="md:hidden p-4">
            {filteredStudents.map((student) => (
              <MobileStudentCard
                key={student.id}
                student={student}
                onViewDetails={handleViewDetails}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onShowIDCard={handleShowIDCard}

              />
            ))}

            {filteredStudents.length === 0 && (
              <div className="text-center text-gray-500 py-8 text-sm">
                {loading ? 'Loading...' : 'No student records found.'}
              </div>
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Student Info
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Registration Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Center & Course
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Education
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Training
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gradient-to-r hover:from-green-50/50 hover:to-blue-50/50 transition-all">
                    <td className="px-6 py-4">

                      <div className="flex items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 overflow-hidden ${student.profile_photo_url ? '' : 'bg-gradient-to-br from-green-100 to-blue-100'
                          }`}>
                          {student.profile_photo_url ? (
                            <img
                              src={student.profile_photo_url}
                              alt={student.full_name_english}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-green-100', 'to-blue-100');
                              }}
                            />
                          ) : (
                            <User className="w-6 h-6 text-green-600" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-green-600">{student.registration_no}</div>
                          <div className="text-sm font-semibold text-gray-900">{student.full_name_english}</div>
                          <div className="text-xs text-gray-500">{student.name_with_initials}</div>
                          <div className="text-xs text-gray-400">NIC: {student.nic_id}</div>
                          <div className="text-xs text-gray-400">Gender: {student.gender} | DOB: {student.date_of_birth}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border border-blue-200">
                            {student.district_code || 'N/A'}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-green-50 to-green-100 text-green-800 border border-green-200">
                            {student.course_code || 'GEN'}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 border border-yellow-200">
                            {student.batch_display || student.batch_code || 'N/A'}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 border border-purple-200">
                            #{student.student_number || 'N/A'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Year: {student.registration_year || new Date().getFullYear()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {student.center_name || 'No Center'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {student.course_name || 'No Course'}
                        {student.course_code_display && ` (${student.course_code_display})`}
                      </div>
                      {student.enrollment_status && (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${student.enrollment_status === 'Enrolled' ? 'bg-green-100 text-green-800 border border-green-200' :
                          student.enrollment_status === 'Completed' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            student.enrollment_status === 'Dropped' ? 'bg-red-100 text-red-800 border border-red-200' :
                              'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}>
                          {student.enrollment_status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{student.mobile_no}</div>
                      <div className="text-xs text-gray-500">{student.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div>
                          <div className="text-xs font-semibold text-gray-500 mb-1">G.C.E. O/L</div>
                          {(() => {
                            const results = Array.isArray(student.ol_results) ? student.ol_results : (typeof student.ol_results === 'string' ? JSON.parse(student.ol_results) : []) as EducationalQualificationType[];

                            return results && results.length > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                {results.length} Subjects
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 italic">No results</span>
                            );
                          })()}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-500 mb-1">G.C.E. A/L</div>
                          {(() => {
                            const results = Array.isArray(student.al_results) ? student.al_results : (typeof student.al_results === 'string' ? JSON.parse(student.al_results) : []) as EducationalQualificationType[];

                            return results && results.length > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
                                {results.length} Subjects
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 italic">No results</span>
                            );
                          })()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="mb-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-lg ${student.training_received
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200'
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}>
                          {student.training_received ? (
                            <>
                              <span>Trained</span>
                              {student.course_vocation_name && (
                                <span className="text-xs ml-1">({student.course_vocation_name})</span>
                              )}
                            </>
                          ) : (
                            'Not Trained'
                          )}
                        </span>
                      </div>
                      {student.training_received && student.training_provider && (
                        <div className="text-xs text-gray-500">
                          {student.training_provider} • {student.training_duration}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(student)}
                          className="text-blue-600 hover:text-blue-800 transition-all transform hover:scale-110 p-2 rounded-lg hover:bg-blue-50"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(student)}
                          className="text-green-600 hover:text-green-800 transition-all transform hover:scale-110 p-2 rounded-lg hover:bg-green-50"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleShowIDCard(student)}
                          className="text-purple-600 hover:text-purple-800 transition-all transform hover:scale-110 p-2 rounded-lg hover:bg-purple-50"
                          title="ID Card"
                        >
                          <IdCard className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => student.id && handleDelete(student.id)}
                          className="text-red-600 hover:text-red-800 transition-all transform hover:scale-110 p-2 rounded-lg hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-500 py-8">
                      {loading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading students...</span>
                        </div>
                      ) : (
                        'No student records found.'
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div >
  );
};

export default DataEntryStudents;