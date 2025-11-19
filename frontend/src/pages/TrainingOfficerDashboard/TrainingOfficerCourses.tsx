// TrainingOfficerCourses.tsx - Complete updated version
import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Eye, Edit, Trash2, BookOpen, X, MapPin, Loader2, Users, User, AlertCircle } from 'lucide-react';
import { type CourseType, fetchCourses, createCourse, deleteCourse, fetchInstructors, fetchUsers } from '../../api/api';
import { fetchCenters } from '../../api/api';
import toast from 'react-hot-toast';

// Mock instructors data as fallback
const mockInstructors = [
  {
    id: 1,
    username: 'instructor_matara',
    email: 'instructor.matara@naita.lk',
    first_name: 'John',
    last_name: 'Silva',
    role: 'instructor',
    district: 'Matara',
    center: { id: 1, name: 'Matara Vocational Center', district: 'Matara' },
    is_active: true,
    is_staff: false,
    last_login: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    username: 'instructor_colombo',
    email: 'instructor.colombo@naita.lk',
    first_name: 'Sarah',
    last_name: 'Perera',
    role: 'instructor',
    district: 'Colombo',
    center: { id: 2, name: 'Colombo Main Center', district: 'Colombo' },
    is_active: true,
    is_staff: false,
    last_login: '2024-01-14T14:20:00Z'
  },
  {
    id: 3,
    username: 'instructor_gampaha',
    email: 'instructor.gampaha@naita.lk',
    first_name: 'Kamal',
    last_name: 'Fernando',
    role: 'instructor',
    district: 'Gampaha',
    center: { id: 3, name: 'Gampaha Training Center', district: 'Gampaha' },
    is_active: true,
    is_staff: false,
    last_login: '2024-01-13T09:15:00Z'
  },
];

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (courseData: Partial<CourseType>) => Promise<void>;
  districts: string[];
  instructors: any[];
  submitting: boolean;
  userDistrict?: string;
  instructorsError?: boolean;
}

const AddCourseModal: React.FC<AddCourseModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  districts, 
  instructors,
  submitting,
  userDistrict,
  instructorsError 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    duration: '',
    description: '',
    district: userDistrict || '',
    instructor: '',
    students: '0'
  });

  // Filter instructors by selected district
  const filteredInstructors = instructors.filter(instructor => 
    instructor.district === formData.district
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim() || !formData.code.trim() || !formData.district.trim()) {
      toast.error('Please fill in all required fields (Name, Code, and District)');
      return;
    }

    try {
      const courseToSave = {
        ...formData,
        students: parseInt(formData.students) || 0,
        instructor: formData.instructor ? parseInt(formData.instructor) : null,
      };
      await onSave(courseToSave);
      setFormData({ 
        name: '', 
        code: '', 
        category: '', 
        duration: '', 
        description: '', 
        district: userDistrict || '',
        instructor: '',
        students: '0'
      });
      onClose();
    } catch (error) {
      console.error('Error saving course:', error);
    }
  };

  // Reset form when modal closes and auto-fill district
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ 
        ...prev, 
        district: userDistrict || prev.district,
        instructor: '' // Reset instructor when district changes
      }));
    } else {
      setFormData({ 
        name: '', 
        code: '', 
        category: '', 
        duration: '', 
        description: '', 
        district: userDistrict || '',
        instructor: '',
        students: '0'
      });
    }
  }, [isOpen, userDistrict]);

  // Reset instructor selection when district changes
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        instructor: '' // Clear instructor when district changes
      }));
    }
  }, [formData.district, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative max-h-screen overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Course</h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Web Development Fundamentals"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="WD101"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select Category</option>
              <option value="Web Development">Web Development</option>
              <option value="Mobile Development">Mobile Development</option>
              <option value="Data Science">Data Science</option>
              <option value="Programming">Programming</option>
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Business">Business</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration
            </label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select Duration</option>
              <option value="3 months">3 months</option>
              <option value="4 months">4 months</option>
              <option value="5 months">5 months</option>
              <option value="6 months">6 months</option>
              <option value="1 year">1 year</option>
              <option value="2 years">2 years</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users className="w-4 h-4 inline mr-1" />
              Student Count
            </label>
            <input
              type="number"
              min="0"
              value={formData.students}
              onChange={(e) => setFormData({ ...formData, students: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="w-4 h-4 inline mr-1" />
              Instructor {formData.district && (
                <span className="text-xs text-gray-500 ml-1">
                  (in {formData.district})
                </span>
              )}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
                disabled={!formData.district || instructorsError}
              >
                <option value="">
                  {instructorsError ? 'Unable to load instructors' : 
                   formData.district ? 'Select Instructor' : 'Select district first'}
                </option>
                {filteredInstructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.first_name} {instructor.last_name} 
                    {instructor.email && ` (${instructor.email})`}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            {instructorsError && (
              <p className="text-sm text-yellow-600 mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                Using demo instructor data. Contact admin for real instructor access.
              </p>
            )}
            {formData.district && filteredInstructors.length === 0 && !instructorsError && (
              <p className="text-sm text-yellow-600 mt-1">
                No instructors found in {formData.district} district
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              District <span className="text-red-500">*</span>
              {userDistrict && <span className="text-green-600 ml-2">(Auto-filled)</span>}
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                required
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
                disabled={!!userDistrict}
              >
                <option value="">Select District</option>
                {districts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            {userDistrict && (
              <p className="text-sm text-green-600 mt-1">
                Your assigned district: <strong>{userDistrict}</strong>
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="Enter course description, objectives, and requirements..."
            />
          </div>

          <div className="md:col-span-2 flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm disabled:opacity-70 flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Course</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TrainingOfficerCourses: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [centersLoading, setCentersLoading] = useState(true);
  const [instructorsLoading, setInstructorsLoading] = useState(true);
  const [instructorsError, setInstructorsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get user info
  const userRole = localStorage.getItem("user_role") || "";
  const userDistrict = localStorage.getItem("user_district") || "";
  const isTrainingOfficer = userRole === 'training_officer';

  useEffect(() => {
    loadCourses();
    loadCenters();
    loadInstructors();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const coursesData = await fetchCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const loadCenters = async () => {
    try {
      setCentersLoading(true);
      const centersData = await fetchCenters();
      
      // Extract unique districts from centers
      const uniqueDistricts = Array.from(
        new Set(centersData.map(center => center.district).filter(Boolean))
      ) as string[];
      setDistricts(uniqueDistricts.sort());
    } catch (error) {
      console.error('Error loading centers:', error);
      // If centers fail to load, provide some default districts
      const defaultDistricts = ['Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Galle', 'Matara'];
      setDistricts(defaultDistricts);
      toast.error('Failed to load districts from centers, using default districts');
    } finally {
      setCentersLoading(false);
    }
  };

  const loadInstructors = async () => {
    try {
      setInstructorsLoading(true);
      setInstructorsError(false);
      
      // Try the dedicated instructors endpoint first
      try {
        console.log('Fetching instructors from dedicated endpoint...');
        const instructorsData = await fetchInstructors();
        console.log('Instructors loaded:', instructorsData);
        setInstructors(instructorsData);
      } catch (error) {
        console.error('Error loading from instructors endpoint, trying users endpoint:', error);
        // Fallback to users endpoint
        try {
          console.log('Trying users endpoint as fallback...');
          const usersData = await fetchUsers();
          // Filter only instructors who have districts
          const instructorsData = usersData.filter(user => 
            user.role === 'instructor' && user.district
          );
          console.log('Instructors from users endpoint:', instructorsData);
          setInstructors(instructorsData);
        } catch (fallbackError) {
          console.error('Error loading instructors from users endpoint:', fallbackError);
          setInstructorsError(true);
          // Use mock data as final fallback
          console.log('Using mock instructor data as fallback');
          setInstructors(mockInstructors);
          toast.error('Using demo instructor data. Real instructors unavailable.');
        }
      }
    } catch (error) {
      console.error('Error in loadInstructors:', error);
      setInstructorsError(true);
      setInstructors(mockInstructors);
    } finally {
      setInstructorsLoading(false);
    }
  };

  const handleAddCourse = async (courseData: Partial<CourseType>) => {
    setSubmitting(true);
    try {
      const courseToCreate = {
        ...courseData,
        progress: 0,
        status: 'Pending' as const,
      };
      await createCourse(courseToCreate);
      await loadCourses();
      toast.success('Course created successfully!');
    } catch (error: any) {
      console.error('Error creating course:', error);
      const errorMessage = error.response?.data?.name?.[0] || error.response?.data?.detail || 'Failed to create course';
      toast.error(errorMessage);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        setActionLoading(id);
        await deleteCourse(id);
        await loadCourses();
        toast.success('Course deleted successfully!');
      } catch (error) {
        console.error('Error deleting course:', error);
        toast.error('Failed to delete course');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.category && course.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isLoading = loading || centersLoading || instructorsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          <span className="text-gray-600">Loading courses...</span>
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
              <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
              <p className="text-gray-600 mt-2">Add and manage courses pending approval</p>
              {isTrainingOfficer && userDistrict && (
                <p className="text-sm text-green-600 mt-1">
                  Managing courses in: <strong>{userDistrict}</strong> district
                </p>
              )}
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              disabled={centersLoading || instructorsLoading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>Add Course</span>
            </button>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search courses, codes, or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Courses Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Instructor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Students
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
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-green-700" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{course.name}</div>
                        {course.category && (
                          <div className="text-xs text-gray-500">{course.category}</div>
                        )}
                        <div className="text-xs text-gray-400 flex items-center mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          {course.district}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                      {course.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {course.duration || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {course.instructor_details 
                        ? `${course.instructor_details.first_name} ${course.instructor_details.last_name}`
                        : 'Not assigned'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1 text-gray-400" />
                        {course.students}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          course.status === 'Approved'
                            ? 'bg-green-100 text-green-800'
                            : course.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : course.status === 'Active'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {course.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button className="text-blue-600 hover:text-blue-900" title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900" title="Edit Course">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(course.id)} 
                        className="text-red-600 hover:text-red-900"
                        disabled={actionLoading === course.id}
                        title="Delete Course"
                      >
                        {actionLoading === course.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by adding your first course.'}
              </p>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{courses.length}</div>
            <div className="text-sm text-gray-600">Total Courses</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-yellow-500">
              {courses.filter(c => c.status === 'Pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending Courses</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-sky-500">
              {courses.filter(c => c.status === 'Approved').length}
            </div>
            <div className="text-sm text-gray-600">Approved Courses</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-lime-800">
              {courses.reduce((acc, course) => acc + course.students, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
        </div>

        {/* Add Course Modal */}
        <AddCourseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleAddCourse}
          districts={districts}
          instructors={instructors}
          submitting={submitting}
          userDistrict={userDistrict}
          instructorsError={instructorsError}
        />
      </div>
    </div>
  );
};

export default TrainingOfficerCourses;