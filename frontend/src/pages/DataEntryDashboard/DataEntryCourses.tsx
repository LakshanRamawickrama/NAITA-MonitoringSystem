// DataEntryCourses.tsx
import React, { useState } from 'react';
import SharedNavbar from '../../components/SharedNavbar';
import { Plus, Search, Filter, Edit, Trash2, BookOpen, Download } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  code: string;
  instructor: string;
  duration: string;
  startDate: string;
  status: 'active' | 'completed' | 'upcoming';
}

const DataEntryCourses: React.FC = () => {
  const [courses] = useState<Course[]>([
    {
      id: '1',
      title: 'Web Development',
      code: 'WD101',
      instructor: 'Alex Kato',
      duration: '6 months',
      startDate: '2024-02-10',
      status: 'active',
    },
    {
      id: '2',
      title: 'Mobile App Development',
      code: 'MD102',
      instructor: 'Nimali Silva',
      duration: '5 months',
      startDate: '2024-03-15',
      status: 'upcoming',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Fixed Navbar */}
      <header className="sticky top-0 z-50 shadow-md">
        <SharedNavbar userRole="data_entry" userName="Tharindu Perera" />
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
            <p className="text-gray-600 mt-2">Manage and update training course records</p>
          </div>
          <div className="flex space-x-3">
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-50 transition">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition">
              <Plus className="w-4 h-4" />
              <span>Add Course</span>
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by title, code, or instructor..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              <Filter className="w-5 h-5 mr-2" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Courses Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <BookOpen className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="text-sm font-medium text-gray-900">{course.title}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{course.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{course.instructor}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{course.duration}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{course.startDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          course.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : course.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {course.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button className="text-green-600 hover:text-green-900 transition">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">25</div>
            <div className="text-sm text-gray-600">Total Courses</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="text-2xl font-bold text-yellow-500">18</div>
            <div className="text-sm text-gray-600">Active Courses</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="text-2xl font-bold text-sky-500">5</div>
            <div className="text-sm text-gray-600">Upcoming</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="text-2xl font-bold text-lime-700">10</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>

        {/* Recent Updates */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Course Updates</h2>
          <ul className="space-y-3 text-sm text-gray-700">
            <li>✅ New course “UI/UX Design” added on 2024-03-12</li>
            <li>📘 “Web Development” attendance updated on 2024-03-15</li>
            <li>🕒 “Mobile App Development” scheduled for 2024-03-25</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default DataEntryCourses;
