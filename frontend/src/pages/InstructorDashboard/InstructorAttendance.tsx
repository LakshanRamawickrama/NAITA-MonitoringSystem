// InstructorAttendance.tsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Calendar, Users, CheckCircle, XCircle, Clock, Download, Search, BookOpen, Save, RefreshCw, Building, MapPin, FileText, X } from 'lucide-react';
import { fetchMyCourses, fetchCourseStudents, bulkUpdateAttendance, generateAttendanceReport, type ReportRequest } from '../../api/api';
import type { CourseType, StudentAttendance } from '../../api/api';

// Report Modal Component
interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateReport: (reportData: ReportRequest) => void;
  selectedCourse: number | null;
  courses: CourseType[];
  generating: boolean;
}

const ReportModal: React.FC<ReportModalProps> = ({ 
  isOpen, 
  onClose, 
  onGenerateReport, 
  selectedCourse, 
  courses,
  generating 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  const [selectedFormat, setSelectedFormat] = useState<string>('excel');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    // Set default dates
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay());
    
    setStartDate(firstDayOfMonth.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  const reportPeriods = [
    { id: 'daily', name: 'Daily Report', description: 'Attendance for a specific day' },
    { id: 'weekly', name: 'Weekly Report', description: 'Attendance for a week' },
    { id: 'monthly', name: 'Monthly Report', description: 'Attendance for a month' },
    { id: 'custom', name: 'Custom Range', description: 'Attendance for a custom date range' }
  ];

  const exportFormats = [
    { 
      id: 'excel', 
      name: 'Excel (.xlsx)', 
      description: 'Download as Excel spreadsheet',
      icon: <Download className="w-5 h-5" />
    },
    { 
      id: 'pdf', 
      name: 'PDF (.pdf)', 
      description: 'Download as PDF document',
      icon: <FileText className="w-5 h-5" />
    }
  ];

  const handleGenerateReport = () => {
    if (!selectedCourse) {
      alert('Please select a course first');
      return;
    }

    let period = selectedPeriod;
    let startDateParam = startDate;
    let endDateParam = endDate;

    // Adjust dates based on period selection
    const today = new Date();
    
    if (selectedPeriod === 'daily') {
      startDateParam = today.toISOString().split('T')[0];
      endDateParam = today.toISOString().split('T')[0];
    } else if (selectedPeriod === 'weekly') {
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay());
      startDateParam = firstDayOfWeek.toISOString().split('T')[0];
      endDateParam = today.toISOString().split('T')[0];
    } else if (selectedPeriod === 'monthly') {
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startDateParam = firstDayOfMonth.toISOString().split('T')[0];
      endDateParam = today.toISOString().split('T')[0];
    }

    if (selectedPeriod === 'custom') {
      if (!startDate || !endDate) {
        alert('Please select both start and end dates for custom range');
        return;
      }
      if (new Date(startDate) > new Date(endDate)) {
        alert('Start date cannot be after end date');
        return;
      }
    }

    const reportData: ReportRequest = {
      course_id: selectedCourse,
      period: period as 'daily' | 'weekly' | 'monthly' | 'custom',
      format: selectedFormat as 'excel' | 'pdf',
      start_date: startDateParam,
      end_date: endDateParam
    };

    onGenerateReport(reportData);
  };

  const getSelectedCourseName = () => {
    const course = courses.find(c => c.id === selectedCourse);
    return course ? `${course.name} - ${course.code}` : 'No course selected';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Generate Attendance Report</h2>
            <p className="text-gray-600 text-sm mt-1">
              Course: <span className="font-medium">{getSelectedCourseName()}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            disabled={generating}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Report Period Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Report Period</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportPeriods.map((period) => (
                <div
                  key={period.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                    selectedPeriod === period.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${generating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !generating && setSelectedPeriod(period.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{period.name}</span>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedPeriod === period.id ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    }`} />
                  </div>
                  <p className="text-sm text-gray-600">{period.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          {selectedPeriod === 'custom' && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Select Date Range</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={generating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={generating}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Selected Period Preview */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Report Preview</h4>
            <p className="text-sm text-blue-800">
              {selectedPeriod === 'daily' && `Daily report for ${new Date().toLocaleDateString()}`}
              {selectedPeriod === 'weekly' && `Weekly report from ${new Date(new Date().setDate(new Date().getDate() - new Date().getDay())).toLocaleDateString()} to ${new Date().toLocaleDateString()}`}
              {selectedPeriod === 'monthly' && `Monthly report for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
              {selectedPeriod === 'custom' && `Custom report from ${startDate} to ${endDate}`}
            </p>
          </div>

          {/* Export Format Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Export Format</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exportFormats.map((format) => (
                <div
                  key={format.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                    selectedFormat === format.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${generating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !generating && setSelectedFormat(format.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded ${
                        selectedFormat === format.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {format.icon}
                      </div>
                      <span className="font-medium text-gray-900">{format.name}</span>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedFormat === format.id ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                    }`} />
                  </div>
                  <p className="text-sm text-gray-600 ml-11">{format.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            disabled={generating}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerateReport}
            disabled={generating || !selectedCourse}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Generate Report</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Component
const InstructorAttendance: React.FC = () => {
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [summary, setSummary] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0
  });

  // Load instructor's assigned courses
  useEffect(() => {
    const loadCourses = async () => {
      setCoursesLoading(true);
      try {
        const myCourses = await fetchMyCourses();
        setCourses(myCourses);
        if (myCourses.length > 0) {
          setSelectedCourse(myCourses[0].id);
        } else {
          setSelectedCourse(null);
          setStudents([]);
          updateSummary([]);
        }
      } catch (error) {
        console.error('Failed to load assigned courses:', error);
        showSaveStatus('error', 'Failed to load courses');
        setCourses([]);
        setSelectedCourse(null);
        setStudents([]);
        updateSummary([]);
      } finally {
        setCoursesLoading(false);
      }
    };
    loadCourses();
  }, []);

  // Load students when course or date changes
  useEffect(() => {
    if (selectedCourse) {
      loadCourseStudents();
    } else {
      setStudents([]);
      updateSummary([]);
    }
  }, [selectedCourse, selectedDate]);

  const loadCourseStudents = async () => {
    if (!selectedCourse) return;
    
    setLoading(true);
    try {
      const courseStudents = await fetchCourseStudents(selectedCourse);
      setStudents(courseStudents);
      updateSummary(courseStudents);
      showSaveStatus('success', 'Students loaded successfully');
    } catch (error) {
      console.error('Failed to load students:', error);
      setStudents([]);
      updateSummary([]);
      showSaveStatus('error', 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const updateSummary = (studentList: StudentAttendance[]) => {
    const present = studentList.filter(s => s.attendance_status === 'present').length;
    const absent = studentList.filter(s => s.attendance_status === 'absent').length;
    const late = studentList.filter(s => s.attendance_status === 'late').length;
    
    setSummary({
      total: studentList.length,
      present,
      absent,
      late
    });
  };

  const updateStudentStatus = async (studentId: number, status: 'present' | 'absent' | 'late') => {
    const updatedStudents = students.map(student =>
      student.id === studentId
        ? {
            ...student,
            attendance_status: status,
            check_in_time: status !== 'absent' ? getCurrentTime() : null,
            remarks: status === 'absent' ? (student.remarks || 'Absent') : student.remarks
          }
        : student
    );
    
    setStudents(updatedStudents);
    updateSummary(updatedStudents);
    await saveAttendanceToBackend(updatedStudents);
  };

  const getCurrentTime = (): string => {
    return new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const updateRemarks = (studentId: number, remarks: string) => {
    setStudents(prev =>
      prev.map(student =>
        student.id === studentId ? { ...student, remarks } : student
      )
    );
  };

  const saveRemarks = async (studentId: number) => {
    const student = students.find(s => s.id === studentId);
    if (!student || !selectedCourse) return;
    await saveAttendanceToBackend(students);
  };

  const saveAttendanceToBackend = async (studentList: StudentAttendance[]) => {
    if (!selectedCourse) {
      showSaveStatus('error', 'Please select a course first');
      return;
    }
    
    setSaving(true);
    setSaveStatus('idle');
    
    try {
      const result = await bulkUpdateAttendance(selectedCourse, {
        date: selectedDate,
        attendance: studentList.map(student => ({
          student_id: student.id,
          status: student.attendance_status || 'absent',
          check_in_time: student.check_in_time || undefined,
          remarks: student.remarks || undefined
        }))
      });
      
      if (result.updated > 0) {
        showSaveStatus('success', `Successfully saved ${result.updated} attendance records`);
      } else {
        showSaveStatus('error', 'No records were saved. Please check if students are properly enrolled.');
      }
      
      if (result.errors && result.errors.length > 0) {
        console.warn('Save completed with errors:', result.errors);
        showSaveStatus('error', `Saved with ${result.errors.length} errors. Some students may not be updated.`);
      }
      
    } catch (error: any) {
      console.error('Failed to save attendance:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to save attendance. Please check your connection and try again.';
      showSaveStatus('error', `Save failed: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  // FIXED: Handle report generation with simplified error handling
  const handleGenerateReport = async (reportData: ReportRequest) => {
    setGeneratingReport(true);
    setShowReportModal(false);
    
    try {
      showSaveStatus('success', `Generating ${reportData.format.toUpperCase()} report...`);
      
      // Call the backend API
      const result = await generateAttendanceReport(reportData);
      
      if (result.success) {
        showSaveStatus('success', `Report "${result.file_name}" downloaded successfully!`);
      }
      
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to generate report. Please try again.';
      
      showSaveStatus('error', `Report generation failed: ${errorMessage}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  const showSaveStatus = (status: 'success' | 'error' | 'idle', message: string = '') => {
    setSaveStatus(status);
    setSaveMessage(message);
    
    if (status === 'success') {
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 5000);
    }
  };

  const markAllAsPresent = async () => {
    const updatedStudents = students.map(student => ({
      ...student,
      attendance_status: 'present' as const,
      check_in_time: getCurrentTime(),
      remarks: student.remarks
    }));
    
    setStudents(updatedStudents);
    updateSummary(updatedStudents);
    await saveAttendanceToBackend(updatedStudents);
  };

  const markAllAsAbsent = async () => {
    const updatedStudents = students.map(student => ({
      ...student,
      attendance_status: 'absent' as const,
      check_in_time: null,
      remarks: 'Absent'
    }));
    
    setStudents(updatedStudents);
    updateSummary(updatedStudents);
    await saveAttendanceToBackend(updatedStudents);
  };

  const clearAllAttendance = async () => {
    const updatedStudents = students.map(student => ({
      ...student,
      attendance_status: null,
      check_in_time: null,
      remarks: null
    }));
    
    setStudents(updatedStudents);
    updateSummary(updatedStudents);
    await saveAttendanceToBackend(updatedStudents);
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.nic.includes(searchTerm) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-200';
      case 'absent': return 'bg-red-100 text-red-800 border-red-200';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4" />;
      case 'absent': return <XCircle className="w-4 h-4" />;
      case 'late': return <Clock className="w-4 h-4" />;
      default: return null;
    }
  };

  const getSaveStatusColor = () => {
    switch (saveStatus) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCourseName = () => {
    const course = courses.find(c => c.id === selectedCourse);
    return course ? `${course.name} - ${course.code}` : 'Select a course';
  };

  const getCourseCenterInfo = () => {
    const course = courses.find(c => c.id === selectedCourse);
    if (!course) return null;
    
    return {
      center: course.center_details?.name || 'No Center',
      district: course.center_details?.district || 'No District'
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
            <p className="text-gray-600 mt-1">Track and manage student attendance</p>
            <div className="text-sm text-gray-500 mt-1">
              <p>
                Course: <span className="font-medium">{getCourseName()}</span>
              </p>
              {selectedCourse && getCourseCenterInfo() && (
                <p className="mt-1">
                  <Building className="w-4 h-4 inline mr-1" />
                  Center: <span className="font-medium">{getCourseCenterInfo()?.center}</span>
                  <span className="ml-4">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    District: <span className="font-medium">{getCourseCenterInfo()?.district}</span>
                  </span>
                </p>
              )}
            </div>
            {courses.length === 0 && !coursesLoading && (
              <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">
                  No courses assigned to you yet. Please contact administrator to get assigned to courses.
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {saveStatus !== 'idle' && (
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${getSaveStatusColor()}`}>
                <span className="text-sm font-medium">{saveMessage}</span>
              </div>
            )}
            <button 
              onClick={() => setShowReportModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={courses.length === 0 || generatingReport}
            >
              <FileText className="w-4 h-4" />
              <span>Attendance Report</span>
            </button>
          </div>
        </div>

        {/* Course Selection & Date */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Your Course</label>
                {coursesLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                    <span className="text-gray-500 text-sm">Loading your courses...</span>
                  </div>
                ) : (
                  <select 
                    value={selectedCourse || ''} 
                    onChange={(e) => setSelectedCourse(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={courses.length === 0}
                  >
                    <option value="">{courses.length === 0 ? 'No courses available' : 'Select a course'}</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.name} - {course.code} ({course.center_details?.name || 'No Center'})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-6 h-6 text-blue-600" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {selectedCourse && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Present</p>
              <p className="text-2xl font-bold text-gray-900">{summary.present}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Absent</p>
              <p className="text-2xl font-bold text-gray-900">{summary.absent}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Late</p>
              <p className="text-2xl font-bold text-gray-900">{summary.late}</p>
            </div>
          </div>
        )}

        {/* Search and Actions */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search students by name, email or NIC..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading || students.length === 0}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={markAllAsPresent}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition whitespace-nowrap flex items-center space-x-2"
                disabled={loading || saving || students.length === 0}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark All Present</span>
              </button>
              <button
                onClick={markAllAsAbsent}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition whitespace-nowrap flex items-center space-x-2"
                disabled={loading || saving || students.length === 0}
              >
                <XCircle className="w-4 h-4" />
                <span>Mark All Absent</span>
              </button>
              <button
                onClick={clearAllAttendance}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition whitespace-nowrap flex items-center space-x-2"
                disabled={loading || saving || students.length === 0}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Clear All</span>
              </button>
              <button
                onClick={() => saveAttendanceToBackend(students)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition whitespace-nowrap flex items-center space-x-2"
                disabled={loading || saving || students.length === 0}
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save All'}</span>
              </button>
              <button
                onClick={loadCourseStudents}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition whitespace-nowrap flex items-center space-x-2"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {coursesLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-600">Loading your courses...</span>
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-600">Loading students...</span>
            </div>
          ) : !selectedCourse ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Please select a course to view students</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NIC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check-in Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remarks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{student.email}</div>
                        <div className="text-sm text-gray-500">{student.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{student.nic}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(student.attendance_status)}`}>
                          {getStatusIcon(student.attendance_status)}
                          <span className="capitalize">{student.attendance_status || 'Not marked'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {student.check_in_time || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={student.remarks || ''}
                          onChange={(e) => updateRemarks(student.id, e.target.value)}
                          onBlur={() => saveRemarks(student.id)}
                          placeholder="Add remarks..."
                          className="w-full px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          disabled={saving}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => updateStudentStatus(student.id, 'present')}
                          className={`text-green-600 hover:text-green-900 text-sm transition px-2 py-1 rounded hover:bg-green-50 ${
                            student.attendance_status === 'present' ? 'bg-green-50 font-semibold' : ''
                          }`}
                          disabled={saving}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => updateStudentStatus(student.id, 'absent')}
                          className={`text-red-600 hover:text-red-900 text-sm transition px-2 py-1 rounded hover:bg-red-50 ${
                            student.attendance_status === 'absent' ? 'bg-red-50 font-semibold' : ''
                          }`}
                          disabled={saving}
                        >
                          Absent
                        </button>
                        <button
                          onClick={() => updateStudentStatus(student.id, 'late')}
                          className={`text-yellow-600 hover:text-yellow-900 text-sm transition px-2 py-1 rounded hover:bg-yellow-50 ${
                            student.attendance_status === 'late' ? 'bg-yellow-50 font-semibold' : ''
                          }`}
                          disabled={saving}
                        >
                          Late
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredStudents.length === 0 && students.length > 0 && (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No students match your search</p>
                </div>
              )}
              
              {students.length === 0 && selectedCourse && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No students found for this course</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Students will appear here once they are enrolled in this course
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Report Modal */}
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          onGenerateReport={handleGenerateReport}
          selectedCourse={selectedCourse}
          courses={courses}
          generating={generatingReport}
        />

        {/* Help Section */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Use</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <p className="font-medium">Quick Actions:</p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>Click <span className="font-semibold">Present</span>, <span className="font-semibold">Absent</span>, or <span className="font-semibold">Late</span> to mark individual student attendance</li>
                <li>Use <span className="font-semibold">Mark All Present/Absent</span> for bulk actions</li>
                <li>Add remarks for specific notes about attendance</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Reports Feature:</p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>Generate <span className="font-semibold">Daily, Weekly, Monthly, or Custom</span> reports</li>
                <li>Export in <span className="font-semibold">Excel or PDF</span> format</li>
                <li>Reports include all attendance data with summaries</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorAttendance;