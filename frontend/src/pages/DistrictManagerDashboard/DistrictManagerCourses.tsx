// DistrictManagerCourses.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Edit, Trash2, BookOpen, Check, X } from 'lucide-react';
import { 
  type CourseType,
  fetchCourses, 
  fetchPendingCourses, 
  updateCourse, 
  deleteCourse
} from '../../api/api';

const DistrictManagerCourses: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Get user info
  const userDistrict = localStorage.getItem("user_district") || "";

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      // Use pending courses endpoint for district managers
      const coursesData = await fetchPendingCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
      // Fallback to regular fetch if pending endpoint fails
      try {
        const allCourses = await fetchCourses();
        const pendingCourses = allCourses.filter(course => 
          course.status === 'Pending' && course.district === userDistrict
        );
        setCourses(pendingCourses);
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.instructor_details && 
        `${course.instructor_details.first_name} ${course.instructor_details.last_name}`
          .toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleApprove = async (id: number) => {
    try {
      setActionLoading(id);
      await updateCourse(id, { status: 'Approved' });
      await loadCourses(); // Reload to get updated data
    } catch (error) {
      console.error('Error approving course:', error);
      alert('Failed to approve course. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    try {
      setActionLoading(id);
      await updateCourse(id, { status: 'Rejected' });
      await loadCourses(); // Reload to get updated data
    } catch (error) {
      console.error('Error rejecting course:', error);
      alert('Failed to reject course. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (id: number) => {
    try {
      setActionLoading(id);
      await updateCourse(id, { status: 'Active' });
      await loadCourses();
    } catch (error) {
      console.error('Error activating course:', error);
      alert('Failed to activate course. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      setActionLoading(id);
      await updateCourse(id, { status: 'Inactive' });
      await loadCourses();
    } catch (error) {
      console.error('Error deactivating course:', error);
      alert('Failed to deactivate course. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        setActionLoading(id);
        await deleteCourse(id);
        await loadCourses();
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Failed to delete course. Please try again.');
      } finally {
        setActionLoading(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading courses...</div>
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
              <h1 className="text-3xl font-bold text-gray-900">Course Approvals</h1>
              <p className="text-gray-600 mt-2">Review and approve courses in your district</p>
              {userDistrict && (
                <p className="text-sm text-green-600 mt-1">
                  Managing courses in: <strong>{userDistrict}</strong> district
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search courses or instructors..."
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
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
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
                      {course.students}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          course.status === 'Approved' || course.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : course.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {course.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button 
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {course.status === 'Pending' && (
                        <>
                          <button 
                            onClick={() => handleApprove(course.id)} 
                            className="text-green-600 hover:text-green-900"
                            disabled={actionLoading === course.id}
                            title="Approve Course"
                          >
                            {actionLoading === course.id ? (
                              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                          <button 
                            onClick={() => handleReject(course.id)} 
                            className="text-red-600 hover:text-red-900"
                            disabled={actionLoading === course.id}
                            title="Reject Course"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {course.status === 'Approved' && (
                        <button 
                          onClick={() => handleActivate(course.id)} 
                          className="text-green-600 hover:text-green-900"
                          disabled={actionLoading === course.id}
                          title="Activate Course"
                        >
                          {actionLoading === course.id ? (
                            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            'Activate'
                          )}
                        </button>
                      )}

                      {course.status === 'Active' && (
                        <button 
                          onClick={() => handleDeactivate(course.id)} 
                          className="text-yellow-600 hover:text-yellow-900"
                          disabled={actionLoading === course.id}
                          title="Deactivate Course"
                        >
                          {actionLoading === course.id ? (
                            <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            'Deactivate'
                          )}
                        </button>
                      )}

                      <button 
                        className="text-green-600 hover:text-green-900"
                        title="Edit Course"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(course.id)} 
                        className="text-red-600 hover:text-red-900"
                        disabled={actionLoading === course.id}
                        title="Delete Course"
                      >
                        {actionLoading === course.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
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
                {searchTerm ? 'Try adjusting your search criteria.' : 'No courses available in your district.'}
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
            <div className="text-sm text-gray-600">Pending Approvals</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-sky-500">
              {courses.reduce((acc, c) => acc + c.students, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Enrolled Students</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-lime-800">
              {courses.length > 0 
                ? Math.round(courses.reduce((acc, c) => acc + c.progress, 0) / courses.length)
                : 0}%
            </div>
            <div className="text-sm text-gray-600">Avg Course Progress</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistrictManagerCourses;