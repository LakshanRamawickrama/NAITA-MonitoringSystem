// src/pages/HeadOfficeDashboard/Overview.tsx
import React, { useState, useEffect } from 'react';
import StatsCard from '../../components/StatsCard';
import { Building2, Users, GraduationCap, TrendingUp, MapPin, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
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
    },
    district_summary = {
      total_districts: 0,
      active_districts: 0,
      new_districts_week: 0
    },
    training_summary = {
      active_courses: 0,
      completed_month: 0,
      upcoming: 0
    },
    system_stats = {
      api_status: 'Unknown',
      database_status: 'Unknown',
      last_backup: 'N/A'
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
                    outerRadius={80}
                    dataKey="value"
                  >
                    {center_performance_data.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500">No performance data available</p>
            )}
          </div>
        </div>

        {/* Bottom Section: Operations, Activity, System */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">

          {/* 1. District Summary */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-gray-400" />
              District Coverage
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Total Districts</span>
                <span className="font-bold text-gray-900 text-lg">{district_summary.total_districts}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Active Saturation</span>
                  <span className="font-medium text-green-600">{Math.round((district_summary.active_districts / (district_summary.total_districts || 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-1000" style={{ width: `${(district_summary.active_districts / (district_summary.total_districts || 1)) * 100}%` }}></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-2 rounded border border-gray-100">
                  <div className="text-xs text-gray-500 uppercase">Active</div>
                  <div className="font-semibold text-gray-900">{district_summary.active_districts}</div>
                </div>
                <div className="text-center p-2 rounded border border-gray-100">
                  <div className="text-xs text-gray-500 uppercase">New (7d)</div>
                  <div className="font-semibold text-blue-600">+{district_summary.new_districts_week}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Training Summary */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <GraduationCap className="w-5 h-5 mr-2 text-gray-400" />
              Training Overview
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl text-center border border-blue-100">
                  <div className="text-2xl font-bold text-blue-700">{training_summary.active_courses}</div>
                  <div className="text-xs text-blue-600 font-bold uppercase tracking-wide mt-1">Active Courses</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl text-center border border-green-100">
                  <div className="text-2xl font-bold text-green-700">{training_summary.completed_month}</div>
                  <div className="text-xs text-green-600 font-bold uppercase tracking-wide mt-1">Completed</div>
                </div>
              </div>
              <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Pending Approval</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {training_summary.upcoming} Courses
                </span>
              </div>
            </div>
          </div>

          {/* 3. System Health */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="relative flex h-3 w-3 mr-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </div>
              System Health
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Active Users</span>
                <span className="font-bold text-gray-900 text-lg">{system_stats.active_users}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 mb-1">API Status</span>
                  <span className={`text-sm font-bold flex items-center ${system_stats.api_status === 'Operational' ? 'text-green-600' : 'text-red-600'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${system_stats.api_status === 'Operational' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    {system_stats.api_status}
                  </span>
                </div>
                <div className="flex flex-col p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500 mb-1">Database</span>
                  <span className={`text-sm font-bold flex items-center ${system_stats.database_status === 'Healthy' ? 'text-green-600' : 'text-red-600'}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${system_stats.database_status === 'Healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    {system_stats.database_status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Recent Activities (Standard Card Size) */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 flex flex-col h-[320px]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Latest
              </span>
            </div>
            <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
              {recent_activities.length > 0 ? (
                recent_activities.map((activity: any) => (
                  <div key={activity.id} className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 last:pb-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${activity.type === 'success' ? 'bg-green-100 text-green-600' :
                        activity.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-blue-100 text-blue-600'
                      }`}>
                      {activity.type === 'warning' ? <AlertCircle className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-snug truncate">{activity.activity}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <div className="mb-2">No recent activities</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;