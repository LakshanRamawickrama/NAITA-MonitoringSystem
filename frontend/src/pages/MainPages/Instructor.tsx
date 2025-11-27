import React, { useState } from 'react';
import { Plus, Search, Mail, Phone, Edit, Trash2, User } from 'lucide-react';

const Instructors: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const instructorsData = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@naita.lk',
      phone: '+94 77 123 4567',
      specialization: 'Web Development',
      courses: 3,
      status: 'Active',
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.j@naita.lk',
      phone: '+94 76 234 5678',
      specialization: 'Mobile Development',
      courses: 2,
      status: 'Active',
    },
    {
      id: '3',
      name: 'Peter Wanyama',
      email: 'peter.w@naita.lk',
      phone: '+94 77 345 6789',
      specialization: 'Electrical Installation',
      courses: 1,
      status: 'On Leave',
    },
  ];

  const filteredInstructors = instructorsData.filter(
    (instructor) =>
      instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Instructor Management</h1>
            <p className="text-gray-600 mt-2">Manage instructors and their assigned courses</p>
          </div>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Instructor</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search instructors or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Instructors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInstructors.map((instructor) => (
            <div
              key={instructor.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{instructor.name}</h3>
                  <p className="text-sm text-gray-500">{instructor.specialization}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{instructor.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{instructor.phone}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Courses Assigned:{' '}
                  <span className="font-semibold text-gray-900">{instructor.courses}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    instructor.status === 'Active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {instructor.status}
                </span>
                <div className="flex space-x-2">
                  <button className="text-green-600 hover:text-green-900 p-1">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-900 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">15</div>
            <div className="text-sm text-gray-600">Total Instructors</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-yellow-500">12</div>
            <div className="text-sm text-gray-600">Active Instructors</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-sky-500">3</div>
            <div className="text-sm text-gray-600">On Leave</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-lime-800">5</div>
            <div className="text-sm text-gray-600">Average Courses per Instructor</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instructors;
