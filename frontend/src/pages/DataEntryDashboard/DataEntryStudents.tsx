// DataEntryStudents.tsx
import React, { useState } from 'react';
import { Plus, Search, Filter, Download, Upload, Edit, Trash2, User, Clock } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  nic: string;
  email: string;
  phone: string;
  course: string;
  enrollmentDate: string;
  status: 'active' | 'completed' | 'dropped';
}

const DataEntryStudents: React.FC = () => {
  const [students] = useState<Student[]>([
    {
      id: '1',
      name: 'Kamal Perera',
      nic: '123456789V',
      email: 'kamal@email.com',
      phone: '0771234567',
      course: 'Web Development',
      enrollmentDate: '2024-01-15',
      status: 'active',
    },
    {
      id: '2',
      name: 'Nimali Silva',
      nic: '987654321V',
      email: 'nimali@email.com',
      phone: '0762345678',
      course: 'Mobile Development',
      enrollmentDate: '2024-02-01',
      status: 'active',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.nic.includes(searchTerm) ||
      student.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const recentStudents = [...students]
    .sort(
      (a, b) =>
        new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime()
    )
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Data Entry</h1>
            <p className="text-gray-600">Manage student records and information</p>
          </div>
          <div className="flex space-x-3">
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-50 transition">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-50 transition">
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition">
              <Plus className="w-5 h-5" />
              <span>Add Student</span>
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search students by name, NIC, or course..."
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

        {/* Recent Records */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-green-600" />
            Recent Records
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {recentStudents.map((student) => (
              <div
                key={student.id}
                className="bg-white shadow-sm rounded-lg p-4 flex items-center justify-between hover:shadow-md transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{student.name}</p>
                    <p className="text-sm text-gray-500">{student.course}</p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    student.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : student.status === 'completed'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {student.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <User className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{student.nic}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {student.phone}
                      <div className="text-xs text-gray-400">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{student.course}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{student.enrollmentDate}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          student.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : student.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium space-x-2">
                      <button className="text-green-600 hover:text-green-900 transition">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-500 py-6">
                      No student records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataEntryStudents;
