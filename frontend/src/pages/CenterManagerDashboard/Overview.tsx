import React from 'react';
import SharedNavbar from '../../components/SharedNavbar';
import StatsCard from '../../components/StatsCard';
import { Users, GraduationCap, BookOpen, TrendingUp, Calendar} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const Overview: React.FC = () => {
  const attendanceData = [
    { day: 'Mon', attendance: 85 },
    { day: 'Tue', attendance: 92 },
    { day: 'Wed', attendance: 88 },
    { day: 'Thu', attendance: 90 },
    { day: 'Fri', attendance: 87 },
    { day: 'Sat', attendance: 78 }
  ];

  const courseEnrollment = [
    { course: 'IT', students: 120 },
    { course: 'Welding', students: 95 },
    { course: 'Auto', students: 80 },
    { course: 'Electrical', students: 65 }
  ];

  const upcomingEvents = [
    { id: 1, title: 'IT Course Graduation', date: '2024-01-20', type: 'graduation' },
    { id: 2, title: 'New Welding Batch Intake', date: '2024-01-25', type: 'intake' },
    { id: 3, title: 'Staff Training Workshop', date: '2024-01-30', type: 'training' },
    { id: 4, title: 'Equipment Maintenance', date: '2024-02-05', type: 'maintenance' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNavbar userRole="center_manager" userName="Sarah Nakato" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Center Manager Dashboard</h1>
          <p className="text-gray-600 mt-2">NAITA Kampala Center - Overview and Management</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Students"
            value="450"
            icon={Users}
            trend={{ value: 8, isPositive: true }}
            color="green"
          />
          <StatsCard
            title="Active Courses"
            value="12"
            icon={BookOpen}
            trend={{ value: 2, isPositive: true }}
            color="yellow"
          />
          <StatsCard
            title="Instructors"
            value="25"
            icon={GraduationCap}
            trend={{ value: 1, isPositive: true }}
            color="sky"
          />
          <StatsCard
            title="Completion Rate"
            value="92%"
            icon={TrendingUp}
            trend={{ value: 5, isPositive: true }}
            color="lime"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Weekly Attendance */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Attendance Rate</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="attendance" stroke="#16a34a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Course Enrollment */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Enrollment</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={courseEnrollment}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="course" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="students" fill="#eab308" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Events */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className={`p-2 rounded-full ${
                    event.type === 'graduation' ? 'bg-green-100 text-green-600' :
                    event.type === 'intake' ? 'bg-blue-100 text-blue-600' :
                    event.type === 'training' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    <p className="text-xs text-gray-500">{event.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Mark Attendance</div>
                <div className="text-sm text-gray-500">Record daily attendance</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Add New Student</div>
                <div className="text-sm text-gray-500">Register new student</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Generate Report</div>
                <div className="text-sm text-gray-500">Monthly center report</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Request Approval</div>
                <div className="text-sm text-gray-500">Submit new request</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;