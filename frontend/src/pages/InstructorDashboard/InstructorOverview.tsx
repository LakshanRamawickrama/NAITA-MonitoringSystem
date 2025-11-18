import React, { useState } from 'react';
import { Calendar, Clock, BookOpen, Users, TrendingUp, Award } from 'lucide-react';

const InstructorOverview: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const statsData = {
    weeklyHours: 32,
    totalStudents: 45,
    completedCourses: 12,
    upcomingClasses: 3,
    performance: 4.8,
    attendanceRate: 95
  };

  const upcomingClasses = [
    {
      id: '1',
      course: 'Web Development Fundamentals',
      date: '2024-01-15',
      time: '09:00 AM - 12:00 PM',
      students: 15
    },
    {
      id: '2',
      course: 'Advanced React',
      date: '2024-01-16',
      time: '02:00 PM - 05:00 PM',
      students: 12
    },
    {
      id: '3',
      course: 'Mobile App Development',
      date: '2024-01-17',
      time: '10:00 AM - 01:00 PM',
      students: 18
    }
  ];

  const recentActivity = [
    {
      id: '1',
      action: 'Graded assignments',
      course: 'Web Development',
      time: '2 hours ago'
    },
    {
      id: '2',
      action: 'Added new course materials',
      course: 'Mobile Development',
      time: '5 hours ago'
    },
    {
      id: '3',
      action: 'Scheduled office hours',
      course: 'All Courses',
      time: '1 day ago'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your teaching overview</p>
        </div>

        {/* Period Selector */}
        <div className="mb-6 flex justify-end">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{statsData.weeklyHours}h</div>
                <div className="text-sm text-gray-600">Teaching Hours</div>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{statsData.totalStudents}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{statsData.completedCourses}</div>
                <div className="text-sm text-gray-600">Completed Courses</div>
              </div>
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{statsData.upcomingClasses}</div>
                <div className="text-sm text-gray-600">Upcoming Classes</div>
              </div>
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{statsData.performance}/5.0</div>
                <div className="text-sm text-gray-600">Performance Rating</div>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{statsData.attendanceRate}%</div>
                <div className="text-sm text-gray-600">Attendance Rate</div>
              </div>
              <Award className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Classes */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Classes</h2>
            </div>
            <div className="p-6">
              {upcomingClasses.map((classItem) => (
                <div key={classItem.id} className="border-b border-gray-100 last:border-b-0 py-4 last:pb-0 first:pt-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{classItem.course}</h3>
                      <p className="text-sm text-gray-600">{classItem.date} • {classItem.time}</p>
                      <p className="text-sm text-gray-500">{classItem.students} students enrolled</p>
                    </div>
                    <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="border-b border-gray-100 last:border-b-0 py-4 last:pb-0 first:pt-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{activity.action}</h3>
                      <p className="text-sm text-gray-600">{activity.course}</p>
                    </div>
                    <span className="text-sm text-gray-500">{activity.time}</span>
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

export default InstructorOverview;