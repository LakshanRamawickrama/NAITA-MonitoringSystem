import React, { useState, useEffect } from 'react';
import { Search, Mail, Phone, BookOpen, User, AlertCircle, Calendar, TrendingUp, MessageCircle, X, Eye, Send, ChevronDown, ChevronUp } from 'lucide-react';
import {
  fetchMyCourses,
  fetchStudentAttendanceStats,
  fetchStudentById,
  type StudentType,
  type StudentAttendanceStats,
  type CourseType
} from '../../api/api';

// Update the interface to include StudentType details
interface EnhancedStudentStats extends StudentAttendanceStats {
  student_details?: StudentType;
}

// Interfaces
interface StudentDetailsPopupProps {
  student: EnhancedStudentStats;
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (student: EnhancedStudentStats, message: string) => void;
}

interface MessagePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string, students: EnhancedStudentStats[]) => void;
  students: EnhancedStudentStats[];
  type: 'individual' | 'bulk';
}

// Mobile Student Card Component
interface MobileStudentCardProps {
  student: EnhancedStudentStats;
  onViewDetails: (student: EnhancedStudentStats) => void;
  onSendMessage: (student: EnhancedStudentStats) => void;
}

const MobileStudentCard: React.FC<MobileStudentCardProps> = ({
  student,
  onViewDetails,
  onSendMessage
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

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

  // Get profile photo URL
  const profilePhotoUrl = student.student_details?.profile_photo_url;
  const fullName = student.student_details?.full_name_english || student.name;
  const gender = student.student_details?.gender;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3 shadow-sm">
      {/* Student Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${profilePhotoUrl ? '' : 'bg-gradient-to-br from-blue-100 to-indigo-100'
            }`}>
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt={fullName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-blue-100', 'to-indigo-100');
                }}
              />
            ) : (
              <User className="w-5 h-5 text-blue-700" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-gray-900 text-sm break-words">
              {fullName}
            </h3>
            <p className="text-gray-500 text-xs mt-1 break-words">{student.email}</p>
            <p className="text-gray-500 text-xs">NIC: {student.nic}</p>
            {gender && (
              <p className="text-gray-500 text-xs">Gender: {gender}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-2 p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-12 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getAttendanceColor(student.attendance_percentage)}`}
              style={{ width: `${Math.min(student.attendance_percentage, 100)}%` }}
            ></div>
          </div>
          <span className="text-xs font-medium text-gray-700">{student.attendance_percentage}%</span>
        </div>
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.status)}`}
        >
          {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
        </span>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
          {/* Contact Info */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <Phone className="w-3 h-3" />
              <span>{student.phone}</span>
            </div>
          </div>

          {/* Class Summary */}
          <div className="bg-gray-50 rounded p-2">
            <div className="grid grid-cols-4 gap-1 text-center">
              <div>
                <div className="text-xs font-bold text-gray-900">{student.total_classes}</div>
                <div className="text-[10px] text-gray-600">Total</div>
              </div>
              <div>
                <div className="text-xs font-bold text-green-600">{student.present_classes}</div>
                <div className="text-[10px] text-gray-600">Present</div>
              </div>
              <div>
                <div className="text-xs font-bold text-yellow-600">{student.late_classes}</div>
                <div className="text-[10px] text-gray-600">Late</div>
              </div>
              <div>
                <div className="text-xs font-bold text-red-600">{student.absent_classes}</div>
                <div className="text-[10px] text-gray-600">Absent</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <button
              onClick={() => onViewDetails(student)}
              className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-xs font-medium hover:bg-blue-700 transition flex items-center justify-center space-x-1"
            >
              <Eye className="w-3 h-3" />
              <span>Details</span>
            </button>
            <button
              onClick={() => onSendMessage(student)}
              className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-xs font-medium hover:bg-green-700 transition flex items-center justify-center space-x-1"
            >
              <MessageCircle className="w-3 h-3" />
              <span>Message</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Student Details Popup Component (Improved for Mobile)
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

  // Get student details
  const studentDetails = student.student_details;
  const profilePhotoUrl = studentDetails?.profile_photo_url;
  const fullName = studentDetails?.full_name_english || student.name;
  const nameWithInitials = studentDetails?.name_with_initials || student.name;
  const gender = studentDetails?.gender;
  const dateOfBirth = studentDetails?.date_of_birth;
  const address = studentDetails?.address_line;
  const district = studentDetails?.district;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col mx-2">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-200 px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden ${profilePhotoUrl ? '' : 'bg-gradient-to-br from-blue-100 to-indigo-100'
              }`}>
              {profilePhotoUrl ? (
                <img
                  src={profilePhotoUrl}
                  alt={fullName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-blue-100', 'to-indigo-100');
                  }}
                />
              ) : (
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 break-words">
                {fullName}
              </h2>
              {nameWithInitials && nameWithInitials !== fullName && (
                <p className="text-gray-600 text-xs sm:text-sm break-words">
                  {nameWithInitials}
                </p>
              )}
              <p className="text-gray-600 text-xs sm:text-sm break-words">{student.email}</p>
              <p className="text-gray-600 text-xs sm:text-sm">{student.phone}</p>
              {gender && (
                <p className="text-gray-600 text-xs sm:text-sm">Gender: {gender}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex px-1 sm:px-2">
            {[
              { id: 'details', label: 'Details', icon: User },
              { id: 'attendance', label: 'Attendance', icon: Calendar },
              { id: 'performance', label: 'Performance', icon: TrendingUp }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex flex-col items-center py-2 sm:py-3 px-1 border-b-2 font-medium text-xs ${activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <tab.icon className="w-3 h-3 sm:w-4 sm:h-4 mb-1" />
                <span className="text-xs">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {activeTab === 'details' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Personal Information</h3>
                <div className="space-y-2 sm:space-y-3">
                  {[
                    { label: 'Full Name', value: fullName },
                    { label: 'Name with Initials', value: nameWithInitials },
                    { label: 'NIC Number', value: student.nic },
                    { label: 'Gender', value: gender || 'Not specified' },
                    { label: 'Date of Birth', value: dateOfBirth || 'Not specified' },
                    { label: 'Email', value: student.email },
                    { label: 'Phone', value: student.phone },
                    { label: 'Address', value: address || 'Not specified' },
                    { label: 'District', value: district || 'Not specified' },
                    { label: 'Marital Status', value: studentDetails?.marital_status || 'Not specified' },
                    { label: 'Enrollment Status', value: student.enrollment_status, isStatus: true }
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-1 sm:py-2 border-b border-gray-200 last:border-b-0">
                      <span className="text-gray-600 text-xs sm:text-sm">{item.label}:</span>
                      {item.isStatus ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.value === 'Enrolled' ? 'bg-green-100 text-green-800' :
                          item.value === 'Completed' ? 'bg-blue-100 text-blue-800' :
                            item.value === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                          }`}>
                          {item.value}
                        </span>
                      ) : (
                        <span className="font-medium text-xs sm:text-sm text-right break-all ml-2">{item.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Educational Qualifications</h3>

                {/* O/L Results */}
                {studentDetails?.ol_results && studentDetails.ol_results.length > 0 ? (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">G.C.E. O/L Results ({studentDetails.ol_results[0].year})</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {studentDetails.ol_results.map((result, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{result.subject}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${result.grade === 'A' ? 'bg-green-100 text-green-800' :
                                    result.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                      result.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                        result.grade === 'S' ? 'bg-gray-100 text-gray-800' :
                                          'bg-red-100 text-red-800'
                                  }`}>
                                  {result.grade}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 text-sm text-gray-500 italic">No O/L results available</div>
                )}

                {/* A/L Results */}
                {studentDetails?.al_results && studentDetails.al_results.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">G.C.E. A/L Results ({studentDetails.al_results[0].year})</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {studentDetails.al_results.map((result, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">{result.subject}</td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${result.grade === 'A' ? 'bg-green-100 text-green-800' :
                                    result.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                      result.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                        result.grade === 'S' ? 'bg-gray-100 text-gray-800' :
                                          'bg-red-100 text-red-800'
                                  }`}>
                                  {result.grade}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">No A/L results available</div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Academic Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-1 sm:py-2 border-b border-gray-200">
                    <span className="text-gray-600 text-xs sm:text-sm">Attendance:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-12 sm:w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${student.attendance_percentage >= 80 ? 'bg-green-600' :
                            student.attendance_percentage >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}
                          style={{ width: `${student.attendance_percentage}%` }}
                        ></div>
                      </div>
                      <span className="font-medium text-xs sm:text-sm w-8 sm:w-12 text-right">{student.attendance_percentage}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-1 sm:py-2 border-b border-gray-200">
                    <span className="text-gray-600 text-xs sm:text-sm">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.status === 'active' ? 'bg-green-100 text-green-800' :
                      student.status === 'at-risk' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 py-1 sm:py-2">
                    <div className="text-center bg-white rounded p-2">
                      <div className="text-sm sm:text-lg font-bold text-gray-900">{student.total_classes}</div>
                      <div className="text-xs text-gray-600">Total Classes</div>
                    </div>
                    <div className="text-center bg-white rounded p-2">
                      <div className="text-sm sm:text-lg font-bold text-green-600">{student.present_classes}</div>
                      <div className="text-xs text-gray-600">Present</div>
                    </div>
                    <div className="text-center bg-white rounded p-2">
                      <div className="text-sm sm:text-lg font-bold text-yellow-600">{student.late_classes}</div>
                      <div className="text-xs text-gray-600">Late</div>
                    </div>
                    <div className="text-center bg-white rounded p-2">
                      <div className="text-sm sm:text-lg font-bold text-red-600">{student.absent_classes}</div>
                      <div className="text-xs text-gray-600">Absent</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Attendance Summary</h3>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <div className="grid grid-cols-2 gap-2 sm:gap-3 text-center">
                  <div className="bg-green-100 rounded-lg p-2 sm:p-3">
                    <div className="text-lg sm:text-xl font-bold text-green-800">{student.present_classes}</div>
                    <div className="text-xs text-green-600">Present</div>
                  </div>
                  <div className="bg-yellow-100 rounded-lg p-2 sm:p-3">
                    <div className="text-lg sm:text-xl font-bold text-yellow-800">{student.late_classes}</div>
                    <div className="text-xs text-yellow-600">Late</div>
                  </div>
                  <div className="bg-red-100 rounded-lg p-2 sm:p-3">
                    <div className="text-lg sm:text-xl font-bold text-red-800">{student.absent_classes}</div>
                    <div className="text-xs text-red-600">Absent</div>
                  </div>
                  <div className="bg-blue-100 rounded-lg p-2 sm:p-3">
                    <div className="text-lg sm:text-xl font-bold text-blue-800">{student.total_classes}</div>
                    <div className="text-xs text-blue-600">Total</div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Attendance Trend</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>Current Rate:</span>
                    <span className="font-medium">{student.attendance_percentage}%</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>Recommendation:</span>
                    <span className={`font-medium ${student.attendance_percentage >= 80 ? 'text-green-600' :
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
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Performance Analysis</h3>

              <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Attendance Performance</h4>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>Overall Score:</span>
                    <span className="font-medium">{student.attendance_percentage}/100</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>Class Participation:</span>
                    <span className="font-medium">
                      {student.present_classes > 0 ? Math.round((student.present_classes / student.total_classes) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Progress Indicators</h4>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <div className="flex justify-between text-xs sm:text-sm mb-2">
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
                    <div className="flex justify-between text-xs sm:text-sm mb-2">
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

        {/* Message Input */}
        <div className="border-t border-gray-200 px-3 sm:px-4 py-3 sm:py-4 bg-gray-50">
          <div className="flex flex-col space-y-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message to this student..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-xs sm:text-sm"
            >
              <Send className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Send Message</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Message Popup Component (Improved for Mobile)
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col mx-2">
        <div className="flex justify-between items-center border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            {type === 'individual' ? 'Send Message' : 'Bulk Message'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Message subject..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          {type === 'bulk' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-3">
              <p className="text-xs sm:text-sm text-yellow-800">
                This message will be sent to {students.length} student{students.length !== 1 ? 's' : ''}.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-xs sm:text-sm order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-xs sm:text-sm order-1 sm:order-2"
          >
            <Send className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Send Message</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Component - REAL DATA ONLY
const InstructorStudents: React.FC = () => {
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [students, setStudents] = useState<EnhancedStudentStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [coursesLoading, setCoursesLoading] = useState(true);

  // Popup states
  const [selectedStudent, setSelectedStudent] = useState<EnhancedStudentStats | null>(null);
  const [showStudentPopup, setShowStudentPopup] = useState(false);
  const [showMessagePopup, setShowMessagePopup] = useState(false);
  const [messageType, setMessageType] = useState<'individual' | 'bulk'>('individual');
  const [messageStudents, setMessageStudents] = useState<EnhancedStudentStats[]>([]);

  const [attendanceStats, setAttendanceStats] = useState({
    average: 0,
    atRisk: 0,
    excellent: 0,
    total: 0
  });

  // Load ONLY instructor's assigned courses
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
          calculateOverallStats([]);
        }
      } catch (error) {
        console.error('Failed to load assigned courses:', error);
        setCourses([]);
        setSelectedCourse(null);
        setStudents([]);
        calculateOverallStats([]);
      } finally {
        setCoursesLoading(false);
      }
    };
    loadCourses();
  }, []);

  // Load student attendance stats when course changes
  useEffect(() => {
    if (selectedCourse) {
      loadStudentStats();
    } else {
      setStudents([]);
      calculateOverallStats([]);
    }
  }, [selectedCourse]);

  const loadStudentStats = async () => {
    if (!selectedCourse) return;

    setLoading(true);
    try {
      // First fetch attendance stats
      const studentStats = await fetchStudentAttendanceStats(selectedCourse);

      // Then fetch detailed information for each student
      const enhancedStudents = await Promise.all(
        studentStats.map(async (stat) => {
          try {
            const studentDetails = await fetchStudentById(stat.id);
            return {
              ...stat,
              student_details: studentDetails
            };
          } catch (error) {
            console.error(`Failed to fetch details for student ${stat.id}:`, error);
            return {
              ...stat,
              student_details: undefined
            };
          }
        })
      );

      setStudents(enhancedStudents);
      calculateOverallStats(enhancedStudents);
    } catch (error) {
      console.error('Failed to load student statistics:', error);
      setStudents([]);
      calculateOverallStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallStats = (studentList: EnhancedStudentStats[]) => {
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
  const openStudentDetails = (student: EnhancedStudentStats) => {
    setSelectedStudent(student);
    setShowStudentPopup(true);
  };

  const openMessagePopup = (type: 'individual' | 'bulk', student?: EnhancedStudentStats) => {
    setMessageType(type);
    if (type === 'individual' && student) {
      setMessageStudents([student]);
    } else {
      setMessageStudents(students);
    }
    setShowMessagePopup(true);
  };

  // Action handlers
  const handleSendMessage = (message: string, students: EnhancedStudentStats[]) => {
    const studentNames = students.map(s => s.student_details?.full_name_english || s.name).join(', ');
    alert(`✅ Message sent successfully to: ${studentNames}\n\nMessage: ${message}`);
    setShowMessagePopup(false);
  };

  const handleSendIndividualMessage = (student: EnhancedStudentStats, message: string) => {
    alert(`✅ Message sent to ${student.student_details?.full_name_english || student.name}:\n\n${message}`);
  };

  const filteredStudents = students.filter(student => {
    const studentName = student.student_details?.full_name_english || student.name;
    const matchesSearch =
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.student_details?.name_with_initials &&
        student.student_details.name_with_initials.toLowerCase().includes(searchTerm.toLowerCase())) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.nic.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">My Students</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage and monitor your students' progress and attendance</p>
            {courses.length === 0 && !coursesLoading && (
              <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-3">
                <p className="text-yellow-800 text-xs sm:text-sm">
                  No courses assigned to you yet. Please contact administrator to get assigned to courses.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Course Selection */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                Select Your Course
              </label>
              {coursesLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-green-600"></div>
                  <span className="text-gray-500 text-xs sm:text-sm">Loading your courses...</span>
                </div>
              ) : (
                <select
                  value={selectedCourse || ''}
                  onChange={(e) => setSelectedCourse(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm focus:ring-1 sm:focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              {selectedCourse && (
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {courses.find(c => c.id === selectedCourse)?.center_details?.district || 'No district info'} •
                  {courses.find(c => c.id === selectedCourse)?.center_details?.name || 'No center info'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm focus:ring-1 sm:focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={students.length === 0}
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
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="relative">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-2.5 sm:top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search students by name, email or NIC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-1 sm:focus:ring-2 focus:ring-green-500 focus:border-transparent text-xs sm:text-sm"
              disabled={students.length === 0}
            />
          </div>
        </div>

        {/* Stats */}
        {selectedCourse && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 lg:p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{attendanceStats.total}</p>
                </div>
                <User className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 lg:p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Average Attendance</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                    {attendanceStats.average}%
                  </p>
                </div>
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 lg:p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">At Risk</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                    {attendanceStats.atRisk}
                  </p>
                </div>
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-yellow-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 lg:p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Excellent (90%+)</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                    {attendanceStats.excellent}
                  </p>
                </div>
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-purple-600" />
              </div>
            </div>
          </div>
        )}

        {/* Students List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          {coursesLoading ? (
            <div className="flex justify-center items-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-600 text-sm sm:text-base">Loading your courses...</span>
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-600 text-sm sm:text-base">Loading students...</span>
            </div>
          ) : !selectedCourse ? (
            <div className="text-center py-8 sm:py-12">
              <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <p className="text-gray-500 text-base sm:text-lg">Please select a course to view students</p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="md:hidden p-3 sm:p-4">
                {filteredStudents.map((student) => (
                  <MobileStudentCard
                    key={student.id}
                    student={student}
                    onViewDetails={openStudentDetails}
                    onSendMessage={(student) => openMessagePopup('individual', student)}
                  />
                ))}

                {filteredStudents.length === 0 && students.length > 0 && (
                  <div className="text-center py-8">
                    <Search className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <p className="text-gray-500 text-base sm:text-lg">No students match your search criteria</p>
                  </div>
                )}

                {students.length === 0 && selectedCourse && (
                  <div className="text-center py-8">
                    <User className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <p className="text-gray-500 text-base sm:text-lg">No students found for this course</p>
                    <p className="text-gray-400 text-xs sm:text-sm mt-2">
                      Students will appear here once they are enrolled in this course
                    </p>
                  </div>
                )}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block overflow-x-auto">
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
                    {filteredStudents.map((student) => {
                      const profilePhotoUrl = student.student_details?.profile_photo_url;
                      const fullName = student.student_details?.full_name_english || student.name;
                      const gender = student.student_details?.gender;

                      return (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 overflow-hidden ${profilePhotoUrl ? '' : 'bg-gradient-to-br from-blue-100 to-indigo-100'
                                }`}>
                                {profilePhotoUrl ? (
                                  <img
                                    src={profilePhotoUrl}
                                    alt={fullName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-blue-100', 'to-indigo-100');
                                    }}
                                  />
                                ) : (
                                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {fullName}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  NIC: {student.nic}
                                </div>
                                {gender && (
                                  <div className="text-xs text-gray-500 truncate">
                                    Gender: {gender}
                                  </div>
                                )}
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
                                  className={`h-2 rounded-full ${student.attendance_percentage >= 80 ? 'bg-green-600' :
                                    student.attendance_percentage >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                                    }`}
                                  style={{ width: `${Math.min(student.attendance_percentage, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-700 w-12 text-right">{student.attendance_percentage}%</span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${student.status === 'active' ? 'bg-green-100 text-green-800' :
                                student.status === 'at-risk' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}
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
                      );
                    })}
                  </tbody>
                </table>

                {filteredStudents.length === 0 && students.length > 0 && (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No students match your search criteria</p>
                  </div>
                )}

                {students.length === 0 && selectedCourse && (
                  <div className="text-center py-12">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No students found for this course</p>
                    <p className="text-gray-400 text-sm mt-2">
                      Students will appear here once they are enrolled in this course
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        {filteredStudents.length > 0 && (
          <div className="mt-4 sm:mt-6">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => openMessagePopup('bulk')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Bulk Message to All Students</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mt-4 sm:mt-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Course Summary</h3>
              <div className="space-y-2 text-xs sm:text-sm text-gray-600">
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
      </div>
    </div>
  );
};

export default InstructorStudents;