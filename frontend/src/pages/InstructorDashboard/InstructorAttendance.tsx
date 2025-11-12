// InstructorAttendance.tsx
import React, { useState } from 'react';
import SharedNavbar from '../../components/SharedNavbar';
import { Calendar, Users, CheckCircle, XCircle, Clock, Download, Filter, Search } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  date: string;
  studentName: string;
  studentNIC: string;
  course: string;
  status: 'present' | 'absent' | 'late';
  checkInTime?: string;
  remarks?: string;
}

interface RecentRecord {
  id: string;
  date: string;
  course: string;
  totalStudents: number;
  present: number;
  absent: number;
  status: 'completed' | 'pending';
}

const InstructorAttendance: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([
    { id: '1', date: '2024-03-15', studentName: 'Kamal Perera', studentNIC: '123456789V', course: 'Web Development', status: 'present', checkInTime: '08:55' },
    { id: '2', date: '2024-03-15', studentName: 'Nimali Silva', studentNIC: '987654321V', course: 'Web Development', status: 'absent', remarks: 'Sick leave' },
    { id: '3', date: '2024-03-15', studentName: 'Saman Kumara', studentNIC: '456789123V', course: 'Web Development', status: 'late', checkInTime: '09:15', remarks: 'Traffic delay' },
    { id: '4', date: '2024-03-15', studentName: 'Priya Fernando', studentNIC: '789123456V', course: 'Web Development', status: 'present', checkInTime: '08:50' },
  ]);

  const [selectedDate, setSelectedDate] = useState('2024-03-15');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAttendance = attendance.filter(record =>
    record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.studentNIC.includes(searchTerm) ||
    record.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateAttendanceStatus = (id: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev =>
      prev.map(record =>
        record.id === id
          ? { ...record, status, checkInTime: status !== 'absent' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined }
          : record
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4" />;
      case 'absent': return <XCircle className="w-4 h-4" />;
      case 'late': return <Clock className="w-4 h-4" />;
      default: return null;
    }
  };

  const stats = {
    total: attendance.length,
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length
  };

  // Recent records (read-only)
  const recentRecords: RecentRecord[] = [
    { id: '1', date: '2024-03-15', course: 'Web Development', totalStudents: 25, present: 22, absent: 3, status: 'completed' },
    { id: '2', date: '2024-03-14', course: 'UI/UX Design', totalStudents: 30, present: 27, absent: 3, status: 'completed' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNavbar userRole="instructor" userName="Alex Kato" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
            <p className="text-gray-600 mt-1">Track and manage student attendance</p>
          </div>
          <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-50">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>

        {/* Stats & Table */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"/>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
            <div><p className="text-sm font-medium text-gray-600">Total</p><p className="text-2xl font-bold text-gray-900">{stats.total}</p></div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
            <div><p className="text-sm font-medium text-gray-600">Present</p><p className="text-2xl font-bold text-gray-900">{stats.present}</p></div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
            <div><p className="text-sm font-medium text-gray-600">Absent</p><p className="text-2xl font-bold text-gray-900">{stats.absent}</p></div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400"/>
            <input type="text" placeholder="Search attendance records..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"><Filter className="w-5 h-5"/><span>Filter</span></button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attendance Table */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIC</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAttendance.map(record => (
                    <tr key={record.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.studentName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.studentNIC}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.course}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.checkInTime || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {getStatusIcon(record.status)}
                          <span className="capitalize">{record.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate">{record.remarks || 'No remarks'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button onClick={() => updateAttendanceStatus(record.id, 'present')} className="text-green-600 hover:text-green-900 text-xs transition">Present</button>
                        <button onClick={() => updateAttendanceStatus(record.id, 'absent')} className="text-red-600 hover:text-red-900 text-xs transition">Absent</button>
                        <button onClick={() => updateAttendanceStatus(record.id, 'late')} className="text-yellow-600 hover:text-yellow-900 text-xs transition">Late</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Records */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Records</h2>
            <div className="space-y-4">
              {recentRecords.map(record => (
                <div key={record.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-gray-900">{record.course}</div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${record.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{record.status}</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">{record.date}</div>
                  <div className="flex justify-between text-sm">
                    <div className="text-green-600">{record.present} Present</div>
                    <div className="text-red-600">{record.absent} Absent</div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(record.present / record.totalStudents) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorAttendance;
