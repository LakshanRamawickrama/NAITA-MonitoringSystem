// HeadofficeCourses.tsx
import React, { useState } from 'react';
import { Search, Filter, BookOpen } from 'lucide-react';

interface Course {
  id: number;
  name: string;
  code: string;
  duration: string;
  instructor: string;
  students: number;
  status: string;
  district: string;
}

const HeadofficeCourses: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');

  const coursesData: Course[] = [
    {
      id: 1,
      name: 'Web Development',
      code: 'WD101',
      duration: '6 months',
      instructor: 'John Smith',
      students: 25,
      status: 'Active',
      district: 'District A',
    },
    {
      id: 2,
      name: 'Mobile App Development',
      code: 'MAD102',
      duration: '4 months',
      instructor: 'Sarah Johnson',
      students: 18,
      status: 'Active',
      district: 'District A',
    },
    {
      id: 3,
      name: 'Electrical Installation',
      code: 'EI103',
      duration: '5 months',
      instructor: 'Peter Wanyama',
      students: 20,
      status: 'Inactive',
      district: 'District B',
    },
    {
      id: 4,
      name: 'Data Science Fundamentals',
      code: 'DS104',
      duration: '3 months',
      instructor: 'Alice Brown',
      students: 15,
      status: 'Active',
      district: 'District B',
    },
  ];

  const districts = ['All Districts', ...new Set(coursesData.map(course => course.district))];

  let filteredCourses = coursesData.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedDistrict !== 'All Districts') {
    filteredCourses = filteredCourses.filter(course => course.district === selectedDistrict);
  }

  const groupedCourses = filteredCourses.reduce((acc: { [key: string]: Course[] }, course) => {
    if (!acc[course.district]) {
      acc[course.district] = [];
    }
    acc[course.district].push(course);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Courses Overview (District-wise)</h1>
              <p className="text-gray-600 mt-2">View and monitor courses across districts</p>
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search courses, instructors, or districts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* District-wise Sections */}
        {Object.entries(groupedCourses).map(([district, courses]) => (
          <div key={district} className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{district}</h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Instructor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Students
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {courses.map((course) => (
                      <tr key={course.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-green-700" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{course.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {course.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {course.duration}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {course.instructor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {course.students}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              course.status === 'Active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {course.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}

        {/* Stats Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{filteredCourses.length}</div>
            <div className="text-sm text-gray-600">Total Courses</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-yellow-500">
              {filteredCourses.filter(c => c.status === 'Active').length}
            </div>
            <div className="text-sm text-gray-600">Active Courses</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-sky-500">{filteredCourses.reduce((acc, c) => acc + c.students, 0)}</div>
            <div className="text-sm text-gray-600">Total Enrolled Students</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-lime-800">95%</div>
            <div className="text-sm text-gray-600">Avg Course Completion</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeadofficeCourses;