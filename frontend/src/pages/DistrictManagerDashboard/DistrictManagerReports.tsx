import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileText, 
  Filter, 
  Users, 
  BookOpen, 
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { 
  fetchSystemReports, 
  generateReport, 
  downloadReport,
  fetchOverview,
  fetchDashboardStats,
  type ReportType,
  type OverviewDataType,
  type DashboardStatsType
} from '../../api/api';

const DistrictManagerReports: React.FC = () => {
  const [reports, setReports] = useState<ReportType[]>([]);
  const [overviewData, setOverviewData] = useState<OverviewDataType | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filters, setFilters] = useState({
    period: 'monthly',
    reportType: 'enrollment',
    center: 'all'
  });

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      const [reportsResponse, overviewResponse, statsResponse] = await Promise.all([
        fetchSystemReports(filters.period, filters.center),
        fetchOverview(),
        fetchDashboardStats()
      ]);
      setReports(reportsResponse);
      setOverviewData(overviewResponse);
      setDashboardStats(statsResponse);
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (type: string) => {
    try {
      setGenerating(true);
      const result = await generateReport(type, {
        district: localStorage.getItem('user_district'),
        center: filters.center,
        reportType: type
      });
      console.log('Report generated:', result);
      await loadReportsData(); // Reload reports list
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = async (reportId: number) => {
    try {
      const blob = await downloadReport(reportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading report:', err);
    }
  };

  // Use real data from overview and dashboard stats
  const enrollmentData = overviewData?.enrollment_data || [
    { month: 'Jan', students: 65 },
    { month: 'Feb', students: 78 },
    { month: 'Mar', students: 90 },
    { month: 'Apr', students: 81 },
    { month: 'May', students: 56 },
    { month: 'Jun', students: 55 }
  ];

  const centerPerformanceData = overviewData?.center_performance_data || [
    { name: 'Excellent', value: 3, color: '#16a34a' },
    { name: 'Good', value: 5, color: '#eab308' },
    { name: 'Average', value: 2, color: '#38bdf8' },
    { name: 'Needs Improvement', value: 1, color: '#ef4444' }
  ];

  // Mock course completion data - replace with real data from your backend
  const courseCompletionData = [
    { course: 'IT Basics', completion: overviewData?.completion_rate || 85 },
    { course: 'Welding', completion: 92 },
    { course: 'Auto Repair', completion: 78 },
    { course: 'Electrical', completion: 88 }
  ];

  // Real metrics from dashboard stats
  const realMetrics = {
    pendingApprovals: dashboardStats?.pending_approvals || 0,
    activeCourses: dashboardStats?.active_courses || 0,
    completedTrainings: dashboardStats?.enrollment_stats?.completed || 0,
    newStudents: dashboardStats?.recent_activity?.new_students || 0,
    totalStudents: dashboardStats?.total_students || 0,
    totalCenters: dashboardStats?.total_centers || 0
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">District Reports</h1>
          <p className="text-gray-600 mt-2">
            {localStorage.getItem('user_district') ? 
              `${localStorage.getItem('user_district')} District - Analytics and Reports` : 
              'District Analytics and Reports'
            }
          </p>
        </div>

        {/* Real Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {realMetrics.totalStudents}
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
                <p className="text-sm font-medium text-gray-600">Active Centers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {realMetrics.totalCenters}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Trainings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {realMetrics.completedTrainings}
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
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {realMetrics.pendingApprovals}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Report Filters
            </h3>
            <button 
              onClick={loadReportsData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
              <select 
                value={filters.period}
                onChange={(e) => setFilters({...filters, period: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <select 
                value={filters.reportType}
                onChange={(e) => setFilters({...filters, reportType: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="enrollment">Enrollment</option>
                <option value="performance">Performance</option>
                <option value="completion">Completion</option>
                <option value="financial">Financial</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Center</label>
              <select 
                value={filters.center}
                onChange={(e) => setFilters({...filters, center: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Centers</option>
                <option value="center1">Center 1</option>
                <option value="center2">Center 2</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Report Generation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <button 
            onClick={() => handleGenerateReport('enrollment')}
            disabled={generating}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Enrollment Report</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {generating ? 'Generating...' : 'Generate'}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </button>

          <button 
            onClick={() => handleGenerateReport('performance')}
            disabled={generating}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Performance Report</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {generating ? 'Generating...' : 'Generate'}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </button>

          <button 
            onClick={() => handleGenerateReport('completion')}
            disabled={generating}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Report</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {generating ? 'Generating...' : 'Generate'}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </button>

          <button 
            onClick={() => handleGenerateReport('financial')}
            disabled={generating}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Financial Report</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {generating ? 'Generating...' : 'Generate'}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </button>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Enrollment Trends */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Enrollment Trends
            </h3>
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

          {/* Center Performance */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PieChartIcon className="w-5 h-5 mr-2" />
              Center Performance Distribution
            </h3>
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

        {/* Course Completion */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Course Completion Rates
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={courseCompletionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="course" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completion" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Generated Reports List */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Generated Reports
            </h3>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {reports.length} reports
            </span>
          </div>

          <div className="space-y-4">
            {reports.length > 0 ? (
              reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${
                      report.status === 'completed' ? 'bg-green-100 text-green-600' :
                      report.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{report.name}</p>
                      <p className="text-sm text-gray-500">
                        {report.type} • Generated {report.generated_at}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      report.status === 'completed' ? 'bg-green-50 text-green-700' :
                      report.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </span>
                    {report.status === 'completed' && (
                      <button
                        onClick={() => handleDownloadReport(report.id)}
                        className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No reports generated yet</p>
                <p className="text-sm mt-1">Generate your first report using the buttons above</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistrictManagerReports;