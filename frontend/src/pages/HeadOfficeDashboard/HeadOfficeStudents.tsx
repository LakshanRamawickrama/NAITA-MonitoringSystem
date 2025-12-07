// src/pages/admin/AdminStudents.tsx - COMPLETE FIXED VERSION
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
  RefreshCw
} from 'lucide-react';
import { 
  type StudentType, 
  fetchStudents, 
  fetchStudentStats,
  fetchCenters,
  fetchCourses,
  fetchAvailableBatches,
  type Center,
  type CourseType
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

const AdminStudents: React.FC = () => {
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
      const studentsData = await fetchStudents();
      setStudents(studentsData);
      setFilteredStudents(studentsData);
      
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
      const statsData = await fetchStudentStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadFilterOptions = async () => {
    try {
      // Load all centers from API
      const centersData = await fetchCenters();
      setCenters(centersData);
      
      // Load all courses from API
      const coursesData = await fetchCourses();
      setCourses(coursesData);
      
      // Load batches from API
      const batchesData = await fetchAvailableBatches();
      setBatches(batchesData);
      
      // Extract districts from centers
      const uniqueDistrictsFromCenters = centersData
        .map(c => c.district)
        .filter((district): district is string => district !== null && district !== undefined && district.trim() !== '');
      
      // Also get districts from students to ensure coverage
      const studentsData = await fetchStudents();
      const uniqueDistrictsFromStudents = studentsData
        .map(s => s.district)
        .filter((district): district is string => district !== null && district !== undefined && district.trim() !== '');
      
      // Combine and deduplicate districts
      const allDistricts = Array.from(
        new Set([...uniqueDistrictsFromCenters, ...uniqueDistrictsFromStudents])
      ).sort();
      
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
        student.district?.toLowerCase().includes(term)
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
              <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
              <p className="text-gray-600 mt-2">View and monitor all registered students</p>
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
            
            <select
              value={filters.district}
              onChange={(e) => setFilters({...filters, district: e.target.value})}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All Districts">All Districts</option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>

            <select
              value={filters.enrollment_status}
              onChange={(e) => setFilters({...filters, enrollment_status: e.target.value})}
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
              onChange={(e) => setFilters({...filters, training_received: e.target.value})}
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
              onChange={(e) => setFilters({...filters, center: e.target.value})}
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
              onChange={(e) => setFilters({...filters, course: e.target.value})}
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
              onChange={(e) => setFilters({...filters, batch: e.target.value})}
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
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
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
                  <th className="w-8 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <React.Fragment key={student.id}>
                    <tr 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => toggleRowExpansion(student.id!)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-700" />
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
                      <td className="px-4 py-4">
                        <div className="text-gray-400 hover:text-gray-600">
                          {expandedRows.has(student.id!) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Row Details */}
                    {expandedRows.has(student.id!) && (
                      <tr>
                        <td colSpan={6} className="bg-blue-50 px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Personal Information */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Personal Information</h4>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="text-gray-500">Name in Sinhala:</span>
                                  <span className="ml-2 text-gray-900">{student.full_name_sinhala || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Name with Initials:</span>
                                  <span className="ml-2 text-gray-900">{student.name_with_initials}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Address:</span>
                                  <span className="ml-2 text-gray-900">{student.address_line || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Educational Qualifications */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Education</h4>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="text-gray-500">O/L Results:</span>
                                  <span className="ml-2 text-gray-900">
                                    {student.ol_results?.length || 0} subjects
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">A/L Results:</span>
                                  <span className="ml-2 text-gray-900">
                                    {student.al_results?.length || 0} subjects
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Training Nature:</span>
                                  <span className="ml-2 text-gray-900">{student.training_nature}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Additional Information */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Additional Information</h4>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="text-gray-500">Training Provider:</span>
                                  <span className="ml-2 text-gray-900">{student.training_provider || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Training Duration:</span>
                                  <span className="ml-2 text-gray-900">{student.training_duration || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Placement Preference:</span>
                                  <span className="ml-2 text-gray-900">{student.training_placement_preference}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* No Results Message */}
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
    </div>
  );
};

export default AdminStudents;