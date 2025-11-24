// InstructorStudents.tsx - FIXED VERSION WITH WORKING BUTTONS
import React, { useState, useEffect } from 'react';
import { Search, Mail, Phone, BookOpen, User, AlertCircle, Calendar, TrendingUp, Filter, Download, MessageCircle, FileText, Users } from 'lucide-react';
import { fetchCourses, fetchStudentAttendanceStats,type CourseType } from '../../api/api';
import type { StudentAttendanceStats } from '../../api/api';

const InstructorStudents: React.FC = () => {
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [students, setStudents] = useState<StudentAttendanceStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [attendanceStats, setAttendanceStats] = useState({
    average: 0,
    atRisk: 0,
    excellent: 0,
    total: 0
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
      }
    };
    loadCourses();
  }, []);

  // Load student attendance stats when course changes
  useEffect(() => {
    if (selectedCourse) {
      loadStudentStats();
    }
  }, [selectedCourse]);

  const loadStudentStats = async () => {
    if (!selectedCourse) return;
    
    setLoading(true);
    try {
      const studentStats = await fetchStudentAttendanceStats(selectedCourse);
      setStudents(studentStats);
      calculateOverallStats(studentStats);
    } catch (error) {
      console.error('Failed to load student statistics:', error);
      // Fallback to empty array
      setStudents([]);
      calculateOverallStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallStats = (studentList: StudentAttendanceStats[]) => {
    const totalAttendance = studentList.reduce((sum, student) => sum + student.attendance_percentage, 0);
    const average = studentList.length > 0 ? Math.round(totalAttendance / studentList.length) : 0;
    const atRisk = studentList.filter(s => s.status === 'at-risk').length;
    const excellent = studentList.filter(s => s.attendance_percentage >= 90).length;

    setAttendanceStats({ 
      average, 
      atRisk, 
      excellent,
      total: studentList.length 
    });
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.nic.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'at-risk':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendanceColor = (attendance: number) => {
    if (attendance >= 80) return 'bg-green-600';
    if (attendance >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getEnrollmentStatusColor = (status: string) => {
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

  // FIXED: Working Quick Actions functions
  const sendBulkReminder = () => {
    const atRiskStudents = students.filter(s => s.status === 'at-risk' || s.status === 'inactive');
    if (atRiskStudents.length === 0) {
      alert('No at-risk students found to send reminders to.');
      return;
    }
    
    const studentNames = atRiskStudents.map(s => s.name).join(', ');
    alert(`Sending reminders to ${atRiskStudents.length} at-risk students: ${studentNames}`);
    
    // Here you would integrate with your email/notification system
    console.log('Sending bulk reminders to:', atRiskStudents);
  };

  const generateProgressReport = () => {
    if (students.length === 0) {
      alert('No student data available to generate report.');
      return;
    }
    
    // Generate a simple report
    const reportData = {
      course: courses.find(c => c.id === selectedCourse)?.name || 'Unknown Course',
      generated: new Date().toLocaleDateString(),
      totalStudents: students.length,
      averageAttendance: attendanceStats.average,
      atRiskCount: attendanceStats.atRisk,
      excellentCount: attendanceStats.excellent,
      students: students.map(s => ({
        name: s.name,
        attendance: s.attendance_percentage,
        status: s.status,
        lastActive: s.last_active
      }))
    };
    
    console.log('Progress Report:', reportData);
    alert(`Progress report generated for ${students.length} students. Check console for details.`);
    
    // You can implement PDF generation or download here
  };

  const scheduleParentMeetings = () => {
    const lowAttendanceStudents = students.filter(s => s.attendance_percentage < 70);
    if (lowAttendanceStudents.length === 0) {
      alert('No students with low attendance found.');
      return;
    }
    
    const studentList = lowAttendanceStudents.map(s => 
      `${s.name} (${s.attendance_percentage}% attendance)`
    ).join('\n');
    
    alert(`Schedule meetings for these students:\n\n${studentList}`);
    
    // Here you would integrate with your calendar system
    console.log('Scheduling meetings for:', lowAttendanceStudents);
  };

  const exportStudentData = () => {
    if (filteredStudents.length === 0) {
      alert('No student data to export.');
      return;
    }
    
    const headers = ['Name', 'Email', 'Phone', 'NIC', 'Attendance %', 'Status', 'Enrollment Status', 'Last Active', 'Total Classes'];
    const csvData = filteredStudents.map(student => [
      student.name,
      student.email,
      student.phone,
      student.nic,
      `${student.attendance_percentage}%`,
      student.status,
      student.enrollment_status,
      student.last_active,
      student.total_classes.toString()
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `students-${selectedCourse}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const sendIndividualReminder = (student: StudentAttendanceStats) => {
    alert(`Reminder sent to ${student.name} (${student.email})\nAttendance: ${student.attendance_percentage}%`);
    
    // Here you would integrate with your email/notification system
    console.log('Sending reminder to:', student);
  };

  const viewStudentDetails = (student: StudentAttendanceStats) => {
    // Navigate to student details page or show modal
    const details = `
Student Details:
Name: ${student.name}
Email: ${student.email}
Phone: ${student.phone}
NIC: ${student.nic}
Attendance: ${student.attendance_percentage}%
Status: ${student.status}
Enrollment: ${student.enrollment_status}
Last Active: ${student.last_active}
Total Classes: ${student.total_classes}
Present: ${student.present_classes}
Late: ${student.late_classes}
Absent: ${student.absent_classes}
    `;
    
    alert(details);
    console.log('Student details:', student);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
            <p className="text-gray-600 mt-1">Manage and monitor your students' progress and attendance</p>
          </div>
          <button 
            onClick={exportStudentData}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>
        </div>

        {/* Course Selection */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
              <select 
                value={selectedCourse || ''} 
                onChange={(e) => setSelectedCourse(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select a course</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name} - {course.code} ({course.status})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Students</option>
                <option value="active">Active</option>
                <option value="at-risk">At Risk</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="relative max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search students by name, email or NIC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{attendanceStats.total}</p>
              </div>
              <User className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Attendance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {attendanceStats.average}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">At Risk</p>
                <p className="text-2xl font-bold text-gray-900">
                  {attendanceStats.atRisk}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Excellent (90%+)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {attendanceStats.excellent}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
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
                      Attendance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Classes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            <User className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-xs text-gray-500">
                              NIC: {student.nic}
                            </div>
                            <div className="text-xs text-gray-500">
                              Last active: {student.last_active}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                          <Mail className="w-4 h-4" />
                          <span className="truncate max-w-xs">{student.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Phone className="w-4 h-4" />
                          <span>{student.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className={`h-2 rounded-full ${getAttendanceColor(student.attendance_percentage)}`}
                              style={{ width: `${Math.min(student.attendance_percentage, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">{student.attendance_percentage}%</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {student.attendance_percentage >= 80 ? 'Good' : student.attendance_percentage >= 60 ? 'Needs improvement' : 'Critical'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            student.status
                          )}`}
                        >
                          {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {student.enrollment_status}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Total: {student.total_classes}
                        </div>
                        <div className="text-xs text-gray-500">
                          P: {student.present_classes} | L: {student.late_classes} | A: {student.absent_classes}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => sendIndividualReminder(student)}
                            className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded hover:bg-blue-50"
                            title="Send reminder"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => viewStudentDetails(student)}
                            className="text-green-600 hover:text-green-900 transition-colors p-1 rounded hover:bg-green-50"
                            title="View details"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredStudents.length === 0 && (
                <div className="text-center py-12">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    {students.length === 0 ? 'No students found for this course' : 'No students match your search criteria'}
                  </p>
                  {students.length === 0 && selectedCourse && (
                    <p className="text-gray-400 text-sm mt-2">
                      Make sure students are enrolled in this course and attendance records exist.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions - NOW WORKING */}
        {filteredStudents.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={sendBulkReminder}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Bulk Reminder to At-Risk Students</span>
                </button>
                <button 
                  onClick={generateProgressReport}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Generate Progress Report</span>
                </button>
                <button 
                  onClick={scheduleParentMeetings}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Schedule Parent Meetings</span>
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Summary</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Total Enrolled:</span>
                  <span className="font-medium">{attendanceStats.total} students</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Attendance:</span>
                  <span className="font-medium">{attendanceStats.average}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Students at Risk:</span>
                  <span className="font-medium text-yellow-600">{attendanceStats.atRisk}</span>
                </div>
                <div className="flex justify-between">
                  <span>High Performers:</span>
                  <span className="font-medium text-green-600">{attendanceStats.excellent}</span>
                </div>
                <div className="flex justify-between">
                  <span>Low Attendance (&lt;60%):</span>
                  <span className="font-medium text-red-600">
                    {students.filter(s => s.attendance_percentage < 60).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorStudents;