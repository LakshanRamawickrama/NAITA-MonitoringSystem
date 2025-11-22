// DistrictManagerCourses.tsx - COMPLETE FIXED VERSION WITH APPROVAL ACTIONS
import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, BookOpen, Building, RefreshCw, X, Users, Calendar, Target, CheckCircle, XCircle, Eye } from 'lucide-react';
import { 
  type CourseType,
  fetchCourses, 
  updateCourse, 
  deleteCourse,
  fetchCenters,
  type Center,
  approveCourse,
  rejectCourse
} from '../../api/api';
import toast from 'react-hot-toast';

const DistrictManagerCourses: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<CourseType | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseType | null>(null);
  const [viewingCourse, setViewingCourse] = useState<CourseType | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    code: '',
    description: '',
    category: '',
    duration: '',
    schedule: '',
    next_session: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
    students: 0,
    progress: 0,
    status: 'Active' as 'Active' | 'Pending' | 'Approved' | 'Inactive' | 'Rejected',
    center: ''
  });

  // Get user info
  const userDistrict = localStorage.getItem("user_district") || "";

  useEffect(() => {
    loadCourses();
    loadCenters();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const allCourses = await fetchCourses();
      
      // Filter courses by district manager's district
      const districtCourses = allCourses.filter(course => 
        course.district === userDistrict
      );
      
      setCourses(districtCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadCenters = async () => {
    try {
      const centersData = await fetchCenters();
      const districtCenters = centersData.filter(center => 
        center.district === userDistrict
      );
      setCenters(districtCenters);
    } catch (error) {
      console.error('Error loading centers:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCourses();
  };

  // Filter courses based on search term and status filter
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = 
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.instructor_details && 
        `${course.instructor_details.first_name} ${course.instructor_details.last_name}`
          .toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.center_details && course.center_details.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || course.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (id: number) => {
    try {
      setActionLoading(id);
      await approveCourse(id);
      await loadCourses();
      toast.success('Course approved successfully!');
    } catch (error: any) {
      console.error('Error approving course:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to approve course';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    try {
      setActionLoading(id);
      await rejectCourse(id);
      await loadCourses();
      toast.success('Course rejected successfully!');
    } catch (error: any) {
      console.error('Error rejecting course:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to reject course';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (id: number, newStatus: 'Active' | 'Pending' | 'Approved' | 'Inactive' | 'Rejected') => {
    try {
      setActionLoading(id);
      await updateCourse(id, { status: newStatus });
      await loadCourses();
      toast.success('Course status updated successfully!');
    } catch (error: any) {
      console.error('Error updating course status:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to update course status';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const openDeleteModal = (course: CourseType) => {
    setCourseToDelete(course);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!courseToDelete) return;
    
    try {
      setActionLoading(courseToDelete.id);
      await deleteCourse(courseToDelete.id);
      await loadCourses();
      setShowDeleteModal(false);
      setCourseToDelete(null);
      toast.success('Course deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting course:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to delete course';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (course: CourseType) => {
    setEditingCourse(course);
    setEditForm({
      name: course.name || '',
      code: course.code || '',
      description: course.description || '',
      category: course.category || '',
      duration: course.duration || '',
      schedule: course.schedule || '',
      next_session: course.next_session || '',
      priority: (course.priority as 'Low' | 'Medium' | 'High') || 'Medium',
      students: course.students || 0,
      progress: course.progress || 0,
      status: course.status || 'Active',
      center: course.center?.toString() || ''
    });
    setShowEditModal(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    try {
      setActionLoading(editingCourse.id);
      await updateCourse(editingCourse.id, {
        ...editForm,
        center: editForm.center ? parseInt(editForm.center) : null
      });
      await loadCourses();
      setShowEditModal(false);
      setEditingCourse(null);
      toast.success('Course updated successfully!');
    } catch (error: any) {
      console.error('Error updating course:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to update course';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewCourse = (course: CourseType) => {
    setViewingCourse(course);
  };

  // Status options for filter
  const statusOptions = ['All', 'Pending', 'Approved', 'Active', 'Inactive', 'Rejected'];

  // Get available status transitions for a course
  const getAvailableStatuses = (currentStatus: string) => {
    const statusMap: Record<string, string[]> = {
      'Pending': ['Approved', 'Rejected'],
      'Approved': ['Active', 'Inactive'],
      'Active': ['Inactive', 'Approved'],
      'Inactive': ['Active', 'Approved'],
      'Rejected': ['Pending', 'Approved']
    };
    
    return statusMap[currentStatus] || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <div className="text-lg text-gray-600">Loading courses...</div>
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
              <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
              <p className="text-gray-600 mt-2">Manage and approve courses in your district</p>
              {userDistrict && (
                <p className="text-sm text-green-600 mt-1">
                  Managing courses in: <strong>{userDistrict}</strong> district
                </p>
              )}
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search courses, instructors, or centers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {statusOptions.map(option => (
                <option key={option} value={option}>
                  {option === 'All' ? 'All Status' : option}
                </option>
              ))}
            </select>

            <div className="text-sm text-gray-600 flex items-center">
              Showing {filteredCourses.length} of {courses.length} courses
            </div>
          </div>
        </div>

        {/* Courses Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Course Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Center & District
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Instructor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Students/Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status & Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCourses.map((course) => {
                  const availableStatuses = getAvailableStatuses(course.status);
                  const isPending = course.status === 'Pending';
                  
                  return (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-green-700" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{course.name}</div>
                            <div className="text-xs text-gray-500 font-mono">{course.code}</div>
                            {course.category && (
                              <div className="text-xs text-gray-500">{course.category}</div>
                            )}
                            {course.description && (
                              <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                                {course.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-900">
                              {course.center_details 
                                ? course.center_details.name
                                : 'No center'
                              }
                            </div>
                            <div className="text-xs text-gray-500">
                              {course.district}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {course.duration || 'Not specified'}
                        </div>
                        {course.schedule && (
                          <div className="text-xs text-gray-500">
                            {course.schedule}
                          </div>
                        )}
                        {course.next_session && (
                          <div className="text-xs text-blue-600 mt-1">
                            Next: {course.next_session}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {course.instructor_details ? (
                          <div>
                            <div className="text-sm text-gray-900">
                              {course.instructor_details.first_name} {course.instructor_details.last_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {course.instructor_details.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {course.students} students
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {course.progress}% complete
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-2">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
                              course.status === 'Approved' || course.status === 'Active'
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : course.status === 'Pending'
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                : course.status === 'Rejected'
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : 'bg-gray-100 text-gray-800 border-gray-200'
                            }`}
                          >
                            {course.status}
                          </span>
                          
                          {/* Quick Actions for Pending Courses */}
                          {isPending && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleApprove(course.id)}
                                disabled={actionLoading === course.id}
                                className="flex-1 bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                              >
                                {actionLoading === course.id ? (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Approve
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleReject(course.id)}
                                disabled={actionLoading === course.id}
                                className="flex-1 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                              >
                                {actionLoading === course.id ? (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Reject
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                          
                          {/* Status Change Dropdown for non-pending courses */}
                          {!isPending && availableStatuses.length > 0 && (
                            <select
                              value=""
                              onChange={(e) => handleStatusChange(course.id, e.target.value as any)}
                              disabled={actionLoading === course.id}
                              className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-green-500"
                            >
                              <option value="">Change Status</option>
                              {availableStatuses.map(status => (
                                <option key={status} value={status}>
                                  Set as {status}
                                </option>
                              ))}
                            </select>
                          )}
                          
                          {/* Action Buttons */}
                          <div className="flex space-x-1">
                            <button 
                              onClick={() => openEditModal(course)}
                              className="flex-1 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors flex items-center justify-center"
                              title="Edit Course"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => openDeleteModal(course)} 
                              className="flex-1 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                              disabled={actionLoading === course.id}
                              title="Delete Course"
                            >
                              {actionLoading === course.id ? (
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'All' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'No courses available in your district.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{courses.length}</div>
            <div className="text-sm text-gray-600">Total Courses</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-yellow-500">
              {courses.filter(c => c.status === 'Pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending Approvals</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">
              {courses.filter(c => c.status === 'Active').length}
            </div>
            <div className="text-sm text-gray-600">Active Courses</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-sky-500">
              {courses.reduce((acc, c) => acc + c.students, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center space-x-3 text-red-600 mb-4">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Delete Course?</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong className="text-gray-900">"{courseToDelete.name}"</strong>? 
              This action cannot be undone.
            </p>
            {courseToDelete.students > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <p className="text-orange-800 text-sm">
                  ⚠️ This course has {courseToDelete.students} enrolled students. 
                  Deleting it will affect student records.
                </p>
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCourseToDelete(null);
                }}
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading === courseToDelete.id}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                {actionLoading === courseToDelete.id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                ) : (
                  'Delete Course'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal - Keep the existing edit modal code */}
      {showEditModal && editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 relative max-h-screen overflow-y-auto">
            <button
              onClick={() => {
                setShowEditModal(false);
                setEditingCourse(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Edit Course Details</h2>
            <p className="text-gray-600 mb-6">
              Update comprehensive information for {editingCourse.name}
            </p>

            <form onSubmit={handleEdit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-green-600" />
                  Basic Information
                </h3>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.code}
                  onChange={e => setEditForm({ ...editForm, code: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={editForm.category}
                  onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., IT, Business, Engineering"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Detailed course description, objectives, and learning outcomes..."
                />
              </div>

              {/* Schedule & Duration */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                  Schedule & Duration
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  value={editForm.duration}
                  onChange={e => setEditForm({ ...editForm, duration: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 3 months, 6 weeks"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule
                </label>
                <input
                  type="text"
                  value={editForm.schedule}
                  onChange={e => setEditForm({ ...editForm, schedule: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Mon-Wed-Fri, 9AM-12PM"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Next Session
                </label>
                <input
                  type="text"
                  value={editForm.next_session}
                  onChange={e => setEditForm({ ...editForm, next_session: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 2024-01-15, Starting next week"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Training Center
                </label>
                <select
                  value={editForm.center}
                  onChange={e => setEditForm({ ...editForm, center: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Center</option>
                  {centers.map(center => (
                    <option key={center.id} value={center.id}>
                      {center.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Students & Progress */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-purple-600" />
                  Students & Progress
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Students
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.students}
                  onChange={e => setEditForm({ ...editForm, students: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Progress (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editForm.progress}
                  onChange={e => setEditForm({ ...editForm, progress: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Status & Priority */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-orange-600" />
                  Status & Priority
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Status
                </label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value as any })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority Level
                </label>
                <select
                  value={editForm.priority}
                  onChange={e => setEditForm({ ...editForm, priority: e.target.value as 'Low' | 'Medium' | 'High' })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="md:col-span-2 flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCourse(null);
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  disabled={actionLoading === editingCourse.id}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === editingCourse.id}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm disabled:opacity-70 flex items-center space-x-2 transition-colors"
                >
                  {actionLoading === editingCourse.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Update Course Details</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistrictManagerCourses;