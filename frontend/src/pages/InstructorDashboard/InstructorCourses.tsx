// InstructorCourses.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, BookOpen, BarChart3, Layers, Search, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { type CourseType, fetchMyCourses, fetchAvailableCourses, assignCourseToMe } from '../../api/api';
import toast from 'react-hot-toast';

const InstructorCourses: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [myCourses, setMyCourses] = useState<CourseType[]>([]);
  const [availableCourses, setAvailableCourses] = useState<CourseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<number | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      
      // Use dedicated endpoints instead of filtering
      const [myCoursesData, availableCoursesData] = await Promise.all([
        fetchMyCourses(),      // /api/courses/my/
        fetchAvailableCourses() // /api/courses/available/
      ]);
      
      setMyCourses(myCoursesData);
      setAvailableCourses(availableCoursesData);
    } catch (error: any) {
      console.error('Error loading courses:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to load courses';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredMyCourses = myCourses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.category && course.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredAvailableCourses = availableCourses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.category && course.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAssign = async (id: number) => {
    try {
      setAssigning(id);
      await assignCourseToMe(id);
      toast.success('Course assigned successfully!');
      // Reload courses after assignment
      await loadCourses();
    } catch (error: any) {
      console.error('Error assigning course:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to assign course';
      toast.error(errorMessage);
    } finally {
      setAssigning(null);
    }
  };

  const handleRefresh = async () => {
    await loadCourses();
    toast.success('Courses refreshed!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading courses...</span>
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
              <p className="text-gray-600 mt-2">Monitor your active courses and student engagement</p>
            </div>
            <button
              onClick={handleRefresh}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search courses or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* My Courses Grid */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">My Assigned Courses</h2>
        {filteredMyCourses.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses assigned</h3>
            <p className="text-gray-600">You don't have any active courses assigned to you yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
            {filteredMyCourses.map((course) => (
              <motion.div
                key={course.id}
                className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow"
                whileHover={{ scale: 1.02 }}
              >
                {/* Course Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
                    <p className="text-sm text-gray-500">{course.code}</p>
                    {course.category && (
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Layers className="w-4 h-4 mr-1 text-green-500" />
                        {course.category}
                      </div>
                    )}
                  </div>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                    {course.progress}% Complete
                  </span>
                </div>

                {/* Course Info */}
                <div className="space-y-2 mb-5 text-sm text-gray-600">
                  {course.schedule && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-green-600" />
                      <span>{course.schedule}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-green-600" />
                    <span>{course.students} students enrolled</span>
                  </div>
                  {course.next_session && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span>Next: {course.next_session}</span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-green-700 transition-colors">
                    <BookOpen className="w-4 h-4" />
                    <span>Manage Content</span>
                  </button>
                  <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-100 transition-colors">
                    <BarChart3 className="w-4 h-4" />
                    <span>View Reports</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Available Courses Grid */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Courses to Assign</h2>
        {filteredAvailableCourses.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No available courses</h3>
            <p className="text-gray-600">
              There are no approved courses available in your district at the moment.
              <br />
              Check back later or contact your district manager.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAvailableCourses.map((course) => (
              <motion.div
                key={course.id}
                className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow"
                whileHover={{ scale: 1.02 }}
              >
                {/* Course Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
                    <p className="text-sm text-gray-500">{course.code}</p>
                    {course.category && (
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Layers className="w-4 h-4 mr-1 text-green-500" />
                        {course.category}
                      </div>
                    )}
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <Layers className="w-3 h-3 mr-1" />
                      {course.district} District
                    </div>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
                    Approved
                  </span>
                </div>

                {/* Course Info */}
                <div className="space-y-2 mb-5 text-sm text-gray-600">
                  {course.duration && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span>Duration: {course.duration}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-green-600" />
                    <span>{course.students} students enrolled</span>
                  </div>
                  {course.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {course.description}
                    </p>
                  )}
                </div>

                {/* Action Button */}
                <button 
                  onClick={() => handleAssign(course.id)}
                  disabled={assigning === course.id}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        )}

        {/* Summary Stats */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{myCourses.length + availableCourses.length}</div>
            <div className="text-sm text-gray-600">Total Courses</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-yellow-500">{myCourses.length}</div>
            <div className="text-sm text-gray-600">Active Courses</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-sky-500">
              {myCourses.length > 0 
                ? Math.round(myCourses.reduce((acc, c) => acc + c.progress, 0) / myCourses.length)
                : 0}%
            </div>
            <div className="text-sm text-gray-600">Avg Progress</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-lime-800">
              {myCourses.reduce((acc, c) => acc + c.students, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Students Enrolled</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorCourses;