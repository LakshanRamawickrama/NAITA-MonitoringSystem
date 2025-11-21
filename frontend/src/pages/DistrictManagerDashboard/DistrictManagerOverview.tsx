import React, { useState, useEffect } from 'react';
import StatsCard from '../../components/StatsCard';
import { Users, GraduationCap, BookOpen, TrendingUp, Calendar, Building2, Target, FileText, CheckCircle, AlertCircle, Clock, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { fetchOverview, fetchDashboardStats, type OverviewDataType, type DashboardStatsType } from '../../api/api';
import { useNavigate } from 'react-router-dom';

const DistrictManagerOverview: React.FC = () => {
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
  })) || [
    { month: 'Jan', students: 0 },
    { month: 'Feb', students: 0 },
    { month: 'Mar', students: 0 },
    { month: 'Apr', students: 0 },
    { month: 'May', students: 0 },
    { month: 'Jun', students: 0 }
  ];

  const centerPerformanceData = overviewData?.center_performance_data || [
    { name: 'Excellent', value: 0, color: '#16a34a' },
    { name: 'Good', value: 0, color: '#eab308' },
    { name: 'Average', value: 0, color: '#38bdf8' },
    { name: 'Needs Improvement', value: 0, color: '#ef4444' }
  ];

  const recentActivities = overviewData?.recent_activities || [];

  const upcomingEvents = [
    { id: 1, title: 'Monthly Performance Review', date: '2024-01-20', type: 'review' },
    { id: 2, title: 'District Training Workshop', date: '2024-01-25', type: 'training' },
    { id: 3, title: 'New Center Inspection', date: '2024-01-30', type: 'inspection' },
    { id: 4, title: 'Quarterly Report Submission', date: '2024-02-05', type: 'report' }
  ];

  // Quick Actions Handlers - Connected to actual routes
  const handleViewCenters = () => {
    navigate('/dashboard/manager/centers');
  };

  const handleGenerateReport = () => {
    navigate('/dashboard/admin/reports'); // Using admin reports for now
  };

  const handleApproveRequests = () => {
    navigate('/dashboard/manager/approvals_dm');
  };

  const handleMonitorPerformance = () => {
    navigate('/dashboard/manager'); // Stay on overview for performance metrics
  };

  const handleViewCourses = () => {
    navigate('/dashboard/manager/courses');
  };

  const handleManageUsers = () => {
    navigate('/dashboard/manager/users');
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
          <h1 className="text-3xl font-bold text-gray-900">District Manager Dashboard</h1>
          <p className="text-gray-600 mt-2">
            {localStorage.getItem('user_district') ? 
              `${localStorage.getItem('user_district')} District - Overview and Management` : 
              'District Overview and Management'
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Trends (Last 6 Months)</h3>
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
          </div>
        </div>

        {/* Bottom Section - 3 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activities - Fixed Size */}
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
                        navigate('/dashboard/manager/centers');
                      } else if (activity.id.includes('approval')) {
                        navigate('/dashboard/manager/approvals_dm');
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

          {/* Quick Actions - Improved Layout */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                6 actions
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleViewCenters}
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors group"
              >
                <div className="p-3 bg-blue-100 rounded-lg mb-2 group-hover:bg-blue-200">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-900 text-center">Centers</span>
                <span className="text-xs text-gray-500 text-center mt-1">Manage centers</span>
              </button>
              
              <button 
                onClick={handleViewCourses}
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:bg-green-50 hover:border-green-300 transition-colors group"
              >
                <div className="p-3 bg-green-100 rounded-lg mb-2 group-hover:bg-green-200">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-900 text-center">Courses</span>
                <span className="text-xs text-gray-500 text-center mt-1">View courses</span>
              </button>

              <button 
                onClick={handleManageUsers}
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:bg-purple-50 hover:border-purple-300 transition-colors group"
              >
                <div className="p-3 bg-purple-100 rounded-lg mb-2 group-hover:bg-purple-200">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-900 text-center">Users</span>
                <span className="text-xs text-gray-500 text-center mt-1">Manage users</span>
              </button>

              <button 
                onClick={handleApproveRequests}
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:bg-yellow-50 hover:border-yellow-300 transition-colors group"
              >
                <div className="p-3 bg-yellow-100 rounded-lg mb-2 group-hover:bg-yellow-200">
                  <CheckCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <span className="text-sm font-medium text-gray-900 text-center">Approvals</span>
                <span className="text-xs text-gray-500 text-center mt-1">Review requests</span>
              </button>

              <button 
                onClick={handleGenerateReport}
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-orange-300 transition-colors group"
              >
                <div className="p-3 bg-orange-100 rounded-lg mb-2 group-hover:bg-orange-200">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-gray-900 text-center">Reports</span>
                <span className="text-xs text-gray-500 text-center mt-1">Generate reports</span>
              </button>

              <button 
                onClick={handleMonitorPerformance}
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-300 transition-colors group"
              >
                <div className="p-3 bg-red-100 rounded-lg mb-2 group-hover:bg-red-200">
                  <BarChart3 className="w-6 h-6 text-red-600" />
                </div>
                <span className="text-sm font-medium text-gray-900 text-center">Performance</span>
                <span className="text-xs text-gray-500 text-center mt-1">View metrics</span>
              </button>
            </div>
          </div>

          {/* Upcoming Events - Improved Layout */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {upcomingEvents.length} events
              </span>
            </div>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                  <div className={`p-2 rounded-full flex-shrink-0 ${
                    event.type === 'review' ? 'bg-green-100 text-green-600' :
                    event.type === 'training' ? 'bg-blue-100 text-blue-600' :
                    event.type === 'inspection' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        event.type === 'review' ? 'bg-green-50 text-green-700' :
                        event.type === 'training' ? 'bg-blue-50 text-blue-700' :
                        event.type === 'inspection' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-purple-50 text-purple-700'
                      }`}>
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      </span>
                      <span className="text-xs text-gray-500">{event.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => navigate('/dashboard/manager')}
              className="w-full mt-4 text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              View Calendar
            </button>
          </div>
        </div>

        {/* Additional Metrics Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {dashboardStats?.pending_approvals || 0}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Courses</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {dashboardStats?.active_courses || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Training Completion</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {dashboardStats?.enrollment_stats?.completed || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <GraduationCap className="w-6 h-6 text-blue-600" />
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
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistrictManagerOverview;