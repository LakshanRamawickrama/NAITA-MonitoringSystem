// src/pages/DataEntryDashboard/DataEntryStudents.tsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Edit, Trash2, User, Clock, Save, X, Eye, 
  MapPin, Building, ChevronDown, ChevronUp, Info, RefreshCw, 
  Phone, BookOpen
} from 'lucide-react';
import { 
  type StudentType, 
  type EducationalQualificationType,
  type Center,
  type CourseType,
  type RegistrationNumberPreview,
  type BatchType,
  fetchStudents, 
  createStudent, 
  updateStudent, 
  deleteStudent,
  fetchCentersForStudent,
  fetchCoursesForStudent,
  getUserDistrict,
  getUserRole,
  previewRegistrationNumber,
  fetchRegistrationFormats,
  fetchAvailableDistrictCodes,
  fetchAvailableCourseCodes,
  fetchAvailableBatches
} from '../../api/api';

// Mobile Student Card Component
interface MobileStudentCardProps {
  student: StudentType;
  onViewDetails: (student: StudentType) => void;
  onEdit: (student: StudentType) => void;
  onDelete: (id: number) => void;
}

const MobileStudentCard: React.FC<MobileStudentCardProps> = ({
  student,
  onViewDetails,
  onEdit,
  onDelete
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3 shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-green-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-gray-900 text-sm break-words">{student.full_name_english}</h3>
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
          className="ml-2 p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          student.enrollment_status === 'Enrolled' ? 'bg-green-100 text-green-800' :
          student.enrollment_status === 'Completed' ? 'bg-blue-100 text-blue-800' :
          student.enrollment_status === 'Dropped' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {student.enrollment_status || 'Pending'}
        </span>
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          student.training_received
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {student.training_received ? 'Trained' : 'Not Trained'}
        </span>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
          <div className="bg-gray-50 rounded p-2">
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

          <div className="bg-gray-50 rounded p-2">
            <div className="text-xs font-semibold text-gray-700 mb-1">Education:</div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <div className="text-xs font-bold text-gray-900">{student.ol_results?.length || 0}</div>
                <div className="text-[10px] text-gray-600">O/L Subjects</div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">{student.al_results?.length || 0}</div>
                <div className="text-[10px] text-gray-600">A/L Subjects</div>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => onViewDetails(student)}
              className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-xs font-medium hover:bg-blue-700 transition flex items-center justify-center space-x-1"
            >
              <Eye className="w-3 h-3" />
              <span>Details</span>
            </button>
            <button
              onClick={() => onEdit(student)}
              className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-xs font-medium hover:bg-green-700 transition flex items-center justify-center space-x-1"
            >
              <Edit className="w-3 h-3" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => student.id && onDelete(student.id)}
              className="flex-1 bg-red-600 text-white py-2 px-3 rounded text-xs font-medium hover:bg-red-700 transition flex items-center justify-center space-x-1"
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
    residence_type: '',
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

  const generateRegistrationPreview = async () => {
    if (!formData.district) {
      setRegistrationPreview(null);
      return;
    }

    try {
      setIsGeneratingPreview(true);
      const preview = await previewRegistrationNumber({
        district: formData.district,
        course_id: formData.course || undefined,
        enrollment_date: formData.enrollment_date || undefined,
        batch_id: formData.batch || undefined
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let studentData = { ...formData };
      
      // If editing and registration number exists, keep it
      if (editingStudent && editingStudent.registration_no) {
        studentData.registration_no = editingStudent.registration_no;
        studentData.district_code = editingStudent.district_code;
        studentData.course_code = editingStudent.course_code;
        studentData.batch_year = editingStudent.batch_year;
        studentData.student_number = editingStudent.student_number;
        studentData.registration_year = editingStudent.registration_year;
      }

      if (editingStudent && editingStudent.id) {
        const updatedStudent = await updateStudent(editingStudent.id, studentData);
        setStudents(students.map(student => 
          student.id === editingStudent.id ? updatedStudent : student
        ));
      } else {
        const newStudent = await createStudent(studentData);
        setStudents([...students, newStudent]);
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
    });
    
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
  };

  const handleViewDetails = (student: StudentType) => {
    setSelectedStudent(student);
    setShowDetails(true);
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
      residence_type: '',
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
    });
    
    setRegComponents({
      district_code: '',
      course_code: '',
      batch_year: defaultBatch ? batches.find(b => b.id === defaultBatch)?.batch_code || '' : '',
      student_number: '',
      registration_year: new Date().getFullYear().toString()
    });
    
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

  const ManualRegistrationSection = () => {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
        <h4 className="text-sm font-semibold text-yellow-800 mb-3 flex items-center">
          <Info className="w-4 h-4 mr-2" />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="2025"
              maxLength={4}
            />
            <p className="text-xs text-gray-500 mt-1">Enrollment year</p>
          </div>
        </div>
        
        {formData.registration_no && (
          <div className="bg-white p-3 rounded border">
            <div className="text-sm font-semibold text-gray-700 mb-1">
              Registration Number Preview:
            </div>
            <div className="text-lg font-bold text-blue-600">
              {formData.registration_no}
            </div>
            <div className="text-xs text-gray-500 mt-2 grid grid-cols-2 md:grid-cols-5 gap-2">
              <div>
                <span className="font-medium">District:</span> {regComponents.district_code || 'MT'}
              </div>
              <div>
                <span className="font-medium">Course:</span> {regComponents.course_code || 'WP'}
              </div>
              <div>
                <span className="font-medium">Batch:</span> {
                  batches.find(b => b.batch_code === regComponents.batch_year)?.batch_name || '1st Batch'
                }
              </div>
              <div>
                <span className="font-medium">Student #:</span> {regComponents.student_number?.padStart(4, '0') || '0001'}
              </div>
              <div>
                <span className="font-medium">Year:</span> {regComponents.registration_year || '2025'}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const RegistrationPreviewSection = () => {
    const [selectedBatch, setSelectedBatch] = useState<string>(batches.length > 0 ? batches[0].id.toString() : '');
    
    const handleBatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const batchId = e.target.value;
      setSelectedBatch(batchId);
      
      const batch = batches.find(b => b.id.toString() === batchId);
      if (batch) {
        setFormData(prev => ({
          ...prev,
          batch: batch.id
        }));
        
        setTimeout(() => {
          generateRegistrationPreview();
        }, 100);
      }
    };

    if (!registrationPreview) return null;

    return (
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-blue-800 flex items-center">
            <Info className="w-4 h-4 mr-1" />
            Auto-generated Registration Number
          </h4>
          <button
            type="button"
            onClick={generateRegistrationPreview}
            disabled={isGeneratingPreview}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
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
            value={selectedBatch}
            onChange={handleBatchChange}
            className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
          <div className="text-lg font-bold text-blue-900 mb-1">
            {registrationPreview.full_registration}
          </div>
          <div className="text-xs text-gray-600 grid grid-cols-2 md:grid-cols-5 gap-1">
            <div><span className="font-medium">District:</span> {registrationPreview.district_code}</div>
            <div><span className="font-medium">Course:</span> {registrationPreview.course_code}</div>
            <div>
              <span className="font-medium">Batch:</span> {registrationPreview.batch_name || `${registrationPreview.batch_code}th Batch`}
            </div>
            <div><span className="font-medium">Student #:</span> {registrationPreview.student_number}</div>
            <div><span className="font-medium">Year:</span> {registrationPreview.year}</div>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 italic">
          This number will be assigned when you save the student record.
        </div>
      </div>
    );
  };

  const RegistrationFormatInfo = () => {
    if (!registrationFormats) return null;

    return (
      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <h4 className="text-sm font-semibold text-green-800 mb-2">
          Registration Number Format
        </h4>
        <div className="text-xs text-gray-700 mb-2">
          <code className="bg-green-100 px-2 py-1 rounded">{registrationFormats.format}</code>
        </div>
        
        <div className="text-xs text-gray-600">
          <div className="font-medium mb-1">Examples:</div>
          {registrationFormats.examples.map((example: any, index: number) => (
            <div key={index} className="mb-1">
              <code className="bg-white px-2 py-1 rounded border">{example.format}</code>
              <div className="text-gray-500 text-xs mt-1">{example.explanation}</div>
            </div>
          ))}
        </div>
        
        <div className="text-xs text-green-600 mt-2">
          {registrationFormats.note}
        </div>
      </div>
    );
  };

  const CenterAndCourseSection = () => (
    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-green-300 transition-all duration-200">
      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800 flex items-center">
        <Building className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" />
        Center & Course Assignment
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Training Center
          </label>
          <select
            value={formData.center || ''}
            onChange={(e) => {
              const centerId = e.target.value ? parseInt(e.target.value) : null;
              setFormData({ 
                ...formData, 
                center: centerId,
                course: null
              });
              if (centerId) {
                loadCourses(centerId);
              } else {
                setCourses([]);
              }
            }}
            className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 hover:border-green-400 transition text-xs sm:text-sm"
          >
            <option value="">Select Center</option>
            {centers.map(center => (
              <option key={center.id} value={center.id}>
                {center.name} - {center.district}
              </option>
            ))}
          </select>
          {loadingCenters && <p className="text-xs text-gray-500 mt-1">Loading centers...</p>}
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Course
          </label>
          <select
            value={formData.course || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              course: e.target.value ? parseInt(e.target.value) : null 
            })}
            disabled={!formData.center || loadingCourses}
            className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 hover:border-green-400 transition text-xs sm:text-sm"
          >
            <option value="">Select Course</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {course.name} - {course.code}
              </option>
            ))}
          </select>
          {loadingCourses && <p className="text-xs text-gray-500 mt-1">Loading courses...</p>}
          {!formData.center && <p className="text-xs text-gray-500 mt-1">Please select a center first</p>}
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Enrollment Date *
          </label>
          <input
            type="date"
            required
            value={formData.enrollment_date || ''}
            onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
            className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 hover:border-green-400 transition text-xs sm:text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">Used to determine registration year</p>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Enrollment Status
          </label>
          <select
            value={formData.enrollment_status || 'Pending'}
            onChange={(e) => setFormData({ ...formData, enrollment_status: e.target.value as any })}
            className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 hover:border-green-400 transition text-xs sm:text-sm"
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-2">
          <div className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Student Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800 flex items-center">
                  <Info className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" />
                  Registration Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Registration No.</label>
                    <p className="text-lg sm:text-xl font-bold text-green-600">{selectedStudent.registration_no}</p>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-2">
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="text-xs text-gray-600">District Code</div>
                        <div className="font-bold">{selectedStudent.district_code || 'N/A'}</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <div className="text-xs text-gray-600">Course Code</div>
                        <div className="font-bold">{selectedStudent.course_code || 'N/A'}</div>
                      </div>
                      <div className="bg-yellow-50 p-2 rounded">
                        <div className="text-xs text-gray-600">Batch</div>
                        <div className="font-bold">{selectedStudent.batch_display || selectedStudent.batch_code || 'N/A'}</div>
                      </div>
                      <div className="bg-purple-50 p-2 rounded">
                        <div className="text-xs text-gray-600">Student #</div>
                        <div className="font-bold">{selectedStudent.student_number || 'N/A'}</div>
                      </div>
                      <div className="bg-pink-50 p-2 rounded">
                        <div className="text-xs text-gray-600">Year</div>
                        <div className="font-bold">{selectedStudent.registration_year || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date of Application</label>
                    <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.date_of_application}</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Enrollment Date</label>
                    <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.enrollment_date || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Enrollment Status</label>
                    <p className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedStudent.enrollment_status === 'Enrolled' ? 'bg-green-100 text-green-800' :
                      selectedStudent.enrollment_status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                      selectedStudent.enrollment_status === 'Dropped' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedStudent.enrollment_status || 'Pending'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Full Name (English)</label>
                    <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.full_name_english}</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Full Name (Sinhala/Tamil)</label>
                    <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.full_name_sinhala}</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Name with Initials</label>
                    <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.name_with_initials}</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.gender}</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.date_of_birth}</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">NIC/ID Card No.</label>
                    <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.nic_id}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Mobile No.</label>
                    <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.mobile_no}</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.email || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">District</label>
                    <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.district}</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Divisional Secretariat</label>
                    <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.divisional_secretariat || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Grama Niladhari Division</label>
                    <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.grama_niladhari_division || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Village</label>
                    <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.village || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address Line</label>
                    <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.address_line || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Center & Course Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Training Center</label>
                    <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.center_name || 'Not assigned'}</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Course</label>
                    <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.course_name || 'Not assigned'}</p>
                    {selectedStudent.course_code_display && (
                      <p className="text-xs text-gray-600">Code: {selectedStudent.course_code_display}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Educational Qualifications</h3>
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">G.C.E. O/L Results</h4>
                  {selectedStudent.ol_results && selectedStudent.ol_results.length > 0 ? (
                    <div className="space-y-2">
                      {selectedStudent.ol_results.map((result, index) => (
                        <div key={index} className="flex justify-between items-center bg-white p-2 rounded border">
                          <span className="text-xs sm:text-sm">{result.subject} - {result.grade} ({result.year})</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No O/L results recorded</p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">G.C.E. A/L Results</h4>
                  {selectedStudent.al_results && selectedStudent.al_results.length > 0 ? (
                    <div className="space-y-2">
                      {selectedStudent.al_results.map((result, index) => (
                        <div key={index} className="flex justify-between items-center bg-white p-2 rounded border">
                          <span className="text-xs sm:text-sm">{result.subject} - {result.grade} ({result.year})</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No A/L results recorded</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Training Details</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center">
                    <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedStudent.training_received
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedStudent.training_received ? 'Trained' : 'Not Trained'}
                    </div>
                  </div>
                  
                  {selectedStudent.training_received && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Training Provider</label>
                        <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.training_provider || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Course/Vocation Name</label>
                        <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.course_vocation_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Duration</label>
                        <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.training_duration || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Nature of Training</label>
                        <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.training_nature || 'Initial'}</p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Training Establishment</label>
                        <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.training_establishment || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Placement Preference</label>
                        <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.training_placement_preference || '1st'}</p>
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Student Data Entry</h1>
            <p className="text-gray-600 text-sm sm:text-base">Manage student records and information</p>
            {userDistrict && (
              <div className="flex items-center mt-1 text-xs sm:text-sm text-green-600">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span>District: {userDistrict}</span>
              </div>
            )}
          </div>
          <div className="flex space-x-2 sm:space-x-3">
            <button 
              onClick={() => setShowForm(true)}
              className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition transform hover:scale-105 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Add Student</span>
            </button>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto mx-2">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    {editingStudent ? 'Edit Student' : 'Add New Student'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <RegistrationFormatInfo />
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="mb-4">
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
                        <label htmlFor="auto-generate" className="block text-sm font-medium text-gray-700">
                          Auto-generate Registration Number
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 ml-7">
                        Registration number will be automatically generated based on district, course, batch, and enrollment date
                      </p>
                    </div>
                    
                    <div>
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
                        <label htmlFor="manual-edit" className="block text-sm font-medium text-gray-700">
                          Edit Registration Number Manually
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 ml-7">
                        You can manually set each component of the registration number
                      </p>
                    </div>
                  </div>
                  
                  {manualRegNo ? (
                    <ManualRegistrationSection />
                  ) : (
                    <RegistrationPreviewSection />
                  )}
                  
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-green-300 transition-all duration-200">
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          Full Name (English) *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.full_name_english || ''}
                          onChange={(e) => setFormData({ ...formData, full_name_english: e.target.value })}
                          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 hover:border-green-400 transition text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          Full Name (Sinhala/Tamil) *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.full_name_sinhala || ''}
                          onChange={(e) => setFormData({ ...formData, full_name_sinhala: e.target.value })}
                          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 hover:border-green-400 transition text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          Name with Initials *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name_with_initials || ''}
                          onChange={(e) => setFormData({ ...formData, name_with_initials: e.target.value })}
                          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 hover:border-green-400 transition text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          Gender *
                        </label>
                        <select
                          value={formData.gender || 'Male'}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            gender: e.target.value as 'Male' | 'Female' | 'Other'
                          })}
                          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 hover:border-green-400 transition text-xs sm:text-sm"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          Date of Birth *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.date_of_birth || ''}
                          onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 hover:border-green-400 transition text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          NIC/ID Card No. *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.nic_id || ''}
                          onChange={(e) => setFormData({ ...formData, nic_id: e.target.value })}
                          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 hover:border-green-400 transition text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-green-300 transition-all duration-200">
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Address Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          Address Line
                        </label>
                        <input
                          type="text"
                          value={formData.address_line || ''}
                          onChange={(e) => setFormData({ ...formData, address_line: e.target.value })}
                          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 hover:border-green-400 transition text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          District *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.district || ''}
                          onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                          readOnly={userRole === 'data_entry'}
                          className={`w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 hover:border-green-400 transition text-xs sm:text-sm ${
                            userRole === 'data_entry' ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                        />
                        {userRole === 'data_entry' && (
                          <p className="text-xs text-gray-500 mt-1">
                            District is automatically set to your assigned district
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          Divisional Secretariat
                        </label>
                        <input
                          type="text"
                          value={formData.divisional_secretariat || ''}
                          onChange={(e) => setFormData({ ...formData, divisional_secretariat: e.target.value })}
                          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 hover:border-green-400 transition text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          Grama Niladhari Division
                        </label>
                        <input
                          type="text"
                          value={formData.grama_niladhari_division || ''}
                          onChange={(e) => setFormData({ ...formData, grama_niladhari_division: e.target.value })}
                          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 hover:border-green-400 transition text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          Village
                        </label>
                        <input
                          type="text"
                          value={formData.village || ''}
                          onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 hover:border-green-400 transition text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          Residence Type
                        </label>
                        <input
                          type="text"
                          value={formData.residence_type || ''}
                          onChange={(e) => setFormData({ ...formData, residence_type: e.target.value })}
                          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 hover:border-green-400 transition text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-green-300 transition-all duration-200">
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          Mobile No. *
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.mobile_no || ''}
                          onChange={(e) => setFormData({ ...formData, mobile_no: e.target.value })}
                          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 hover:border-green-400 transition text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 hover:border-green-400 transition text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <CenterAndCourseSection />

                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-green-300 transition-all duration-200">
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Educational Qualifications</h3>
                    
                    <div className="mb-4 sm:mb-6">
                      <h4 className="font-medium text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">G.C.E. O/L Results</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2 sm:mb-3">
                        <input
                          type="text"
                          placeholder="Subject"
                          value={newOlSubject}
                          onChange={(e) => setNewOlSubject(e.target.value)}
                          className="px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-xs sm:text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Grade"
                          value={newOlGrade}
                          onChange={(e) => setNewOlGrade(e.target.value)}
                          className="px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-xs sm:text-sm"
                        />
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            placeholder="Year"
                            value={newOlYear}
                            onChange={(e) => setNewOlYear(e.target.value)}
                            className="flex-1 px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-xs sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={addOlResult}
                            className="bg-green-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-md hover:bg-green-700 transition text-xs sm:text-sm"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {(formData.ol_results || []).map((result, index) => (
                          <div key={index} className="flex justify-between items-center bg-white p-2 rounded border hover:bg-green-50 transition">
                            <span className="text-xs sm:text-sm">{result.subject} - {result.grade} ({result.year})</span>
                            <button
                              type="button"
                              onClick={() => removeOlResult(index)}
                              className="text-red-600 hover:text-red-800 transition"
                            >
                              <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">G.C.E. A/L Results</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2 sm:mb-3">
                        <input
                          type="text"
                          placeholder="Subject"
                          value={newAlSubject}
                          onChange={(e) => setNewAlSubject(e.target.value)}
                          className="px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-xs sm:text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Grade"
                          value={newAlGrade}
                          onChange={(e) => setNewAlGrade(e.target.value)}
                          className="px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-xs sm:text-sm"
                        />
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            placeholder="Year"
                            value={newAlYear}
                            onChange={(e) => setNewAlYear(e.target.value)}
                            className="flex-1 px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-xs sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={addAlResult}
                            className="bg-green-600 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-md hover:bg-green-700 transition text-xs sm:text-sm"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {(formData.al_results || []).map((result, index) => (
                          <div key={index} className="flex justify-between items-center bg-white p-2 rounded border hover:bg-green-50 transition">
                            <span className="text-xs sm:text-sm">{result.subject} - {result.grade} ({result.year})</span>
                            <button
                              type="button"
                              onClick={() => removeAlResult(index)}
                              className="text-red-600 hover:text-red-800 transition"
                            >
                              <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-green-300 transition-all duration-200">
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Training Details</h3>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.training_received || false}
                          onChange={(e) => setFormData({ ...formData, training_received: e.target.checked })}
                          className="mr-2"
                        />
                        <label className="text-xs sm:text-sm font-medium text-gray-700">
                          Training Received
                        </label>
                      </div>
                      
                      {(formData.training_received) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                              Training Provider
                            </label>
                            <input
                              type="text"
                              value={formData.training_provider || ''}
                              onChange={(e) => setFormData({ ...formData, training_provider: e.target.value })}
                              className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 hover:border-green-400 transition text-xs sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                              Course/Vocation Name
                            </label>
                            <input
                              type="text"
                              value={formData.course_vocation_name || ''}
                              onChange={(e) => setFormData({ ...formData, course_vocation_name: e.target.value })}
                              className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 hover:border-green-400 transition text-xs sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                              Duration
                            </label>
                            <input
                              type="text"
                              value={formData.training_duration || ''}
                              onChange={(e) => setFormData({ ...formData, training_duration: e.target.value })}
                              className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 hover:border-green-400 transition text-xs sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                              Nature of Training
                            </label>
                            <select
                              value={formData.training_nature || 'Initial'}
                              onChange={(e) => setFormData({ ...formData, training_nature: e.target.value as any })}
                              className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 hover:border-green-400 transition text-xs sm:text-sm"
                            >
                              <option value="Initial">Initial</option>
                              <option value="Further">Further</option>
                              <option value="Re-training">Re-training</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                              Training Establishment
                            </label>
                            <input
                              type="text"
                              value={formData.training_establishment || ''}
                              onChange={(e) => setFormData({ ...formData, training_establishment: e.target.value })}
                              className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 hover:border-green-400 transition text-xs sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                              Placement Preference
                            </label>
                            <select
                              value={formData.training_placement_preference || '1st'}
                              onChange={(e) => setFormData({ ...formData, training_placement_preference: e.target.value as any })}
                              className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 hover:border-green-400 transition text-xs sm:text-sm"
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

                  <div className="flex justify-end space-x-2 sm:space-x-3 pt-3 sm:pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        resetForm();
                      }}
                      className="px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition text-xs sm:text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-green-700 transition flex items-center space-x-2 disabled:opacity-50 transform hover:scale-105 text-xs sm:text-sm"
                    >
                      <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{loading ? 'Saving...' : (editingStudent ? 'Update' : 'Save')}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showDetails && <StudentDetailsModal />}

        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4 sm:mb-6 border border-gray-200 hover:shadow-lg transition">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-2.5 sm:top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search students by name, NIC, initials, district, center, course, or registration no..."
                className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-1 sm:focus:ring-2 focus:ring-green-500 focus:border-transparent hover:border-green-400 transition text-xs sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="flex items-center space-x-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-xs sm:text-sm">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        <div className="mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" />
            Recent Records
          </h2>
          <div className="grid md:grid-cols-3 gap-3 sm:gap-4">
            {recentStudents.map((student) => (
              <div
                key={student.id}
                className="bg-white shadow-sm rounded-lg p-3 sm:p-4 flex items-center justify-between hover:shadow-md transition cursor-pointer transform hover:scale-105"
                onClick={() => handleViewDetails(student)}
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm sm:text-base">{student.full_name_english}</p>
                    <p className="text-green-600 font-bold text-xs sm:text-sm">{student.registration_no}</p>
                    <p className="text-xs text-gray-400">{student.nic_id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    student.training_received ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {student.training_received ? 'Trained' : 'Not Trained'}
                  </span>
                  {student.enrollment_status && (
                    <span className={`block text-xs px-2 py-1 rounded-full mt-1 ${
                      student.enrollment_status === 'Enrolled' ? 'bg-green-100 text-green-800' :
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

        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition">
          <div className="md:hidden p-3 sm:p-4">
            {filteredStudents.map((student) => (
              <MobileStudentCard
                key={student.id}
                student={student}
                onViewDetails={handleViewDetails}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
            
            {filteredStudents.length === 0 && (
              <div className="text-center text-gray-500 py-6 text-sm">
                {loading ? 'Loading...' : 'No student records found.'}
              </div>
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration & Student Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration Components
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Center & Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Education
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Training & Application
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <User className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-green-600">{student.registration_no}</div>
                          <div className="text-sm font-medium text-gray-900">{student.full_name_english}</div>
                          <div className="text-xs text-gray-500">{student.name_with_initials}</div>
                          <div className="text-xs text-gray-400">NIC: {student.nic_id}</div>
                          <div className="text-xs text-gray-400">Gender: {student.gender} | DOB: {student.date_of_birth}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex space-x-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {student.district_code || 'N/A'}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            {student.course_code || 'GEN'}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            {student.batch_display || student.batch_code || 'N/A'}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            #{student.student_number || 'N/A'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Year: {student.registration_year || new Date().getFullYear()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {student.center_name || 'No Center'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {student.course_name || 'No Course'}
                        {student.course_code_display && ` (${student.course_code_display})`}
                      </div>
                      {student.enrollment_status && (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                          student.enrollment_status === 'Enrolled' ? 'bg-green-100 text-green-800' :
                          student.enrollment_status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                          student.enrollment_status === 'Dropped' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
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
                      <div className="text-sm text-gray-900">{student.district}</div>
                      <div className="text-xs text-gray-500">{student.divisional_secretariat}</div>
                      <div className="text-xs text-gray-400">{student.village}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        O/L: {student.ol_results?.length || 0} subjects
                      </div>
                      <div className="text-sm text-gray-900">
                        A/L: {student.al_results?.length || 0} subjects
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="mb-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          student.training_received
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {student.training_received ? (
                            <>
                              <span>Trained</span>
                              <div className="text-xs ml-1">({student.course_vocation_name})</div>
                            </>
                          ) : (
                            'Not Trained'
                          )}
                        </span>
                      </div>
                      {student.training_received && (
                        <div className="text-xs text-gray-500 mb-1">
                          {student.training_provider} • {student.training_duration}
                        </div>
                      )}
                      <div className="text-xs text-gray-400">
                        Applied: {student.date_of_application}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewDetails(student)}
                          className="text-blue-600 hover:text-blue-900 transition transform hover:scale-110"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEdit(student)}
                          className="text-green-600 hover:text-green-900 transition transform hover:scale-110"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => student.id && handleDelete(student.id)}
                          className="text-red-600 hover:text-red-900 transition transform hover:scale-110"
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
                    <td colSpan={8} className="text-center text-gray-500 py-6">
                      {loading ? 'Loading...' : 'No student records found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataEntryStudents;