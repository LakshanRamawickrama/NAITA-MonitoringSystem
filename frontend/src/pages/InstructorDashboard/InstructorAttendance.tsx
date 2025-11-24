// InstructorAttendance.tsx - USING REAL DATA
import React, { useState, useEffect } from 'react';
import { Calendar, Users, CheckCircle, XCircle, Clock, Download, Search, BookOpen } from 'lucide-react';
import { fetchCourses, fetchCourseStudents, bulkUpdateAttendance, } from '../../api/api';
import type { CourseType, StudentAttendance } from '../../api/api';

const InstructorAttendance: React.FC = () => {
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
    } catch (error) {
      console.error('Failed to load students:', error);
      // Fallback to empty array
      setStudents([]);
      updateSummary([]);
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
            check_in_time: status !== 'absent' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
            remarks: status === 'absent' ? student.remarks : null
          }
        : student
    );
    
    setStudents(updatedStudents);
    updateSummary(updatedStudents);

    // Save to backend
    await saveAttendanceToBackend(updatedStudents);
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
    if (!selectedCourse) return;
    
    setSaving(true);
    try {
      await bulkUpdateAttendance(selectedCourse, {
        date: selectedDate,
        attendance: studentList.map(student => ({
          student_id: student.id,
          status: student.attendance_status || 'absent',
          check_in_time: student.check_in_time || undefined,
          remarks: student.remarks || undefined
        }))
      });
    } catch (error) {
      console.error('Failed to save attendance:', error);
      // Revert on error - reload from server
      loadCourseStudents();
    } finally {
      setSaving(false);
    }
  };

  const markAllAsPresent = async () => {
    const updatedStudents = students.map(student => ({
      ...student,
      attendance_status: 'present' as const,
      check_in_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      remarks: student.remarks
    }));
    
    setStudents(updatedStudents);
    updateSummary(updatedStudents);
    await saveAttendanceToBackend(updatedStudents);
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.nic.includes(searchTerm)
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

  const exportAttendance = () => {
    // Implementation for exporting attendance data
    console.log('Exporting attendance data...');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
            <p className="text-gray-600 mt-1">Track and manage student attendance</p>
          </div>
          <div className="flex items-center space-x-4">
            {saving && (
              <div className="flex items-center text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                Saving...
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
                >
                  <option value="">Select a course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name} - {course.code}
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
                placeholder="Search students by name or NIC..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={markAllAsPresent}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition whitespace-nowrap"
            >
              Mark All Present
            </button>
            <button
              onClick={loadCourseStudents}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition whitespace-nowrap"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => updateStudentStatus(student.id, 'present')}
                          className="text-green-600 hover:text-green-900 text-sm transition px-2 py-1 rounded hover:bg-green-50"
                        >
                          Present
                        </button>
                        <button
                          onClick={() => updateStudentStatus(student.id, 'absent')}
                          className="text-red-600 hover:text-red-900 text-sm transition px-2 py-1 rounded hover:bg-red-50"
                        >
                          Absent
                        </button>
                        <button
                          onClick={() => updateStudentStatus(student.id, 'late')}
                          className="text-yellow-600 hover:text-yellow-900 text-sm transition px-2 py-1 rounded hover:bg-yellow-50"
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
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorAttendance;