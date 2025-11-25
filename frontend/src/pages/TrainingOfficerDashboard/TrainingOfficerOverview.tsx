import React, { useState, useEffect } from 'react';
import StatsCard from '../../components/StatsCard';
import { Users, GraduationCap, BookOpen, TrendingUp, Building2, Target, FileText, CheckCircle, AlertCircle, Clock, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { fetchOverview, fetchDashboardStats, type OverviewDataType, type DashboardStatsType } from '../../api/api';
import { useNavigate } from 'react-router-dom';

const TrainingOfficerOverview: React.FC = () => {
  const [overviewData, setOverviewData] = useState<OverviewDataType | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    try {
      setLoading(true);
      const [overviewResponse, statsResponse] = await Promise.all([
        fetchOverview(),
        fetchDashboardStats()
      ]);
      setOverviewData(overviewResponse);
      setDashboardStats(statsResponse);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error loading overview:', err);
    } finally {
      setLoading(false);
    }
  };

  // Process real data for charts
  const enrollmentData = overviewData?.enrollment_data?.map((item) => ({
    month: item.month,
    students: item.students
  })) || [];

  const centerPerformanceData = overviewData?.center_performance_data || [];

  const recentActivities = overviewData?.recent_activities || [];

  // Quick Actions Handlers - Only Courses and Instructors
  const handleViewCourses = () => {
    navigate('/dashboard/training_officer/courses');
  };

  const handleManageInstructors = () => {
    navigate('/dashboard/training_officer/instructors');
  };

  // Get activity icon based on type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'info':
        return <FileText className="w-4 h-4" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={loadOverviewData}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50"> 
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Training Officer Dashboard</h1>
          <p className="text-gray-600 mt-2">
            {localStorage.getItem('user_district') ? 
              `${localStorage.getItem('user_district')} District - Training Overview` : 
              'Training Program Overview'
            }
          </p>
        </div>

        {/* Stats Cards with Real Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Centers"
            value={overviewData?.total_centers?.toString() || "0"}
            icon={Building2}
            trend={overviewData?.trends?.centers || { value: 0, isPositive: true }}
            color="sky"
          />
          <StatsCard
            title="Active Students"
            value={overviewData?.active_students?.toString() || "0"}
            icon={Users}
            trend={overviewData?.trends?.students || { value: 0, isPositive: true }}
            color="green"
          />
          <StatsCard
            title="Instructors"
            value={overviewData?.total_instructors?.toString() || "0"}
            icon={GraduationCap}
            trend={overviewData?.trends?.instructors || { value: 0, isPositive: true }}
            color="sky"
          />
          <StatsCard
            title="Completion Rate"
            value={`${overviewData?.completion_rate || 0}%`}
            icon={TrendingUp}
            trend={overviewData?.trends?.completion || { value: 0, isPositive: true }}
            color="lime"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Enrollment Trends */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Trends</h3>
            {enrollmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={enrollmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="students" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No enrollment data available</p>
                </div>
              </div>
            )}
          </div>

          {/* Center Performance Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Center Performance</h3>
            {centerPerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={centerPerformanceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {centerPerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Target className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No performance data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section - 3 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activities */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {recentActivities.length} activities
              </span>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div 
                    key={activity.id} 
                    className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      if (activity.id.includes('center')) {
                        // Navigate to relevant section based on activity type
                      } else if (activity.id.includes('approval')) {
                        // Navigate to approvals if available
                      }
                    }}
                  >
                    <div className={`p-2 rounded-full flex-shrink-0 ${
                      activity.type === 'success' ? 'bg-green-100 text-green-600' :
                      activity.type === 'info' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.activity}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          activity.type === 'success' ? 'bg-green-50 text-green-700' :
                          activity.type === 'info' ? 'bg-blue-50 text-blue-700' :
                          activity.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-gray-50 text-gray-700'
                        }`}>
                          {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                        </span>
                        <span className="text-xs text-gray-500">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No recent activities</p>
                  <p className="text-sm mt-1">Activities will appear here as they occur</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions - Only Courses and Instructors */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                2 actions
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleViewCourses}
                className="flex flex-col items-center p-6 rounded-lg border border-gray-200 hover:bg-green-50 hover:border-green-300 transition-colors group"
              >
                <div className="p-4 bg-green-100 rounded-lg mb-3 group-hover:bg-green-200">
                  <BookOpen className="w-8 h-8 text-green-600" />
                </div>
                <span className="text-lg font-medium text-gray-900 text-center">Courses</span>
                <span className="text-sm text-gray-500 text-center mt-2">Manage training courses</span>
              </button>

              <button 
                onClick={handleManageInstructors}
                className="flex flex-col items-center p-6 rounded-lg border border-gray-200 hover:bg-purple-50 hover:border-purple-300 transition-colors group"
              >
                <div className="p-4 bg-purple-100 rounded-lg mb-3 group-hover:bg-purple-200">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <span className="text-lg font-medium text-gray-900 text-center">Instructors</span>
                <span className="text-sm text-gray-500 text-center mt-2">Manage instructors</span>
              </button>
            </div>
          </div>

          {/* Training Metrics */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Training Metrics</h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Overview
              </span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Enrolled Students</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {dashboardStats?.enrollment_stats?.enrolled || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Completed Training</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {dashboardStats?.enrollment_stats?.completed || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <BookOpen className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Active Courses</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {dashboardStats?.active_courses || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Total Instructors</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {overviewData?.total_instructors || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Training Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Trained Students</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {dashboardStats?.training_stats?.trained || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New This Week</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {dashboardStats?.recent_activity?.new_students || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Courses</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {dashboardStats?.recent_activity?.new_courses || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Courses</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {dashboardStats?.recent_activity?.completed_courses || 0}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingOfficerOverview;