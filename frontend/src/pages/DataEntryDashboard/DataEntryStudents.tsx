import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, User, Clock, Save, X, Eye, MapPin, Building, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  type StudentType, 
  type EducationalQualificationType,
  type Center,
  type CourseType,
  fetchStudents, 
  createStudent, 
  updateStudent, 
  deleteStudent,
  fetchCentersForStudent,
  fetchCoursesForStudent,
  getUserDistrict,
  getUserRole,
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
      {/* Student Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-green-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-gray-900 text-sm break-words">{student.full_name_english}</h3>
            <p className="text-gray-500 text-xs mt-1 break-words">{student.registration_no}</p>
            <p className="text-gray-500 text-xs">NIC: {student.nic_id}</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-2 p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick Info */}
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

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
          {/* Contact & Center Info */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Mobile:</span>
              <span className="font-medium">{student.mobile_no}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Center:</span>
              <span className="font-medium text-right">{student.center_name || 'No Center'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Course:</span>
              <span className="font-medium text-right">{student.course_name || 'No Course'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">District:</span>
              <span className="font-medium">{student.district}</span>
            </div>
          </div>

          {/* Education Summary */}
          <div className="bg-gray-50 rounded p-2">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <div className="text-xs font-bold text-gray-900">{student.ol_results.length}</div>
                <div className="text-[10px] text-gray-600">O/L Subjects</div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">{student.al_results.length}</div>
                <div className="text-[10px] text-gray-600">A/L Subjects</div>
              </div>
            </div>
          </div>

          {/* Actions */}
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

const StudentDataEntry: React.FC = () => {
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
    enrollment_date: new Date().toISOString().split('T')[0],
    enrollment_status: 'Pending',
    registration_no: '',
    date_of_application: new Date().toISOString().split('T')[0],
  });

  const [newOlSubject, setNewOlSubject] = useState('');
  const [newOlGrade, setNewOlGrade] = useState('');
  const [newOlYear, setNewOlYear] = useState('');
  const [newAlSubject, setNewAlSubject] = useState('');
  const [newAlGrade, setNewAlGrade] = useState('');
  const [newAlYear, setNewAlYear] = useState('');

  // Load user info and data
  useEffect(() => {
    const loadUserInfo = () => {
      setUserDistrict(getUserDistrict());
      setUserRole(getUserRole());
      
      // Auto-set district for data entry officers in form
      if (getUserRole() === 'data_entry' && getUserDistrict()) {
        setFormData(prev => ({
          ...prev,
          district: getUserDistrict()
        }));
      }
    };

    loadUserInfo();
    loadStudents();
    loadCenters();
  }, []);

  // Fetch students from backend
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

  // Load centers for dropdown
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

  // Load courses based on selected center
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
      if (editingStudent && editingStudent.id) {
        // Update existing student
        const updatedStudent = await updateStudent(editingStudent.id, formData);
        setStudents(students.map(student => 
          student.id === editingStudent.id ? updatedStudent : student
        ));
      } else {
        // Add new student
        const newStudent = await createStudent(formData);
        setStudents([...students, newStudent]);
      }

      resetForm();
      setShowForm(false);
      setEditingStudent(null);
    } catch (error: any) {
      console.error('Error saving student:', error);
      alert(error.response?.data?.detail || 'Error saving student. Please try again.');
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
    });
    setEditingStudent(student);
    setShowForm(true);
  };

  const handleViewDetails = (student: StudentType) => {
    setSelectedStudent(student);
    setShowDetails(true);
  };

  const resetForm = () => {
    setFormData({
      full_name_english: '',
      full_name_sinhala: '',
      name_with_initials: '',
      gender: 'Male',
      date_of_birth: '',
      nic_id: '',
      address_line: '',
      district: userRole === 'data_entry' ? getUserDistrict() : '',
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
      enrollment_date: new Date().toISOString().split('T')[0],
      enrollment_status: 'Pending',
      registration_no: '',
      date_of_application: new Date().toISOString().split('T')[0],
    });
    setEditingStudent(null);
    setCourses([]);
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

  // Center and Course Selection Component
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
                course: null // Reset course when center changes
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
            Enrollment Date
          </label>
          <input
            type="date"
            value={formData.enrollment_date || ''}
            onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
            className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 hover:border-green-400 transition text-xs sm:text-sm"
          />
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header with District Info */}
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

        {/* Student Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-2">
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
                  {/* Personal Information */}
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
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
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

                  {/* Address Information */}
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
                          District {userRole === 'data_entry' && '(Auto-set)'}
                        </label>
                        <input
                          type="text"
                          value={formData.district || ''}
                          onChange={(e) => {
                            if (userRole !== 'data_entry') {
                              setFormData({ ...formData, district: e.target.value })
                            }
                          }}
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

                  {/* Contact Information */}
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

                  {/* Center and Course Section */}
                  <CenterAndCourseSection />

                  {/* Application Information */}
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-green-300 transition-all duration-200">
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Application Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          Registration No. *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.registration_no || ''}
                          onChange={(e) => setFormData({ ...formData, registration_no: e.target.value })}
                          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 hover:border-green-400 transition text-xs sm:text-sm"
                          placeholder="Auto-generated if left empty"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Leave empty to auto-generate registration number
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          Date of Application *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.date_of_application || ''}
                          onChange={(e) => setFormData({ ...formData, date_of_application: e.target.value })}
                          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-green-500 hover:border-green-400 transition text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Educational Qualifications */}
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-green-300 transition-all duration-200">
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Educational Qualifications</h3>
                    
                    {/* O/L Results */}
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

                    {/* A/L Results */}
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

                  {/* Training Details */}
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

        {/* Student Details Modal */}
        {showDetails && selectedStudent && (
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
                  {/* Application Information */}
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Application Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Registration No.</label>
                        <p className="text-base sm:text-lg font-bold text-green-600">{selectedStudent.registration_no}</p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date of Application</label>
                        <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.date_of_application}</p>
                      </div>
                    </div>
                  </div>

                  {/* Personal Information */}
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

                  {/* Center & Course Information */}
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800 flex items-center">
                      <Building className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" />
                      Center & Course Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Training Center</label>
                        <p className="text-gray-900 text-sm sm:text-base">
                          {selectedStudent.center_name || 'Not assigned'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Course</label>
                        <p className="text-gray-900 text-sm sm:text-base">
                          {selectedStudent.course_name || 'Not assigned'}
                          {selectedStudent.course_code && ` (${selectedStudent.course_code})`}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Enrollment Date</label>
                        <p className="text-gray-900 text-sm sm:text-base">
                          {selectedStudent.enrollment_date || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Enrollment Status</label>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedStudent.enrollment_status === 'Enrolled' ? 'bg-green-100 text-green-800' :
                          selectedStudent.enrollment_status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                          selectedStudent.enrollment_status === 'Dropped' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedStudent.enrollment_status || 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Address Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address Line</label>
                        <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.address_line}</p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">District</label>
                        <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.district}</p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Divisional Secretariat</label>
                        <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.divisional_secretariat}</p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Grama Niladhari Division</label>
                        <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.grama_niladhari_division}</p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Village</label>
                        <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.village}</p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Residence Type</label>
                        <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.residence_type}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Mobile No.</label>
                        <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.mobile_no}</p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label>
                        <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Educational Qualifications */}
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Educational Qualifications</h3>
                    
                    {/* O/L Results */}
                    <div className="mb-4 sm:mb-6">
                      <h4 className="font-medium text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">G.C.E. O/L Results</h4>
                      <div className="space-y-2">
                        {selectedStudent.ol_results.map((result, index) => (
                          <div key={index} className="flex justify-between items-center bg-white p-2 rounded border">
                            <span className="text-xs sm:text-sm">{result.subject} - {result.grade} ({result.year})</span>
                          </div>
                        ))}
                        {selectedStudent.ol_results.length === 0 && (
                          <p className="text-gray-500 text-xs sm:text-sm">No O/L results recorded</p>
                        )}
                      </div>
                    </div>

                    {/* A/L Results */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">G.C.E. A/L Results</h4>
                      <div className="space-y-2">
                        {selectedStudent.al_results.map((result, index) => (
                          <div key={index} className="flex justify-between items-center bg-white p-2 rounded border">
                            <span className="text-xs sm:text-sm">{result.subject} - {result.grade} ({result.year})</span>
                          </div>
                        ))}
                        {selectedStudent.al_results.length === 0 && (
                          <p className="text-gray-500 text-xs sm:text-sm">No A/L results recorded</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Training Details */}
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Training Details</h3>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center">
                        <label className="text-xs sm:text-sm font-medium text-gray-700 mr-2">Training Received:</label>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedStudent.training_received ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedStudent.training_received ? 'Yes' : 'No'}
                        </span>
                      </div>
                      
                      {selectedStudent.training_received && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Training Provider</label>
                            <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.training_provider}</p>
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Course/Vocation Name</label>
                            <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.course_vocation_name}</p>
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Duration</label>
                            <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.training_duration}</p>
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Nature of Training</label>
                            <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.training_nature}</p>
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Training Establishment</label>
                            <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.training_establishment}</p>
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Placement Preference</label>
                            <p className="text-gray-900 text-sm sm:text-base">{selectedStudent.training_placement_preference} Preference</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
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

        {/* Recent Records */}
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
                    <p className="text-xs sm:text-sm text-gray-500">{student.registration_no}</p>
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

        {/* Students List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition">
          {/* Mobile View - Cards */}
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

          {/* Desktop View - Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration & Student Info
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
                      <div className="text-sm font-medium text-gray-900">
                        {student.center_name || 'No Center'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {student.course_name || 'No Course'}
                        {student.course_code && ` (${student.course_code})`}
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
                        O/L: {student.ol_results.length} subjects
                      </div>
                      <div className="text-sm text-gray-900">
                        A/L: {student.al_results.length} subjects
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
                    <td colSpan={7} className="text-center text-gray-500 py-6">
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

export default StudentDataEntry;