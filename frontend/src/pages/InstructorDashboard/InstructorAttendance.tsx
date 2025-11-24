// InstructorAttendance.tsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Calendar, Users, CheckCircle, XCircle, Clock, Download, Search, BookOpen, Save, RefreshCw } from 'lucide-react';
import { fetchCourses, fetchCourseStudents, bulkUpdateAttendance } from '../../api/api';
import type { CourseType, StudentAttendance } from '../../api/api';

const InstructorAttendance: React.FC = () => {
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [summary, setSummary] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0
  });

  // Load instructor's courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const instructorCourses = await fetchCourses();
        setCourses(instructorCourses);
        if (instructorCourses.length > 0) {
          setSelectedCourse(instructorCourses[0].id);
        }
      } catch (error) {
        console.error('Failed to load courses:', error);
        showSaveStatus('error', 'Failed to load courses');
      }
    };
    loadCourses();
  }, []);

  // Load students when course or date changes
  useEffect(() => {
    if (selectedCourse) {
      loadCourseStudents();
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
      
      // Fallback: Create mock students for testing if API fails
      const mockStudents: StudentAttendance[] = [
        {
          id: 1,
          name: 'Kamal Perera',
          email: 'kamal@email.com',
          phone: '0771234567',
          nic: '123456789V',
          attendance_status: null,
          check_in_time: null,
          remarks: null
        },
        {
          id: 2,
          name: 'Nimali Silva',
          email: 'nimali@email.com',
          phone: '0762345678',
          nic: '987654321V',
          attendance_status: null,
          check_in_time: null,
          remarks: null
        },
        {
          id: 3,
          name: 'Saman Kumara',
          email: 'saman@email.com',
          phone: '0753456789',
          nic: '456789123V',
          attendance_status: null,
          check_in_time: null,
          remarks: null
        },
        {
          id: 4,
          name: 'Priya Fernando',
          email: 'priya@email.com',
          phone: '0744567890',
          nic: '789123456V',
          attendance_status: null,
          check_in_time: null,
          remarks: null
        },
      ];
      
      setStudents(mockStudents);
      updateSummary(mockStudents);
      showSaveStatus('error', 'Using demo data - API connection failed');
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

    // Auto-save after status change
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
      console.log('Saving attendance data:', {
        courseId: selectedCourse,
        date: selectedDate,
        attendance: studentList.map(student => ({
          student_id: student.id,
          status: student.attendance_status || 'absent',
          check_in_time: student.check_in_time || undefined,
          remarks: student.remarks || undefined
        }))
      });

      const result = await bulkUpdateAttendance(selectedCourse, {
        date: selectedDate,
        attendance: studentList.map(student => ({
          student_id: student.id,
          status: student.attendance_status || 'absent',
          check_in_time: student.check_in_time || undefined,
          remarks: student.remarks || undefined
        }))
      });
      
      console.log('Attendance save response:', result);
      
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
      
      // Don't revert immediately - let user see the error and decide
      // loadCourseStudents();
    } finally {
      setSaving(false);
    }
  };

  const showSaveStatus = (status: 'success' | 'error' | 'idle', message: string = '') => {
    setSaveStatus(status);
    setSaveMessage(message);
    
    // Auto-clear success messages after 3 seconds
    if (status === 'success') {
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 3000);
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

  const exportAttendance = () => {
    if (students.length === 0) {
      showSaveStatus('error', 'No attendance data to export');
      return;
    }

    const headers = ['Student Name', 'NIC', 'Email', 'Phone', 'Status', 'Check-in Time', 'Remarks', 'Date'];
    const csvData = students.map(student => [
      student.name,
      student.nic,
      student.email,
      student.phone,
      student.attendance_status || 'Not marked',
      student.check_in_time || '-',
      student.remarks || '-',
      selectedDate
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-${selectedCourse}-${selectedDate}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    showSaveStatus('success', 'Attendance data exported successfully');
  };

  const getCourseName = () => {
    const course = courses.find(c => c.id === selectedCourse);
    return course ? `${course.name} - ${course.code}` : 'Select a course';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
            <p className="text-gray-600 mt-1">Track and manage student attendance</p>
            <p className="text-sm text-gray-500 mt-1">
              Course: <span className="font-medium">{getCourseName()}</span>
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {saveStatus !== 'idle' && (
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${getSaveStatusColor()}`}>
                <span className="text-sm font-medium">{saveMessage}</span>
              </div>
            )}
            <button 
              onClick={exportAttendance}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Course Selection & Date */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
                <select 
                  value={selectedCourse || ''} 
                  onChange={(e) => setSelectedCourse(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={loading}
                >
                  <option value="">Select a course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name} - {course.code} ({course.status})
                    </option>
                  ))}
                </select>
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
                disabled={loading}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={markAllAsPresent}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition whitespace-nowrap flex items-center space-x-2"
                disabled={loading || saving}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark All Present</span>
              </button>
              <button
                onClick={markAllAsAbsent}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition whitespace-nowrap flex items-center space-x-2"
                disabled={loading || saving}
              >
                <XCircle className="w-4 h-4" />
                <span>Mark All Absent</span>
              </button>
              <button
                onClick={clearAllAttendance}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition whitespace-nowrap flex items-center space-x-2"
                disabled={loading || saving}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Clear All</span>
              </button>
              <button
                onClick={() => saveAttendanceToBackend(students)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition whitespace-nowrap flex items-center space-x-2"
                disabled={loading || saving}
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
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-600">Loading students...</span>
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
              
              {filteredStudents.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    {students.length === 0 ? 'No students found for this course' : 'No students match your search'}
                  </p>
                  {students.length === 0 && selectedCourse && (
                    <div className="mt-4 space-y-2">
                      <p className="text-gray-400 text-sm">
                        Make sure students are enrolled in this course through the student management system.
                      </p>
                      <p className="text-gray-400 text-sm">
                        If this is a new course, you may need to wait for student enrollments.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

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
              <p className="font-medium">Auto-Save Feature:</p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>Attendance is automatically saved when you change status</li>
                <li>Use <span className="font-semibold">Save All</span> to manually save all changes</li>
                <li>Export data anytime using the <span className="font-semibold">Export Report</span> button</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorAttendance;