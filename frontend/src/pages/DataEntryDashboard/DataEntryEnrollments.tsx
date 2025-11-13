// DataEntryEnrollments.tsx
import React, { useState } from 'react';
import { Plus, Search, Filter, CheckCircle, XCircle, Clock, User, BookOpen } from 'lucide-react';

interface Enrollment {
  id: string;
  studentName: string;
  studentNIC: string;
  courseName: string;
  courseCode: string;
  enrollmentDate: string;
  status: 'pending' | 'approved' | 'rejected';
  assignedInstructor?: string;
}

const DataEntryEnrollments: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([
    {
      id: '1',
      studentName: 'Kamal Perera',
      studentNIC: '123456789V',
      courseName: 'Web Development',
      courseCode: 'WD101',
      enrollmentDate: '2024-03-15',
      status: 'approved',
      assignedInstructor: 'John Smith'
    },
    {
      id: '2',
      studentName: 'Nimali Silva',
      studentNIC: '987654321V',
      courseName: 'Mobile Development',
      courseCode: 'MAD102',
      enrollmentDate: '2024-03-16',
      status: 'pending'
    },
    {
      id: '3',
      studentName: 'Saman Kumara',
      studentNIC: '456789123V',
      courseName: 'Web Development',
      courseCode: 'WD101',
      enrollmentDate: '2024-03-14',
      status: 'rejected'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredEnrollments = enrollments.filter(enrollment =>
    enrollment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.studentNIC.includes(searchTerm) ||
    enrollment.courseName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateEnrollmentStatus = (id: string, status: 'pending' | 'approved' | 'rejected') => {
    setEnrollments(prev =>
      prev.map(enrollment =>
        enrollment.id === id ? { ...enrollment, status } : enrollment
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enrollment Management</h1>
            <p className="text-gray-600">Process and manage student enrollments</p>
          </div>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition">
            <Plus className="w-5 h-5" />
            <span>New Enrollment</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
              </div>
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {enrollments.filter(e => e.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {enrollments.filter(e => e.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">
                  {enrollments.filter(e => e.status === 'rejected').length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search enrollments by student name, NIC, or course..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-5 h-5" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Enrollments Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEnrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <User className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{enrollment.studentName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{enrollment.studentNIC}</td>
                    <td className="px-6 py-4 whitespace-nowrap flex items-center">
                      <BookOpen className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{enrollment.courseName}</div>
                        <div className="text-sm text-gray-500">{enrollment.courseCode}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{enrollment.enrollmentDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{enrollment.assignedInstructor || 'Not assigned'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(enrollment.status)}`}>
                        {getStatusIcon(enrollment.status)}
                        <span className="capitalize">{enrollment.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {enrollment.status === 'pending' && (
                        <>
                          <button onClick={() => updateEnrollmentStatus(enrollment.id, 'approved')} className="text-green-600 hover:text-green-900 transition">Approve</button>
                          <button onClick={() => updateEnrollmentStatus(enrollment.id, 'rejected')} className="text-red-600 hover:text-red-900 transition">Reject</button>
                        </>
                      )}
                      <button className="text-blue-600 hover:text-blue-900 transition">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataEntryEnrollments;
