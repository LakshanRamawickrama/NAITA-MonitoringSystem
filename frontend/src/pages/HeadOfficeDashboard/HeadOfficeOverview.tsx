// src/pages/HeadOfficeDashboard/Overview.tsx
import React, { useState, useEffect } from 'react';
import StatsCard from '../../components/StatsCard';
import { Building2, Users, GraduationCap, TrendingUp, MapPin, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';
import { fetchOverview } from '../../api/api';

const Overview: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetchOverview();
        console.log('Backend response:', response); // Debug log
        setData(response);
      } catch (err: any) {
        const msg = err.response?.data?.detail || 'Failed to load overview data';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen text-gray-600">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-600">{error}</div>;
  }

  if (!data) {
    return <div className="flex justify-center items-center min-h-screen text-gray-600">No data available</div>;
  }

  // Use the exact field names from backend
  const {
    total_centers = 0,
    active_students = 0,
    total_instructors = 0,
    completion_rate = 0,
    enrollment_data = [],
    center_performance_data = [],
    recent_activities = [],
    trends = {
      centers: { value: 0, isPositive: false },
      students: { value: 0, isPositive: false },
      instructors: { value: 0, isPositive: false },
      completion: { value: 0, isPositive: false },
    }
  } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Head Office Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor all {total_centers} NAITA training centers across Sri Lanka</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Centers"
            value={total_centers.toString()}
            icon={Building2}
            trend={trends.centers}
            color="green"
          />
          <StatsCard
            title="Active Students"
            value={active_students.toLocaleString()}
            icon={Users}
            trend={trends.students}
            color="yellow"
          />
          <StatsCard
            title="Total Instructors"
            value={total_instructors.toLocaleString()}
            icon={GraduationCap}
            trend={trends.instructors}
            color="sky"
          />
          <StatsCard
            title="Completion Rate"
            value={`${completion_rate}%`}
            icon={TrendingUp}
            trend={trends.completion}
            color="lime"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Enrollment Trends */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Enrollment Trends</h3>
            {enrollment_data.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={enrollment_data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="students" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500">No enrollment data available</p>
            )}
          </div>

          {/* Center Performance Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Center Performance Distribution</h3>
            {center_performance_data.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={center_performance_data}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {center_performance_data.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500">No performance data available</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activities */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
            <div className="space-y-4">
              {recent_activities.length > 0 ? (
                recent_activities.map((activity: any) => (
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
                ))
              ) : (
                <p className="text-center text-gray-500">No recent activities</p>
              )}
            </div>
          </div>

          {/* Additional Summary Cards */}
          <div className="space-y-6">
            {/* District Summary */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">District Coverage</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Districts Covered</span>
                  <span className="font-semibold">25</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active This Month</span>
                  <span className="font-semibold text-green-600">18</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">New This Week</span>
                  <span className="font-semibold text-blue-600">3</span>
                </div>
              </div>
            </div>

            {/* Training Summary */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Courses</span>
                  <span className="font-semibold">156</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completed This Month</span>
                  <span className="font-semibold text-green-600">42</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Upcoming</span>
                  <span className="font-semibold text-blue-600">28</span>
                </div>
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
                  <div className="text-sm text-gray-500">Pending approvals</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System Status Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">API Status</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Operational
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Database</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Healthy
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last Backup</span>
                <span className="text-sm font-medium">Today, 02:00 AM</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Response Time</span>
                <span className="text-sm font-medium">128ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Uptime</span>
                <span className="text-sm font-medium">99.8%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Users</span>
                <span className="text-sm font-medium">247</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Updates</h3>
            <div className="space-y-3">
              <div className="text-sm">
                <div className="font-medium text-gray-900">System Maintenance</div>
                <div className="text-gray-500">Completed on Nov 19, 2024</div>
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">New Features</div>
                <div className="text-gray-500">Student import/export added</div>
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">Security Update</div>
                <div className="text-gray-500">Applied latest patches</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;