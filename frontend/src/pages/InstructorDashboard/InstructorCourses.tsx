// InstructorCourses.tsx
import React, { useState } from 'react';
import { Calendar, Users, Clock, BookOpen, BarChart3, Layers, Search, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface Course {
  id: string;
  name: string;
  code: string;
  schedule: string;
  students: number;
  progress: number;
  nextSession: string;
  category?: string;
}

const InstructorCourses: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const courses: Course[] = [
    {
      id: '1',
      name: 'Web Development Fundamentals',
      code: 'WD101',
      schedule: 'Mon, Wed, Fri • 9:00–11:00 AM',
      students: 25,
      progress: 75,
      nextSession: 'Today, 9:00 AM',
      category: 'Frontend Development',
    },
    {
      id: '2',
      name: 'Advanced JavaScript',
      code: 'JS201',
      schedule: 'Tue, Thu • 1:00–3:00 PM',
      students: 18,
      progress: 45,
      nextSession: 'Tomorrow, 1:00 PM',
      category: 'Programming',
    },
    {
      id: '3',
      name: 'Database Management',
      code: 'DB301',
      schedule: 'Mon, Wed • 11:00–1:00 PM',
      students: 22,
      progress: 60,
      nextSession: 'Today, 11:00 AM',
      category: 'Backend Development',
    },
  ];

  const filteredCourses = courses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.category && course.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
     
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
            <p className="text-gray-600 mt-2">Monitor your active courses and student engagement</p>
          </div>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Create New Course</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search courses or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <motion.div
              key={course.id}
              className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow"
              whileHover={{ scale: 1.02 }}
            >
              {/* Course Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
                  <p className="text-sm text-gray-500">{course.code}</p>
                  {course.category && (
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Layers className="w-4 h-4 mr-1 text-green-500" />
                      {course.category}
                    </div>
                  )}
                </div>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                  {course.progress}% Complete
                </span>
              </div>

              {/* Course Info */}
              <div className="space-y-2 mb-5 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <span>{course.schedule}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <span>{course.students} students enrolled</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span>Next: {course.nextSession}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{course.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-green-700 transition-colors">
                  <BookOpen className="w-4 h-4" />
                  <span>Manage Content</span>
                </button>
                <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-100 transition-colors">
                  <BarChart3 className="w-4 h-4" />
                  <span>View Reports</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">8</div>
            <div className="text-sm text-gray-600">Total Courses</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-yellow-500">5</div>
            <div className="text-sm text-gray-600">Active Courses</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-sky-500">65%</div>
            <div className="text-sm text-gray-600">Avg Progress</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-lime-800">150</div>
            <div className="text-sm text-gray-600">Total Students Enrolled</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorCourses;
