// InstructorCourses.tsx - UPDATED VERSION
import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Users, Clock, BookOpen, BarChart3, Layers, Search, 
  CheckCircle, AlertCircle, RefreshCw, FileText, Download, 
  Upload, Settings, X, Building
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  type CourseType, 
  fetchMyCourses, 
  fetchAvailableCourses, 
  assignCourseToMe,
  fetchCourseAnalytics,
  updateCourse
} from '../../api/api';
import toast from 'react-hot-toast';

// Import export utilities
import { exportToPDF, exportToExcel, exportToCSV } from '../../utils/exportUtils';

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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 relative max-h-screen overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage Course Content</h2>
        <p className="text-gray-600 mb-6">{course.name} ({course.code})</p>

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
                <BarChart3 className="w-4 h-4 inline mr-1" />
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

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Materials</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 transition-colors"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">Upload Materials</span>
              </button>
              
              <button
                type="button"
                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 transition-colors"
              >
                <FileText className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">Add Assignment</span>
              </button>
              
              <button
                type="button"
                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 transition-colors"
              >
                <Settings className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">Course Settings</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              disabled={updating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm disabled:opacity-70 flex items-center space-x-2"
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

// View Reports Modal Component
interface ViewReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseType | null;
  analytics: any;
  loading: boolean;
  onExport: (courseId: number, format: 'pdf' | 'excel' | 'csv', reportData: any) => Promise<void>;
  exporting: boolean;
}

const ViewReportsModal: React.FC<ViewReportsModalProps> = ({ 
  isOpen, 
  onClose, 
  course, 
  analytics,
  loading,
  onExport,
  exporting
}) => {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !course) return null;

  // Mock data for demonstration - replace with actual analytics data
  const mockReports = {
    total_students: analytics?.total_students || course.students,
    completion_rate: analytics?.completion_rate || Math.round(course.progress),
    average_attendance: 85,
    upcoming_deadlines: [
      { task: 'Assignment 1', due_date: '2024-12-20', submissions: 15 },
      { task: 'Quiz 2', due_date: '2024-12-25', submissions: 12 }
    ],
    student_performance: {
      excellent: 8,
      good: 12,
      average: 5,
      needs_improvement: 2
    },
    weekly_progress: [
      { week: 'Week 1', progress: 20 },
      { week: 'Week 2', progress: 45 },
      { week: 'Week 3', progress: 65 },
      { week: 'Week 4', progress: 80 },
      { week: 'Week 5', progress: course.progress }
    ]
  };

  const reportData = {
    course,
    analytics: mockReports,
    generatedAt: new Date().toLocaleString()
  };

  const handleExport = async () => {
    if (!course) return;
    await onExport(course.id, exportFormat, reportData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl p-6 relative max-h-screen overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Course Reports & Analytics</h2>
            <p className="text-gray-600">{course.name} ({course.code})</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'excel' | 'csv')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
            <button 
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {exporting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{exporting ? 'Exporting...' : 'Export Report'}</span>
            </button>
          </div>
        </div>

        <div ref={reportRef}>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{mockReports.total_students}</div>
                  <div className="text-sm text-blue-800">Total Students</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{mockReports.completion_rate}%</div>
                  <div className="text-sm text-green-800">Completion Rate</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{mockReports.average_attendance}%</div>
                  <div className="text-sm text-yellow-800">Avg Attendance</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {mockReports.upcoming_deadlines?.length || 0}
                  </div>
                  <div className="text-sm text-purple-800">Upcoming Deadlines</div>
                </div>
              </div>

              {/* Student Performance */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {mockReports.student_performance && Object.entries(mockReports.student_performance).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{value as number}</div>
                      <div className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Progress</h3>
                <div className="space-y-3">
                  {mockReports.weekly_progress?.map((week: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{week.week}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${week.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8">{week.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Deadlines */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
                <div className="space-y-3">
                  {mockReports.upcoming_deadlines?.map((deadline: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{deadline.task}</div>
                        <div className="text-sm text-gray-600">Due: {deadline.due_date}</div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {deadline.submissions} submissions
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced InstructorCourses Component
const InstructorCourses: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [myCourses, setMyCourses] = useState<CourseType[]>([]);
  const [availableCourses, setAvailableCourses] = useState<CourseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Modal states
  const [manageContentModal, setManageContentModal] = useState({ isOpen: false, course: null as CourseType | null });
  const [viewReportsModal, setViewReportsModal] = useState({ isOpen: false, course: null as CourseType | null, analytics: null as any });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const [myCoursesData, availableCoursesData] = await Promise.all([
        fetchMyCourses(),
        fetchAvailableCourses()
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

  const handleAssign = async (id: number) => {
    try {
      setAssigning(id);
      await assignCourseToMe(id);
      toast.success('Course assigned successfully!');
      await loadCourses();
    } catch (error: any) {
      console.error('Error assigning course:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Failed to assign course';
      toast.error(errorMessage);
    } finally {
      setAssigning(null);
    }
  };

  const handleManageContent = (course: CourseType) => {
    setManageContentModal({ isOpen: true, course });
  };

  const handleViewReports = async (course: CourseType) => {
    setAnalyticsLoading(true);
    setViewReportsModal({ isOpen: true, course, analytics: null });
    
    try {
      const analytics = await fetchCourseAnalytics(course.id);
      setViewReportsModal({ isOpen: true, course, analytics });
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      setViewReportsModal({ isOpen: true, course, analytics: null });
      toast.error('Failed to load detailed analytics, showing basic course data');
    } finally {
      setAnalyticsLoading(false);
    }
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

  const handleExportReport = async (courseId: number, format: 'pdf' | 'excel' | 'csv', reportData: any) => {
    setExporting(true);
    try {
      const course = myCourses.find(c => c.id === courseId) || availableCourses.find(c => c.id === courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      const filename = `course-report-${course.code}-${new Date().toISOString().split('T')[0]}`;

      switch (format) {
        case 'pdf':
          await exportToPDF(reportData, filename);
          break;
        case 'excel':
          await exportToExcel(reportData, filename);
          break;
        case 'csv':
          await exportToCSV(reportData, filename);
          break;
        default:
          throw new Error('Unsupported export format');
      }

      toast.success(`Report exported successfully as ${format.toUpperCase()}!`);
    } catch (error: any) {
      console.error('Error exporting report:', error);
      toast.error(error.message || 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const handleRefresh = async () => {
    await loadCourses();
    toast.success('Courses refreshed!');
  };

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
              placeholder="Search courses, categories, or centers..."
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
                    {course.center_details && (
                      <div className="flex items-center text-xs text-gray-400 mt-1">
                        <Building className="w-3 h-3 mr-1" />
                        {course.center_details.name}
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
                  <button 
                    onClick={() => handleManageContent(course)}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-green-700 transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Manage Content</span>
                  </button>
                  <button 
                    onClick={() => handleViewReports(course)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-100 transition-colors"
                  >
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
                    {course.center_details && (
                      <div className="flex items-center text-xs text-gray-400 mt-1">
                        <Building className="w-3 h-3 mr-1" />
                        {course.center_details.name}
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

        {/* Manage Content Modal */}
        <ManageContentModal
          isOpen={manageContentModal.isOpen}
          onClose={() => setManageContentModal({ isOpen: false, course: null })}
          course={manageContentModal.course}
          onUpdate={handleUpdateContent}
          updating={updating}
        />

        {/* View Reports Modal */}
        <ViewReportsModal
          isOpen={viewReportsModal.isOpen}
          onClose={() => setViewReportsModal({ isOpen: false, course: null, analytics: null })}
          course={viewReportsModal.course}
          analytics={viewReportsModal.analytics}
          loading={analyticsLoading}
          onExport={handleExportReport}
          exporting={exporting}
        />
      </div>
    </div>
  );
};

export default InstructorCourses;