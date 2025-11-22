// InstructorCourses.tsx - UPDATED WITH PENDING COURSES SECTION
import React, { useState, useEffect } from 'react';
import { 
  Calendar, Users, Clock, BookOpen, Layers, Search, 
  CheckCircle, AlertCircle, RefreshCw, Edit3, MapPin,
  Hourglass, X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  type CourseType, 
  fetchMyCourses, 
  fetchAvailableCourses, 
  assignCourseToMe,
  updateCourse,
  requestCourseAssignment
} from '../../api/api';
import toast from 'react-hot-toast';

// Manage Content Modal Component
interface ManageContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseType | null;
  onUpdate: (courseId: number, data: Partial<CourseType>) => Promise<void>;
  updating: boolean;
}

const ManageContentModal: React.FC<ManageContentModalProps> = ({ 
  isOpen, 
  onClose, 
  course, 
  onUpdate,
  updating 
}) => {
  const [formData, setFormData] = useState({
    description: '',
    schedule: '',
    next_session: '',
    students: '0',
    progress: '0'
  });

  useEffect(() => {
    if (course && isOpen) {
      setFormData({
        description: course.description || '',
        schedule: course.schedule || '',
        next_session: course.next_session || '',
        students: course.students.toString(),
        progress: course.progress.toString()
      });
    }
  }, [course, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;

    try {
      await onUpdate(course.id, {
        description: formData.description,
        schedule: formData.schedule,
        next_session: formData.next_session,
        students: parseInt(formData.students),
        progress: parseInt(formData.progress)
      });
      onClose();
    } catch (error) {
      console.error('Error updating course:', error);
    }
  };

  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Course Content</h2>
            <p className="text-gray-600">{course.name} ({course.code})</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="Update course description..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Schedule
              </label>
              <input
                type="text"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Mon-Wed-Fri 9:00-11:00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Next Session
              </label>
              <input
                type="text"
                value={formData.next_session}
                onChange={(e) => setFormData({ ...formData, next_session: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., December 15, 2024"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Student Count
              </label>
              <input
                type="number"
                min="0"
                value={formData.students}
                onChange={(e) => setFormData({ ...formData, students: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Progress (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              disabled={updating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {updating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main InstructorCourses Component
const InstructorCourses: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [myCourses, setMyCourses] = useState<CourseType[]>([]);
  const [availableCourses, setAvailableCourses] = useState<CourseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<number | null>(null);
  const [requesting, setRequesting] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);

  // Modal state
  const [manageContentModal, setManageContentModal] = useState({ isOpen: false, course: null as CourseType | null });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading courses for instructor...');
      
      const [myCoursesData, availableCoursesData] = await Promise.all([
        fetchMyCourses(),
        fetchAvailableCourses()
      ]);
      
      console.log('✅ Courses loaded successfully:', {
        myCourses: myCoursesData,
        availableCourses: availableCoursesData,
        myCoursesCount: myCoursesData.length,
        availableCoursesCount: availableCoursesData.length,
        userDistrict: localStorage.getItem("user_district"),
        userRole: localStorage.getItem("user_role")
      });
      
      // Log course statuses for debugging
      myCoursesData.forEach((course: CourseType) => {
        console.log('📚 My Course:', {
          id: course.id,
          name: course.name,
          status: course.status,
          instructor: course.instructor
        });
      });
      
      availableCoursesData.forEach((course: CourseType) => {
        console.log('📚 Available Course:', {
          id: course.id,
          name: course.name,
          status: course.status,
          district: course.district,
          instructor: course.instructor
        });
      });
      
      setMyCourses(myCoursesData);
      setAvailableCourses(availableCoursesData);
      
    } catch (error: any) {
      console.error('❌ Error loading courses:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to load courses';
      toast.error(errorMessage);
      
      setMyCourses([]);
      setAvailableCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (id: number) => {
    try {
      setAssigning(id);
      console.log(`🎯 Assigning course ${id} to instructor`);
      
      const result = await assignCourseToMe(id);
      console.log('✅ Assignment successful:', result);
      
      toast.success('Course assigned successfully!');
      await loadCourses();
    } catch (error: any) {
      console.error('❌ Error assigning course:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to assign course';
      toast.error(errorMessage);
    } finally {
      setAssigning(null);
    }
  };

  const handleRequestAssignment = async (id: number) => {
    try {
      setRequesting(id);
      console.log(`🎯 Requesting assignment for course ${id}`);
      
      const result = await requestCourseAssignment(id);
      console.log('✅ Assignment request successful:', result);
      
      toast.success('Assignment request submitted! Waiting for approval.');
      await loadCourses();
    } catch (error: any) {
      console.error('❌ Error requesting assignment:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to request assignment';
      toast.error(errorMessage);
    } finally {
      setRequesting(null);
    }
  };

  const handleManageContent = (course: CourseType) => {
    setManageContentModal({ isOpen: true, course });
  };

  const handleUpdateContent = async (courseId: number, data: Partial<CourseType>) => {
    setUpdating(true);
    try {
      await updateCourse(courseId, data);
      toast.success('Course content updated successfully!');
      await loadCourses();
    } catch (error: any) {
      console.error('Error updating course:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to update course';
      toast.error(errorMessage);
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  const handleRefresh = async () => {
    await loadCourses();
    toast.success('Courses refreshed!');
  };

  // Filter courses based on search
  const filteredMyCourses = myCourses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.category && course.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.center_details && course.center_details.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredAvailableCourses = availableCourses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.category && course.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.center_details && course.center_details.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Separate available courses by status for different UI treatment
  const approvedAvailableCourses = filteredAvailableCourses.filter(course => course.status === 'Approved');
  const pendingAvailableCourses = filteredAvailableCourses.filter(course => course.status === 'Pending');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 text-lg">Loading your courses...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
              <p className="text-gray-600 mt-2">Manage your courses and track student progress</p>
              <div className="mt-2 text-sm text-gray-500">
                <p>District: <strong>{localStorage.getItem("user_district") || "Not assigned"}</strong></p>
                <p>Role: <strong>{localStorage.getItem("user_role")}</strong></p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search courses by name, code, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {/* My Courses Section */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">My Assigned Courses</h2>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              {filteredMyCourses.length} courses
            </span>
          </div>
          
          {filteredMyCourses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
              <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No courses assigned yet</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                You haven't been assigned any courses yet. Check the available courses below to assign yourself to one.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredMyCourses.map((course) => (
                <motion.div
                  key={course.id}
                  className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300"
                  whileHover={{ y: -4 }}
                >
                  {/* Course Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{course.name}</h3>
                      <p className="text-sm text-gray-500 font-mono">{course.code}</p>
                      
                      {/* Course Meta */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {course.category && (
                          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            <Layers className="w-3 h-3 mr-1" />
                            {course.category}
                          </span>
                        )}
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          <MapPin className="w-3 h-3 mr-1" />
                          {course.district}
                        </span>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      course.status === 'Active' 
                        ? 'bg-green-100 text-green-800'
                        : course.status === 'Approved'
                        ? 'bg-blue-100 text-blue-800'
                        : course.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {course.status}
                    </span>
                  </div>

                  {/* Course Details */}
                  <div className="space-y-3 mb-4">
                    {course.schedule && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-green-600" />
                        <span>{course.schedule}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2 text-green-600" />
                      <span>{course.students} students enrolled</span>
                    </div>
                    {course.next_session && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2 text-green-600" />
                        <span>Next: {course.next_session}</span>
                      </div>
                    )}
                    {course.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {course.description}
                      </p>
                    )}
                  </div>

                  {/* Progress Section - Only show for active courses */}
                  {course.status === 'Active' && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Course Progress</span>
                        <span className="font-semibold">{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  {course.status === 'Pending' ? (
                    <div className="w-full bg-yellow-100 text-yellow-800 py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 font-medium">
                      <Hourglass className="w-4 h-4" />
                      <span>Waiting Approval</span>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleManageContent(course)}
                      className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-green-700 transition-colors font-medium"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Manage Course</span>
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Available Courses Section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Available Courses</h2>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {filteredAvailableCourses.length} total available
            </span>
          </div>

          {/* Approved Courses to Assign */}
          {approvedAvailableCourses.length > 0 && (
            <div className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                  Ready to Assign
                </h3>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {approvedAvailableCourses.length} approved courses
                </span>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-800">Ready for Immediate Assignment</h4>
                    <p className="text-green-700 text-sm mt-1">
                      These courses are already approved and ready to be assigned to you immediately. 
                      Click "Assign to Me" to start teaching right away.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {approvedAvailableCourses.map((course) => (
                  <motion.div
                    key={course.id}
                    className="bg-white rounded-xl shadow-lg border-2 border-green-300 p-6 hover:shadow-xl transition-all duration-300"
                    whileHover={{ y: -4 }}
                  >
                    {/* Course Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{course.name}</h3>
                        <p className="text-sm text-gray-500 font-mono">{course.code}</p>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          {course.category && (
                            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              <Layers className="w-3 h-3 mr-1" />
                              {course.category}
                            </span>
                          )}
                          <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            <MapPin className="w-3 h-3 mr-1" />
                            {course.district}
                          </span>
                        </div>
                      </div>
                      
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        Approved
                      </span>
                    </div>

                    {/* Course Details */}
                    <div className="space-y-3 mb-4">
                      {course.duration && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-2 text-green-600" />
                          <span>Duration: {course.duration}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2 text-green-600" />
                        <span>{course.students} students enrolled</span>
                      </div>
                      {course.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {course.description}
                        </p>
                      )}
                    </div>

                    {/* Assign Button */}
                    <button 
                      onClick={() => handleAssign(course.id)}
                      disabled={assigning === course.id}
                      className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {assigning === course.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Assigning...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Assign to Me</span>
                        </>
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Courses to Assign */}
          {pendingAvailableCourses.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <Hourglass className="w-6 h-6 text-yellow-500 mr-3" />
                  Pending Courses to Assign
                </h3>
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                  {pendingAvailableCourses.length} pending approval
                </span>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
                <div className="flex items-start space-x-3">
                  <Hourglass className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-yellow-800">Awaiting District Manager Approval</h4>
                    <p className="text-yellow-700 text-sm mt-1">
                      These courses are pending approval from your district manager. 
                      You can request assignment, but you'll need to wait for approval before you can start teaching.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {pendingAvailableCourses.map((course) => (
                  <motion.div
                    key={course.id}
                    className="bg-white rounded-xl shadow-lg border-2 border-yellow-300 p-6 hover:shadow-xl transition-all duration-300"
                    whileHover={{ y: -4 }}
                  >
                    {/* Course Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{course.name}</h3>
                        <p className="text-sm text-gray-500 font-mono">{course.code}</p>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          {course.category && (
                            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              <Layers className="w-3 h-3 mr-1" />
                              {course.category}
                            </span>
                          )}
                          <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            <MapPin className="w-3 h-3 mr-1" />
                            {course.district}
                          </span>
                        </div>
                      </div>
                      
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                        Pending
                      </span>
                    </div>

                    {/* Course Details */}
                    <div className="space-y-3 mb-4">
                      {course.duration && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-2 text-yellow-600" />
                          <span>Duration: {course.duration}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2 text-yellow-600" />
                        <span>{course.students} students enrolled</span>
                      </div>
                      {course.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {course.description}
                        </p>
                      )}
                    </div>

                    {/* Request Assignment Button */}
                    <button 
                      onClick={() => handleRequestAssignment(course.id)}
                      disabled={requesting === course.id}
                      className="w-full bg-yellow-600 text-white py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {requesting === course.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Requesting...</span>
                        </>
                      ) : (
                        <>
                          <Hourglass className="w-4 h-4" />
                          <span>Request Assignment</span>
                        </>
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* No Available Courses Message */}
          {filteredAvailableCourses.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
              <AlertCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No available courses</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                There are currently no courses available in your district. Please check back later or contact your administrator.
              </p>
              <div className="mt-4 text-sm text-gray-500">
                <p>Your district: <strong>{localStorage.getItem("user_district") || "Not assigned"}</strong></p>
              </div>
            </div>
          )}
        </section>

        {/* Summary Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 text-center">
            <div className="text-3xl font-bold text-green-600">{myCourses.length + availableCourses.length}</div>
            <div className="text-sm text-gray-600 font-medium">Total Courses</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 text-center">
            <div className="text-3xl font-bold text-yellow-500">{myCourses.length}</div>
            <div className="text-sm text-gray-600 font-medium">My Courses</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 text-center">
            <div className="text-3xl font-bold text-sky-500">
              {myCourses.length > 0 
                ? Math.round(myCourses.reduce((acc, c) => acc + c.progress, 0) / myCourses.length)
                : 0}%
            </div>
            <div className="text-sm text-gray-600 font-medium">Avg Progress</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 text-center">
            <div className="text-3xl font-bold text-lime-800">
              {myCourses.reduce((acc, c) => acc + c.students, 0)}
            </div>
            <div className="text-sm text-gray-600 font-medium">Total Students</div>
          </div>
        </div>

        {/* Manage Content Modal */}
        <ManageContentModal
          isOpen={manageContentModal.isOpen}
          onClose={() => setManageContentModal({ isOpen: false, course: null })}
          course={manageContentModal.course}
          onUpdate={handleUpdateContent}
          updating={updating}
        />
      </div>
    </div>
  );
};

export default InstructorCourses;