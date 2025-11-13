import React from 'react';
import StatsCard from '../../components/StatsCard';
import { Building2, Users, GraduationCap, TrendingUp, MapPin, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Overview: React.FC = () => {
  const enrollmentData = [
    { month: 'Jan', students: 1200 },
    { month: 'Feb', students: 1350 },
    { month: 'Mar', students: 1180 },
    { month: 'Apr', students: 1420 },
    { month: 'May', students: 1380 },
    { month: 'Jun', students: 1500 }
  ];

  const centerPerformanceData = [
    { name: 'Excellent', value: 15, color: '#16a34a' },
    { name: 'Good', value: 20, color: '#eab308' },
    { name: 'Average', value: 5, color: '#38bdf8' },
    { name: 'Needs Improvement', value: 2, color: '#365314' }
  ];

  const recentActivities = [
    { id: 1, activity: 'New center registered in Gulu', time: '2 hours ago', type: 'success' },
    { id: 2, activity: 'Monthly report submitted by Kampala Center', time: '4 hours ago', type: 'info' },
    { id: 3, activity: 'Staff training completed in Mbarara', time: '1 day ago', type: 'success' },
    { id: 4, activity: 'Equipment request pending approval', time: '2 days ago', type: 'warning' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Head Office Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor all 42 NAITA training centers across Uganda</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Centers"
            value="42"
            icon={Building2}
            trend={{ value: 5, isPositive: true }}
            color="green"
          />
          <StatsCard
            title="Active Students"
            value="15,847"
            icon={Users}
            trend={{ value: 12, isPositive: true }}
            color="yellow"
          />
          <StatsCard
            title="Total Instructors"
            value="1,234"
            icon={GraduationCap}
            trend={{ value: 8, isPositive: true }}
            color="sky"
          />
          <StatsCard
            title="Completion Rate"
            value="87%"
            icon={TrendingUp}
            trend={{ value: 3, isPositive: true }}
            color="lime"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Enrollment Trends */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Enrollment Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={enrollmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="students" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Center Performance Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Center Performance Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={centerPerformanceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {centerPerformanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activities */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'success' ? 'bg-green-100 text-green-600' :
                    activity.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {activity.type === 'warning' ? <AlertCircle className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.activity}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
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
                <div className="font-medium text-gray-900">Generate Monthly Report</div>
                <div className="text-sm text-gray-500">Create comprehensive monthly report</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Add New Center</div>
                <div className="text-sm text-gray-500">Register a new training center</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Review Approvals</div>
                <div className="text-sm text-gray-500">5 pending approvals</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;