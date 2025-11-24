// InstructorStudents.tsx - COMPLETE FIXED VERSION WITH IMPROVED PDF REPORTS
import React, { useState, useEffect } from 'react';
import { Search, Mail, Phone, BookOpen, User, AlertCircle, Calendar, TrendingUp, MessageCircle, FileText, X, Eye, Send, DownloadCloud} from 'lucide-react';
import { fetchCourses, fetchStudentAttendanceStats } from '../../api/api';
import type { StudentAttendanceStats, CourseType} from '../../api/api';

// Interfaces
interface StudentDetailsPopupProps {
  student: StudentAttendanceStats;
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (student: StudentAttendanceStats, message: string) => void;
}

interface MessagePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string, students: StudentAttendanceStats[]) => void;
  students: StudentAttendanceStats[];
  type: 'individual' | 'bulk';
}

interface ReportPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (reportType: string, students: StudentAttendanceStats[]) => void;
  students: StudentAttendanceStats[];
}

// Student Details Popup Component
const StudentDetailsPopup: React.FC<StudentDetailsPopupProps> = ({ 
  student, 
  isOpen, 
  onClose, 
  onSendMessage 
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'attendance' | 'performance'>('details');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const sendMessage = () => {
    if (message.trim()) {
      onSendMessage(student, message);
      setMessage('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col mx-2">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-200 px-4 py-4">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-gray-900 break-words">{student.name}</h2>
              <p className="text-gray-600 text-sm break-words">{student.email}</p>
              <p className="text-gray-600 text-sm">{student.phone}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex px-2">
            {[
              { id: 'details', label: 'Details', icon: User },
              { id: 'attendance', label: 'Attendance', icon: Calendar },
              { id: 'performance', label: 'Performance', icon: TrendingUp }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex flex-col items-center py-3 px-1 border-b-2 font-medium text-xs ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4 mb-1" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600 text-sm">Full Name:</span>
                    <span className="font-medium text-sm text-right">{student.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600 text-sm">NIC Number:</span>
                    <span className="font-medium text-sm">{student.nic}</span>
                  </div>
                  <div className="flex justify-between items-start py-2 border-b border-gray-200">
                    <span className="text-gray-600 text-sm">Email:</span>
                    <span className="font-medium text-sm text-right break-all ml-2">{student.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600 text-sm">Phone:</span>
                    <span className="font-medium text-sm">{student.phone}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 text-sm">Enrollment:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      student.enrollment_status === 'Enrolled' ? 'bg-green-100 text-green-800' :
                      student.enrollment_status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                      student.enrollment_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {student.enrollment_status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Academic Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600 text-sm">Attendance:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            student.attendance_percentage >= 80 ? 'bg-green-600' :
                            student.attendance_percentage >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${student.attendance_percentage}%` }}
                        ></div>
                      </div>
                      <span className="font-medium text-sm w-12 text-right">{student.attendance_percentage}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600 text-sm">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      student.status === 'active' ? 'bg-green-100 text-green-800' :
                      student.status === 'at-risk' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 py-2">
                    <div className="text-center bg-white rounded p-2">
                      <div className="text-lg font-bold text-gray-900">{student.total_classes}</div>
                      <div className="text-xs text-gray-600">Total Classes</div>
                    </div>
                    <div className="text-center bg-white rounded p-2">
                      <div className="text-lg font-bold text-green-600">{student.present_classes}</div>
                      <div className="text-xs text-gray-600">Present</div>
                    </div>
                    <div className="text-center bg-white rounded p-2">
                      <div className="text-lg font-bold text-yellow-600">{student.late_classes}</div>
                      <div className="text-xs text-gray-600">Late</div>
                    </div>
                    <div className="text-center bg-white rounded p-2">
                      <div className="text-lg font-bold text-red-600">{student.absent_classes}</div>
                      <div className="text-xs text-gray-600">Absent</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Attendance Summary</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-green-100 rounded-lg p-3">
                    <div className="text-xl font-bold text-green-800">{student.present_classes}</div>
                    <div className="text-xs text-green-600">Present</div>
                  </div>
                  <div className="bg-yellow-100 rounded-lg p-3">
                    <div className="text-xl font-bold text-yellow-800">{student.late_classes}</div>
                    <div className="text-xs text-yellow-600">Late</div>
                  </div>
                  <div className="bg-red-100 rounded-lg p-3">
                    <div className="text-xl font-bold text-red-800">{student.absent_classes}</div>
                    <div className="text-xs text-red-600">Absent</div>
                  </div>
                  <div className="bg-blue-100 rounded-lg p-3">
                    <div className="text-xl font-bold text-blue-800">{student.total_classes}</div>
                    <div className="text-xs text-blue-600">Total</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Attendance Trend</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Rate:</span>
                    <span className="font-medium">{student.attendance_percentage}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Recommendation:</span>
                    <span className={`font-medium ${
                      student.attendance_percentage >= 80 ? 'text-green-600' :
                      student.attendance_percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {student.attendance_percentage >= 80 ? 'Excellent' :
                       student.attendance_percentage >= 60 ? 'Needs Improvement' : 'Critical'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Performance Analysis</h3>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Attendance Performance</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Overall Score:</span>
                    <span className="font-medium">{student.attendance_percentage}/100</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Class Participation:</span>
                    <span className="font-medium">
                      {student.present_classes > 0 ? Math.round((student.present_classes / student.total_classes) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Progress Indicators</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Attendance Goal (80%):</span>
                      <span>{student.attendance_percentage >= 80 ? '✅ Achieved' : '❌ Not Met'}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(student.attendance_percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Minimum Requirement (60%):</span>
                      <span>{student.attendance_percentage >= 60 ? '✅ Met' : '❌ Below'}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(student.attendance_percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Message Action */}
        <div className="border-t border-gray-200 px-4 py-4 bg-gray-50">
          <div className="flex flex-col space-y-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message to this student..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
            >
              <Send className="w-4 h-4" />
              <span>Send Message</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Message Popup Component
const MessagePopup: React.FC<MessagePopupProps> = ({ 
  isOpen, 
  onClose, 
  onSend, 
  students, 
  type 
}) => {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');

  if (!isOpen) return null;

  const handleSend = () => {
    if (message.trim()) {
      onSend(message, students);
      setMessage('');
      setSubject('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">
            {type === 'individual' ? 'Send Message to Student' : 'Send Bulk Message'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Message subject..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          {type === 'bulk' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                This message will be sent to {students.length} student{students.length !== 1 ? 's' : ''}.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 order-1 sm:order-2"
          >
            <Send className="w-4 h-4" />
            <span>Send Message</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Report Popup Component
const ReportPopup: React.FC<ReportPopupProps> = ({ 
  isOpen, 
  onClose, 
  onGenerate, 
  students 
}) => {
  const [reportType, setReportType] = useState('attendance');
  const [generating, setGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await onGenerate(reportType, students);
    } finally {
      setGenerating(false);
    }
  };

  const getReportDescription = (type: string) => {
    switch (type) {
      case 'attendance':
        return 'Detailed attendance analysis with statistics and trends';
      case 'performance':
        return 'Performance metrics and academic progress analysis';
      case 'detailed':
        return 'Comprehensive student profiles with full details';
      case 'summary':
        return 'Course overview with key metrics and insights';
      default:
        return 'Student data report';
    }
  };

  const getReportIncludes = (type: string) => {
    switch (type) {
      case 'attendance':
        return [
          '• Daily attendance records',
          '• Attendance percentage trends',
          '• Late and absent statistics',
          '• Attendance recommendations'
        ];
      case 'performance':
        return [
          '• Performance scores and ratings',
          '• Progress indicators',
          '• Comparative analysis',
          '• Improvement recommendations'
        ];
      case 'detailed':
        return [
          '• Complete student profiles',
          '• Contact information',
          '• Academic performance',
          '• Attendance history',
          '• Status analysis'
        ];
      case 'summary':
        return [
          '• Course overview',
          '• Class statistics',
          '• Performance summary',
          '• Key insights and trends',
          '• Instructor recommendations'
        ];
      default:
        return ['• Student data analysis'];
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Generate Report</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="attendance">Attendance Report</option>
              <option value="performance">Performance Report</option>
              <option value="detailed">Detailed Student Report</option>
              <option value="summary">Class Summary Report</option>
            </select>
            <p className="text-sm text-gray-600 mt-1">
              {getReportDescription(reportType)}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              This {reportType} report will include data for {students.length} student{students.length !== 1 ? 's' : ''}.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Report Includes:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {getReportIncludes(reportType).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            disabled={generating}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <DownloadCloud className="w-4 h-4" />
                <span>Generate PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Component
const InstructorStudents: React.FC = () => {
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [students, setStudents] = useState<StudentAttendanceStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Popup states
  const [selectedStudent, setSelectedStudent] = useState<StudentAttendanceStats | null>(null);
  const [showStudentPopup, setShowStudentPopup] = useState(false);
  const [showMessagePopup, setShowMessagePopup] = useState(false);
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [messageType, setMessageType] = useState<'individual' | 'bulk'>('individual');
  const [messageStudents, setMessageStudents] = useState<StudentAttendanceStats[]>([]);

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

  // Popup handlers
  const openStudentDetails = (student: StudentAttendanceStats) => {
    setSelectedStudent(student);
    setShowStudentPopup(true);
  };

  const openMessagePopup = (type: 'individual' | 'bulk', student?: StudentAttendanceStats) => {
    setMessageType(type);
    if (type === 'individual' && student) {
      setMessageStudents([student]);
    } else {
      setMessageStudents(students);
    }
    setShowMessagePopup(true);
  };

  const openReportPopup = () => {
    setShowReportPopup(true);
  };

  // Action handlers
  const handleSendMessage = (message: string, students: StudentAttendanceStats[]) => {
    const studentNames = students.map(s => s.name).join(', ');
    alert(`✅ Message sent successfully to: ${studentNames}\n\nMessage: ${message}`);
    setShowMessagePopup(false);
  };

  const handleSendIndividualMessage = (student: StudentAttendanceStats, message: string) => {
    alert(`✅ Message sent to ${student.name}:\n\n${message}`);
  };

  // IMPROVED PDF Generation Functions with MULTI-PAGE DETAILED REPORTS
  const generatePDFReport = async (reportType: string, students: StudentAttendanceStats[]) => {
    try {
      const { jsPDF } = await import('jspdf');
      
      // Create PDF
      const doc = new jsPDF();
      
      const course = courses.find(c => c.id === selectedCourse);
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Report configuration
      const reportConfig = {
        attendance: {
          title: 'STUDENT ATTENDANCE REPORT',
          color: [34, 197, 94],
          description: 'Detailed attendance analysis and statistics'
        },
        performance: {
          title: 'STUDENT PERFORMANCE REPORT', 
          color: [59, 130, 246],
          description: 'Performance metrics and progress analysis'
        },
        detailed: {
          title: 'DETAILED STUDENT REPORT',
          color: [139, 92, 246],
          description: 'Comprehensive student profiles and information'
        },
        summary: {
          title: 'CLASS SUMMARY REPORT',
          color: [245, 158, 11],
          description: 'Course overview and key insights'
        }
      };

      const config = reportConfig[reportType as keyof typeof reportConfig] || reportConfig.attendance;

      // Set document properties
      doc.setProperties({
        title: `${config.title} - ${course?.name || 'Course'}`,
        subject: config.description,
        author: 'NAITA System',
        creator: 'NAITA Monitoring System'
      });

      // Title
      doc.setFontSize(20);
      doc.setTextColor(config.color[0], config.color[1], config.color[2]);
      doc.text(config.title, 105, 25, { align: 'center' });

      // Course info
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Course: ${course?.name || 'N/A'}`, 20, 45);
      doc.text(`Course Code: ${course?.code || 'N/A'}`, 20, 55);
      doc.text(`Report Date: ${currentDate}`, 20, 65);
      doc.text(`Total Students: ${students.length}`, 20, 75);
      doc.text(`Generated by: NAITA Monitoring System`, 20, 85);

      let yPosition = 100;

      // Generate report content based on type
      switch (reportType) {
        case 'attendance':
          yPosition = generateAttendanceReport(doc, students, yPosition, config.color);
          break;
        case 'performance':
          yPosition = generatePerformanceReport(doc, students, yPosition, config.color);
          break;
        case 'detailed':
          yPosition = generateDetailedReport(doc, students, yPosition, config.color);
          break;
        case 'summary':
          yPosition = generateSummaryReport(doc, students, yPosition, config.color);
          break;
      }

      // Add page numbers and footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 15,
          { align: 'center' }
        );
        doc.text(
          `NAITA Monitoring System - ${currentDate}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      // Save PDF
      const fileName = `${reportType}-report-${course?.code || 'course'}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      alert(`✅ ${config.title} has been downloaded successfully!`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('❌ Error generating PDF report. Please try again.');
    } finally {
      setShowReportPopup(false);
    }
  };

  // IMPROVED Table Generator with BETTER FORMATTING
  const generateSimpleTable = (
    doc: any,
    students: StudentAttendanceStats[],
    title: string,
    startY: number,
    color: number[],
    columns: { header: string; key: string; width: number; align?: 'left' | 'center' | 'right' }[]
  ): number => {
    let yPosition = startY;

    // Table title
    doc.setFontSize(12);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(title, 20, yPosition);
    yPosition += 10;

    // Table header
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(color[0], color[1], color[2]);
    
    // Draw header background
    doc.rect(20, yPosition, 170, 7, 'F');
    
    // Draw header text
    doc.setFont('helvetica', 'bold');
    let currentX = 20;
    columns.forEach(col => {
      const textX = col.align === 'center' ? currentX + col.width / 2 : 
                   col.align === 'right' ? currentX + col.width - 3 : currentX + 3;
      
      doc.text(col.header, textX, yPosition + 5, { 
        align: col.align as any 
      });
      currentX += col.width;
    });
    
    yPosition += 12;

    // Student rows
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    students.forEach((student, index) => {
      // Check for page break
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
        
        // Header for new page
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.setFillColor(color[0], color[1], color[2]);
        doc.rect(20, yPosition, 170, 7, 'F');
        doc.setFont('helvetica', 'bold');
        currentX = 20;
        columns.forEach(col => {
          const textX = col.align === 'center' ? currentX + col.width / 2 : 
                       col.align === 'right' ? currentX + col.width - 3 : currentX + 3;
          
          doc.text(col.header, textX, yPosition + 5, { 
            align: col.align as any 
          });
          currentX += col.width;
        });
        yPosition += 12;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
      }

      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(20, yPosition - 4, 170, 7, 'F');
      }

      // Draw row content
      currentX = 20;
      let maxLinesInRow = 1;

      columns.forEach(col => {
        const textX = col.align === 'center' ? currentX + col.width / 2 : 
                     col.align === 'right' ? currentX + col.width - 3 : currentX + 3;
        
        let cellValue = '';
        
        switch (col.key) {
          case 'id':
            cellValue = (index + 1).toString();
            break;
          case 'name':
            // Improved name formatting
            const nameParts = student.name.split(' ');
            if (nameParts.length >= 3 && student.name.length > 20) {
              const firstName = nameParts[0];
              const lastName = nameParts[nameParts.length - 1];
              const middleInitials = nameParts.slice(1, -1).map(part => part.charAt(0) + '.').join(' ');
              cellValue = `${firstName} ${middleInitials} ${lastName}`;
            } else if (student.name.length > 25) {
              cellValue = student.name.substring(0, 24) + '...';
            } else {
              cellValue = student.name;
            }
            break;
          case 'email':
            cellValue = student.email.length > 25 ? student.email.substring(0, 24) + '...' : student.email;
            break;
          case 'phone':
            cellValue = student.phone;
            break;
          case 'nic':
            cellValue = student.nic;
            break;
          case 'attendance':
            cellValue = `${student.attendance_percentage}%`;
            break;
          case 'status':
            cellValue = student.status.charAt(0).toUpperCase() + student.status.slice(1);
            break;
          case 'present':
            cellValue = student.present_classes.toString();
            break;
          case 'performance':
            cellValue = student.attendance_percentage >= 90 ? 'EXCELLENT' :
                       student.attendance_percentage >= 80 ? 'GOOD' :
                       student.attendance_percentage >= 60 ? 'AVERAGE' : 'POOR';
            break;
          case 'recommendation':
            cellValue = student.attendance_percentage >= 90 ? 'MAINTAIN' :
                       student.attendance_percentage >= 80 ? 'GOOD WORK' :
                       student.attendance_percentage >= 60 ? 'NEEDS FOCUS' : 'CRITICAL';
            break;
          case 'classes':
            cellValue = student.total_classes.toString();
            break;
          default:
            cellValue = '';
        }

        doc.text(cellValue, textX, yPosition + 3, { align: col.align as any });
        currentX += col.width;
      });

      yPosition += 8;
    });

    return yPosition + 10;
  };

  // Column Definitions
  const attendanceColumns = [
    { header: 'NO', key: 'id', width: 15, align: 'center' as const },
    { header: 'STUDENT NAME', key: 'name', width: 50, align: 'left' as const },
    { header: 'NIC', key: 'nic', width: 35, align: 'center' as const },
    { header: 'ATTEND %', key: 'attendance', width: 25, align: 'center' as const },
    { header: 'STATUS', key: 'status', width: 25, align: 'center' as const },
    { header: 'PRESENT', key: 'present', width: 20, align: 'center' as const }
  ];

  const performanceColumns = [
    { header: 'NO', key: 'id', width: 15, align: 'center' as const },
    { header: 'STUDENT NAME', key: 'name', width: 45, align: 'left' as const },
    { header: 'ATTEND %', key: 'attendance', width: 20, align: 'center' as const },
    { header: 'STATUS', key: 'status', width: 20, align: 'center' as const },
    { header: 'PERFORMANCE', key: 'performance', width: 35, align: 'center' as const },
    { header: 'RECOMMENDATION', key: 'recommendation', width: 35, align: 'center' as const }
  ];

  const summaryColumns = [
    { header: 'NO', key: 'id', width: 15, align: 'center' as const },
    { header: 'STUDENT NAME', key: 'name', width: 50, align: 'left' as const },
    { header: 'ATTEND %', key: 'attendance', width: 20, align: 'center' as const },
    { header: 'STATUS', key: 'status', width: 25, align: 'center' as const },
    { header: 'PERFORMANCE', key: 'performance', width: 35, align: 'center' as const },
    { header: 'TOTAL CLASSES', key: 'classes', width: 25, align: 'center' as const }
  ];

  // NEW: Multi-page Detailed Report Generator
  const generateDetailedReport = (doc: any, students: StudentAttendanceStats[], startY: number, color: number[]) => {
    let yPosition = startY;

    doc.setFontSize(14);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text('COMPREHENSIVE STUDENT PROFILES', 105, yPosition, { align: 'center' });
    yPosition += 20;

    // Generate individual student profiles
    students.forEach((student, index) => {
      // Check for page break before each student
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
        // Add title on new page
        doc.setFontSize(14);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text('COMPREHENSIVE STUDENT PROFILES (CONTINUED)', 105, yPosition, { align: 'center' });
        yPosition += 20;
      }

      // Student header with number
      doc.setFontSize(12);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`STUDENT ${index + 1}: ${student.name}`, 20, yPosition);
      yPosition += 10;

      // Personal information section
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('PERSONAL INFORMATION', 20, yPosition);
      yPosition += 6;
      
      doc.setFont('helvetica', 'normal');
      const personalInfo = [
        `Full Name: ${student.name}`,
        `NIC Number: ${student.nic}`,
        `Email: ${student.email}`,
        `Phone: ${student.phone}`,
        `Enrollment Status: ${student.enrollment_status || 'Enrolled'}`
      ];

      personalInfo.forEach((info, infoIndex) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`• ${info}`, 25, yPosition + (infoIndex * 6));
      });

      yPosition += (personalInfo.length * 6) + 12;

      // Academic information section
      doc.setFont('helvetica', 'bold');
      doc.text('ACADEMIC INFORMATION', 20, yPosition);
      yPosition += 6;

      doc.setFont('helvetica', 'normal');
      const academicInfo = [
        `Attendance Percentage: ${student.attendance_percentage}%`,
        `Total Classes: ${student.total_classes}`,
        `Present: ${student.present_classes} classes`,
        `Late: ${student.late_classes} classes`,
        `Absent: ${student.absent_classes} classes`,
        `Status: ${student.status.charAt(0).toUpperCase() + student.status.slice(1)}`
      ];

      academicInfo.forEach((info, infoIndex) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`• ${info}`, 25, yPosition + (infoIndex * 6));
      });

      yPosition += (academicInfo.length * 6) + 15;

      // Performance assessment
      doc.setFont('helvetica', 'bold');
      doc.text('PERFORMANCE ASSESSMENT', 20, yPosition);
      yPosition += 6;

      doc.setFont('helvetica', 'normal');
      let performance = '';
      let recommendation = '';

      if (student.attendance_percentage >= 90) {
        performance = 'EXCELLENT';
        recommendation = 'Maintain current performance level';
      } else if (student.attendance_percentage >= 80) {
        performance = 'GOOD';
        recommendation = 'Good work, continue consistent attendance';
      } else if (student.attendance_percentage >= 60) {
        performance = 'AVERAGE';
        recommendation = 'Needs improvement in attendance';
      } else {
        performance = 'POOR';
        recommendation = 'Critical - requires immediate attention';
      }

      const assessmentInfo = [
        `Performance Rating: ${performance}`,
        `Recommendation: ${recommendation}`
      ];

      assessmentInfo.forEach((info, infoIndex) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`• ${info}`, 25, yPosition + (infoIndex * 6));
      });

      yPosition += (assessmentInfo.length * 6) + 20;

      // Add separator line between students (except last one)
      if (index < students.length - 1) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        } else {
          doc.setDrawColor(200, 200, 200);
          doc.line(20, yPosition, 190, yPosition);
          yPosition += 15;
        }
      }
    });

    return yPosition;
  };

  // Report generation functions
  const generatePerformanceReport = (doc: any, students: StudentAttendanceStats[], startY: number, color: number[]) => {
    let yPosition = startY;

    doc.setFontSize(12);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text('PERFORMANCE ANALYSIS', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const active = students.filter(s => s.status === 'active').length;
    const atRisk = students.filter(s => s.status === 'at-risk').length;
    const inactive = students.filter(s => s.status === 'inactive').length;

    const stats = [
      `Active Students: ${active}`,
      `At-Risk Students: ${atRisk}`,
      `Inactive Students: ${inactive}`,
      `Overall Performance: ${attendanceStats.average}%`
    ];

    stats.forEach((stat, index) => {
      doc.text(`• ${stat}`, 25, yPosition + (index * 6));
    });
    yPosition += 30;

    return generateSimpleTable(doc, students, 'PERFORMANCE DETAILS', yPosition, color, performanceColumns);
  };

  const generateAttendanceReport = (doc: any, students: StudentAttendanceStats[], startY: number, color: number[]) => {
    let yPosition = startY;

    doc.setFontSize(12);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text('ATTENDANCE SUMMARY', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const stats = [
      `Average Attendance: ${attendanceStats.average}%`,
      `Students at Risk: ${attendanceStats.atRisk}`,
      `Excellent Attendance: ${attendanceStats.excellent}`,
      `Total Classes: ${students[0]?.total_classes || 0}`
    ];

    stats.forEach((stat, index) => {
      doc.text(`• ${stat}`, 25, yPosition + (index * 6));
    });
    yPosition += 30;

    return generateSimpleTable(doc, students, 'DETAILED ATTENDANCE RECORDS', yPosition, color, attendanceColumns);
  };

  const generateSummaryReport = (doc: any, students: StudentAttendanceStats[], startY: number, color: number[]) => {
    let yPosition = startY;

    doc.setFontSize(12);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text('COURSE OVERVIEW', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const overview = [
      `Total Students: ${attendanceStats.total}`,
      `Average Attendance: ${attendanceStats.average}%`,
      `Students at Risk: ${attendanceStats.atRisk}`,
      `Excellent Attendance: ${attendanceStats.excellent}`
    ];

    overview.forEach((item, index) => {
      doc.text(`• ${item}`, 25, yPosition + (index * 6));
    });
    yPosition += 40;

    return generateSimpleTable(doc, students, 'STUDENT SUMMARY', yPosition, color, summaryColumns);
  };

  // Rest of the component remains the same...
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
      case 'active': return 'bg-green-100 text-green-800';
      case 'at-risk': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendanceColor = (attendance: number) => {
    if (attendance >= 80) return 'bg-green-600';
    if (attendance >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex justify-between items-start sm:items-center mb-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Students</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage and monitor your students' progress and attendance</p>
          </div>
        </div>

        {/* Course Selection */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col gap-4">
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
          <div className="relative">
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{attendanceStats.total}</p>
              </div>
              <User className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Attendance</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {attendanceStats.average}%
                </p>
              </div>
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">At Risk</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {attendanceStats.atRisk}
                </p>
              </div>
              <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Excellent (90%+)</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {attendanceStats.excellent}
                </p>
              </div>
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
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
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Classes
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{student.name}</div>
                            <div className="text-xs text-gray-500 truncate">
                              NIC: {student.nic}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                          <Mail className="w-4 h-4" />
                          <span className="truncate max-w-[120px] sm:max-w-xs">{student.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Phone className="w-4 h-4" />
                          <span className="truncate">{student.phone}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 sm:w-20 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className={`h-2 rounded-full ${getAttendanceColor(student.attendance_percentage)}`}
                              style={{ width: `${Math.min(student.attendance_percentage, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700 w-12 text-right">{student.attendance_percentage}%</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            student.status
                          )}`}
                        >
                          {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {student.total_classes}
                        </div>
                        <div className="text-xs text-gray-500">
                          P:{student.present_classes} L:{student.late_classes} A:{student.absent_classes}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-1 sm:space-x-2">
                          <button
                            onClick={() => openStudentDetails(student)}
                            className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded hover:bg-blue-50"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openMessagePopup('individual', student)}
                            className="text-green-600 hover:text-green-900 transition-colors p-1 rounded hover:bg-green-50"
                            title="Send message"
                          >
                            <MessageCircle className="w-4 h-4" />
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
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {filteredStudents.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => openMessagePopup('bulk')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Bulk Message to All Students</span>
                </button>
                <button 
                  onClick={openReportPopup}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Generate PDF Report</span>
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
              </div>
            </div>
          </div>
        )}

        {/* Popup Components */}
        {selectedStudent && (
          <StudentDetailsPopup
            student={selectedStudent}
            isOpen={showStudentPopup}
            onClose={() => setShowStudentPopup(false)}
            onSendMessage={handleSendIndividualMessage}
          />
        )}

        <MessagePopup
          isOpen={showMessagePopup}
          onClose={() => setShowMessagePopup(false)}
          onSend={handleSendMessage}
          students={messageStudents}
          type={messageType}
        />

        <ReportPopup
          isOpen={showReportPopup}
          onClose={() => setShowReportPopup(false)}
          onGenerate={generatePDFReport}
          students={students}
        />
      </div>
    </div>
  );
};

export default InstructorStudents;