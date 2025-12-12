import React, { useState, useEffect } from 'react';
import {
  Search,
  Users,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  IdCard,
  GraduationCap,
  RefreshCw,
  Eye,
} from 'lucide-react';
import {
  type StudentType,
  fetchStudents,
  fetchStudentStats,
  fetchCenters,
  fetchCourses,
  fetchAvailableBatches,
  type Center,
  type CourseType,
  getUserRole,
  getUserDistrict
} from '../../api/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface FilterState {
  district: string;
  enrollment_status: string;
  training_received: string;
  center: string;
  course: string;
  batch: string;
}

// Helper functions defined outside component
const getStatusColor = (status?: string) => {
  switch (status) {
    case 'Enrolled':
      return 'bg-blue-100 text-blue-800';
    case 'Completed':
      return 'bg-green-100 text-green-800';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'Dropped':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'MMM dd, yyyy');
  } catch {
    return dateString;
  }
};

// Mobile Student Card Component
interface MobileStudentCardProps {
  student: StudentType;
  isExpanded: boolean;
  onToggleExpand: (studentId: number) => void;
  onViewDetails: (student: StudentType) => void;
}

const MobileStudentCard: React.FC<MobileStudentCardProps> = ({
  student,
  isExpanded,
  onToggleExpand,
  onViewDetails
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${student.profile_photo_url ? '' : 'bg-gradient-to-br from-blue-100 to-indigo-100'
            }`}>
            {student.profile_photo_url ? (
              <img
                src={student.profile_photo_url}
                alt={student.full_name_english}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-blue-100', 'to-indigo-100');
                }}
              />
            ) : (
              <User className="w-6 h-6 text-blue-700" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 text-sm break-words">{student.full_name_english}</h3>
            <p className="text-blue-600 font-bold text-xs mt-1 break-words">{student.registration_no}</p>
            <p className="text-gray-500 text-xs">NIC: {student.nic_id}</p>
            <div className="flex items-center mt-1">
              <span className="text-gray-500 text-xs">{student.district}</span>
              <span className="mx-1">•</span>
              <span className="text-gray-500 text-xs">{student.gender}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => onToggleExpand(student.id!)}
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
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
            <div className="text-xs font-semibold text-gray-700 mb-2">Registration Details:</div>
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
              <span className="text-gray-600">Mobile:</span>
              <span className="font-medium">{student.mobile_no}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium text-right">{student.email || 'No email'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Center:</span>
              <span className="font-medium text-right">{student.center_name || 'No Center'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Course:</span>
              <span className="font-medium text-right">{student.course_name || 'No Course'}</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 border border-gray-100">
            <div className="text-xs font-semibold text-gray-700 mb-2">Education:</div>
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

          <button
            onClick={() => onViewDetails(student)}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-3 rounded-lg text-xs font-medium hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center space-x-2"
          >
            <Eye className="w-3 h-3" />
            <span>View Full Details</span>
          </button>
        </div>
      )}
    </div>
  );
};

const Students: React.FC = () => {
  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    district: 'All Districts',
    enrollment_status: 'All Status',
    training_received: 'All',
    center: 'All Centers',
    course: 'All Courses',
    batch: 'All Batches'
  });
  const [students, setStudents] = useState<StudentType[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [centers, setCenters] = useState<Center[]>([]);
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Get user role and district
  const userRole = getUserRole();
  const userDistrict = getUserDistrict();
  const isDistrictManager = userRole === 'district_manager';

  // Filter options
  const enrollmentStatuses = [
    'All Status',
    'Pending',
    'Enrolled',
    'Completed',
    'Dropped'
  ];

  const trainingStatuses = [
    'All',
    'Trained',
    'Not Trained'
  ];

  // Load initial data
  useEffect(() => {
    loadStudents();
    loadStats();
    loadFilterOptions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [students, searchTerm, filters]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      // For district managers, only fetch students from their district
      if (isDistrictManager && userDistrict) {
        const studentsData = await fetchStudents('', { district: userDistrict });
        setStudents(studentsData);
        setFilteredStudents(studentsData);
      } else {
        // For admins, fetch all students
        const studentsData = await fetchStudents();
        setStudents(studentsData);
        setFilteredStudents(studentsData);
      }

    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to load students';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // For district managers, get stats only for their district
      if (isDistrictManager && userDistrict) {
        const districtStudents = students.filter(s => s.district === userDistrict);

        const districtStats = {
          total_students: districtStudents.length,
          enrolled_students: districtStudents.filter(s => s.enrollment_status === 'Enrolled').length,
          trained_students: districtStudents.filter(s => s.training_received).length,
          pending_students: districtStudents.filter(s => s.enrollment_status === 'Pending').length,
          completed_students: districtStudents.filter(s => s.enrollment_status === 'Completed').length,
        };

        setStats(districtStats);
      } else {
        const statsData = await fetchStudentStats();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadFilterOptions = async () => {
    try {
      // Load all centers from API
      const centersData = await fetchCenters();

      // For district managers, filter centers by their district
      if (isDistrictManager && userDistrict) {
        const districtCenters = centersData.filter(c => c.district === userDistrict);
        setCenters(districtCenters);
      } else {
        setCenters(centersData);
      }

      // Load all courses from API
      const coursesData = await fetchCourses();
      setCourses(coursesData);

      // Load batches from API
      const batchesData = await fetchAvailableBatches();
      setBatches(batchesData);

      // Extract districts based on user role
      let allDistricts: string[] = [];

      if (isDistrictManager && userDistrict) {
        // District managers only see their district
        allDistricts = [userDistrict];
      } else {
        // Admins see all districts
        const uniqueDistrictsFromCenters = centersData
          .map(c => c.district)
          .filter((district): district is string => district !== null && district !== undefined && district.trim() !== '');

        // Also get districts from students to ensure coverage
        const studentsData = await fetchStudents();
        const uniqueDistrictsFromStudents = studentsData
          .map(s => s.district)
          .filter((district): district is string => district !== null && district !== undefined && district.trim() !== '');

        // Combine and deduplicate districts
        allDistricts = Array.from(
          new Set([...uniqueDistrictsFromCenters, ...uniqueDistrictsFromStudents])
        ).sort();
      }

      setDistricts(allDistricts);

    } catch (error) {
      console.error('Failed to load filter options:', error);
      toast.error('Failed to load filter options');
    }
  };

  const applyFilters = () => {
    let filtered = [...students];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(student =>
        student.full_name_english?.toLowerCase().includes(term) ||
        student.name_with_initials?.toLowerCase().includes(term) ||
        student.nic_id?.toLowerCase().includes(term) ||
        student.registration_no?.toLowerCase().includes(term) ||
        student.email?.toLowerCase().includes(term) ||
        student.mobile_no?.toLowerCase().includes(term) ||
        student.district?.toLowerCase().includes(term) ||
        student.center_name?.toLowerCase().includes(term) ||
        student.course_name?.toLowerCase().includes(term)
      );
    }

    // Apply dropdown filters
    if (filters.district !== 'All Districts') {
      filtered = filtered.filter(student => student.district === filters.district);
    }

    if (filters.enrollment_status !== 'All Status') {
      filtered = filtered.filter(student => student.enrollment_status === filters.enrollment_status);
    }

    if (filters.training_received !== 'All') {
      const isTrained = filters.training_received === 'Trained';
      filtered = filtered.filter(student => student.training_received === isTrained);
    }

    if (filters.center !== 'All Centers') {
      filtered = filtered.filter(student => student.center_name === filters.center);
    }

    if (filters.course !== 'All Courses') {
      filtered = filtered.filter(student => student.course_name === filters.course);
    }

    if (filters.batch !== 'All Batches') {
      filtered = filtered.filter(student => student.batch_display === filters.batch);
    }

    setFilteredStudents(filtered);
  };

  // Toggle row expansion
  const toggleRowExpansion = (studentId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedRows(newExpanded);
  };

  // Handle view details
  const handleViewDetails = (student: StudentType) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  // Student Details Modal Component
  const StudentDetailsModal = () => {
    if (!selectedStudent) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Student Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                <div className={`w-24 h-24 rounded-full border-4 ${selectedStudent.profile_photo_url ? 'border-blue-300' : 'border-blue-200'
                  } overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mr-6 shadow-lg`}>
                  {selectedStudent.profile_photo_url ? (
                    <img
                      src={selectedStudent.profile_photo_url}
                      alt={selectedStudent.full_name_english}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-blue-100', 'to-indigo-100');
                      }}
                    />
                  ) : (
                    <User className="w-12 h-12 text-blue-700" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {selectedStudent.full_name_english}
                  </h1>
                  <p className="text-blue-600 font-bold text-lg mt-1">
                    {selectedStudent.registration_no}
                  </p>
                  <p className="text-gray-600 mt-2">{selectedStudent.name_with_initials}</p>
                  <div className="flex items-center mt-2 space-x-4">
                    <span className="text-gray-600">{selectedStudent.gender}</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-600">DOB: {formatDate(selectedStudent.date_of_birth)}</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-600">NIC: {selectedStudent.nic_id}</span>
                  </div>
                </div>
              </div>

              {/* Registration Information */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Registration Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <div className="mb-4">
                      <div className="text-xl font-bold text-blue-600 bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
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
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{formatDate(selectedStudent.date_of_application)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Date</label>
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{formatDate(selectedStudent.enrollment_date) || 'Not set'}</div>
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
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-xl border border-blue-200">

                <h3 className="text-lg font-semibold mb-4 text-gray-800">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (English)</label>
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.full_name_english}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (Sinhala/Tamil)</label>
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.full_name_sinhala || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name with Initials</label>
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.name_with_initials}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.marital_status || 'Single'}</div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.address_line || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
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

              {/* Center & Course Information */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Center & Course Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Training Center</label>
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.center_name || 'Not assigned'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                    <div className="text-gray-900 bg-white p-2 rounded border border-gray-200">{selectedStudent.course_name || 'Not assigned'}</div>
                  </div>
                </div>
              </div>

              {/* Educational Qualifications */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Educational Qualifications</h3>

                {/* O/L Results */}
                {selectedStudent.ol_results && selectedStudent.ol_results.length > 0 ? (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2 text-base">G.C.E. O/L Results ({selectedStudent.ol_results[0].year})</h4>
                    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedStudent.ol_results.map((result, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{result.subject}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${result.grade === 'A' ? 'bg-green-100 text-green-800' :
                                  result.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                    result.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                      result.grade === 'S' ? 'bg-gray-100 text-gray-800' :
                                        'bg-red-100 text-red-800'
                                  }`}>
                                  {result.grade}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 text-sm text-gray-500 bg-white p-3 rounded-lg border border-gray-200">No O/L results recorded</div>
                )}

                {/* A/L Results */}
                {selectedStudent.al_results && selectedStudent.al_results.length > 0 ? (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2 text-base">G.C.E. A/L Results ({selectedStudent.al_results[0].year})</h4>
                    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedStudent.al_results.map((result, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{result.subject}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${result.grade === 'A' ? 'bg-green-100 text-green-800' :
                                  result.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                    result.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                      result.grade === 'S' ? 'bg-gray-100 text-gray-800' :
                                        'bg-red-100 text-red-800'
                                  }`}>
                                  {result.grade}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 bg-white p-3 rounded-lg border border-gray-200">No A/L results recorded</div>
                )}
              </div>

              {/* Training Details */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200">
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div >
    );
  };

  if (loading && !students.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
          <div className="text-lg text-gray-600">Loading students...</div>
        </div>
      </div>
    );
  }

  if (error && !students.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <button
            onClick={loadStudents}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isDistrictManager ? `${userDistrict} District Students` : 'Student Management'}
              </h1>
              <p className="text-gray-600 mt-2">
                {isDistrictManager
                  ? `View and monitor students in ${userDistrict} district`
                  : 'View and monitor all registered students'
                }
              </p>
              {isDistrictManager && (
                <div className="mt-1 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
                  District Manager Access
                </div>
              )}
            </div>
            <button
              onClick={loadStudents}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.total_students || 0}</div>
                  <div className="text-sm text-gray-600">Total Students</div>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.enrolled_students || 0}</div>
                  <div className="text-sm text-gray-600">Enrolled</div>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-sky-500">{stats.trained_students || 0}</div>
                  <div className="text-sm text-gray-600">Trained</div>
                </div>
                <GraduationCap className="w-8 h-8 text-sky-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-amber-600">{stats.pending_students || 0}</div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
            </div>
          </div>
        )}

        {/* Search + Filters */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {districts.length > 1 ? (
              <select
                value={filters.district}
                onChange={(e) => setFilters({ ...filters, district: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All Districts">All Districts</option>
                {districts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            ) : districts.length === 1 ? (
              <div className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50">
                <div className="text-sm text-gray-900">{districts[0]}</div>
                <div className="text-xs text-gray-500">District</div>
              </div>
            ) : null}

            <select
              value={filters.enrollment_status}
              onChange={(e) => setFilters({ ...filters, enrollment_status: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {enrollmentStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={filters.training_received}
              onChange={(e) => setFilters({ ...filters, training_received: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {trainingStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Additional Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.center}
              onChange={(e) => setFilters({ ...filters, center: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All Centers">All Centers</option>
              {centers.map((center) => (
                <option key={center.id} value={center.name}>
                  {center.name}
                </option>
              ))}
            </select>

            <select
              value={filters.course}
              onChange={(e) => setFilters({ ...filters, course: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All Courses">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.name}>
                  {course.name}
                </option>
              ))}
            </select>

            <select
              value={filters.batch}
              onChange={(e) => setFilters({ ...filters, batch: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All Batches">All Batches</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.batch_name}>
                  {batch.batch_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {filteredStudents.length} of {students.length} students
            {isDistrictManager && (
              <span className="ml-2 text-blue-600">
                (in {userDistrict} district)
              </span>
            )}
          </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden">
          {filteredStudents.map((student) => (
            <MobileStudentCard
              key={student.id}
              student={student}
              isExpanded={expandedRows.has(student.id!)}
              onToggleExpand={toggleRowExpansion}
              onViewDetails={handleViewDetails}
            />
          ))}

          {filteredStudents.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-200">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {students.length === 0
                  ? 'No students available in the system.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Student Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Registration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Training
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>

                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <React.Fragment key={student.id}>
                    <tr
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden ${student.profile_photo_url ? '' : 'bg-gradient-to-br from-blue-100 to-indigo-100'
                            }`}>
                            {student.profile_photo_url ? (
                              <img
                                src={student.profile_photo_url}
                                alt={student.full_name_english}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-blue-100', 'to-indigo-100');
                                }}
                              />
                            ) : (
                              <User className="w-5 h-5 text-blue-700" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {student.full_name_english}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center space-x-2">
                              <IdCard className="w-3 h-3" />
                              <span>{student.nic_id}</span>
                              <span>•</span>
                              <span>{student.gender}</span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              DOB: {formatDate(student.date_of_birth)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {student.registration_no}
                          </div>
                          <div className="text-xs text-gray-500">
                            {student.district}
                          </div>
                          <div className="text-xs text-gray-400">
                            Batch: {student.batch_display || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-600">
                            {student.email || 'No email'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {student.mobile_no}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm">
                            {student.training_received ? (
                              <span className="inline-flex items-center text-green-600">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Trained
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-gray-500">
                                <XCircle className="w-4 h-4 mr-1" />
                                Not Trained
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {student.course_name || 'No course'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {student.center_name || 'No center'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.enrollment_status)}`}>
                            {student.enrollment_status || 'Unknown'}
                          </span>
                          <div className="text-xs text-gray-500">
                            Applied: {formatDate(student.date_of_application)}
                          </div>
                          {student.enrollment_date && (
                            <div className="text-xs text-gray-400">
                              Enrolled: {formatDate(student.enrollment_date)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDetails(student)}
                            className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>

                    {/* Expanded Row Details */}

                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* No Results Message for Desktop */}
        {filteredStudents.length === 0 && (
          <div className="hidden md:block text-center py-12 bg-white rounded-lg shadow-md border border-gray-200">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {students.length === 0
                ? 'No students available in the system.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {students.length === 0 && (
              <button
                onClick={loadStudents}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Refresh Data
              </button>
            )}
          </div>
        )}

        {/* Pagination (optional) */}
        {filteredStudents.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to{' '}
              <span className="font-medium">{filteredStudents.length}</span> of{' '}
              <span className="font-medium">{filteredStudents.length}</span> results
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                1
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {showDetailsModal && <StudentDetailsModal />}
    </div>
  );
};

export default Students;