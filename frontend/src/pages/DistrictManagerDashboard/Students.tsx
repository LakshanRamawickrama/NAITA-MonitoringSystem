import React, { useState } from 'react';
import DataTable from '../../components/DataTable';
import { Search, Plus, User, Phone, Mail } from 'lucide-react';

const Students: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const studentsData = [
    {
      id: 1,
      name: 'John Mukasa',
      email: 'john.mukasa@email.com',
      phone: '+256 700 111 222',
      course: 'IT & Computing',
      batch: 'IT-2024-01',
      enrollmentDate: '2024-01-10',
      status: 'Active',
      attendance: '92%'
    },
    {
      id: 2,
      name: 'Mary Namuli',
      email: 'mary.namuli@email.com',
      phone: '+256 700 222 333',
      course: 'Welding & Fabrication',
      batch: 'WF-2024-01',
      enrollmentDate: '2024-01-08',
      status: 'Active',
      attendance: '88%'
    },
    {
      id: 3,
      name: 'David Ssemakula',
      email: 'david.ssemakula@email.com',
      phone: '+256 700 333 444',
      course: 'Automotive Technology',
      batch: 'AT-2024-01',
      enrollmentDate: '2024-01-12',
      status: 'Active',
      attendance: '95%'
    },
    {
      id: 4,
      name: 'Grace Akello',
      email: 'grace.akello@email.com',
      phone: '+256 700 444 555',
      course: 'Electrical Installation',
      batch: 'EI-2024-01',
      enrollmentDate: '2024-01-05',
      status: 'Completed',
      attendance: '90%'
    },
    {
      id: 5,
      name: 'Peter Wanyama',
      email: 'peter.wanyama@email.com',
      phone: '+256 700 555 666',
      course: 'IT & Computing',
      batch: 'IT-2024-02',
      enrollmentDate: '2024-01-15',
      status: 'Active',
      attendance: '85%'
    }
  ];

  const columns = [
    {
      key: 'name',
      label: 'Student',
      render: (value: string, row: any) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 flex items-center">
              <Mail className="w-3 h-3 mr-1" />
              {row.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'course',
      label: 'Course',
      render: (value: string, row: any) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">Batch: {row.batch}</div>
        </div>
      )
    },
    {
      key: 'phone',
      label: 'Contact',
      render: (value: string) => (
        <div className="flex items-center">
          <Phone className="w-4 h-4 mr-1 text-gray-400" />
          <span className="text-sm text-gray-600">{value}</span>
        </div>
      )
    },
    {
      key: 'enrollmentDate',
      label: 'Enrollment Date',
      render: (value: string) => (
        <span className="text-sm text-gray-600">{value}</span>
      )
    },
    {
      key: 'attendance',
      label: 'Attendance',
      render: (value: string) => (
        <span className={`font-medium ${
          parseInt(value) >= 90 ? 'text-green-600' :
          parseInt(value) >= 80 ? 'text-yellow-600' :
          'text-red-600'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value === 'Active' ? 'bg-green-100 text-green-800' :
          value === 'Completed' ? 'bg-blue-100 text-blue-800' :
          value === 'Suspended' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    }
  ];

  const filteredData = studentsData.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.batch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Students</h1>
              <p className="text-gray-600 mt-2">Manage students in your training center</p>
            </div>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search students, courses, or batches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option value="">All Courses</option>
              <option value="it">IT & Computing</option>
              <option value="welding">Welding & Fabrication</option>
              <option value="automotive">Automotive Technology</option>
              <option value="electrical">Electrical Installation</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Students Table */}
        <DataTable
          columns={columns}
          data={filteredData}
          currentPage={currentPage}
          totalPages={Math.ceil(filteredData.length / 10)}
          onPageChange={setCurrentPage}
        />

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">450</div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-yellow-500">420</div>
            <div className="text-sm text-gray-600">Active Students</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-sky-400">25</div>
            <div className="text-sm text-gray-600">Completed This Month</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-lime-800">90%</div>
            <div className="text-sm text-gray-600">Average Attendance</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Students;