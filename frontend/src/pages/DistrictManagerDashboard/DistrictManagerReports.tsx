// DistrictManagerReports.tsx - FIXED TS ERRORS + REAL INTEGRATION
import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Building2,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  FileText, 
  Table 
} from 'lucide-react';
import { 
  fetchDistrictReports, 
  exportDistrictReport, 
  canAccessDistrictReports,
  getUserRole,
  getUserDistrict,
  type DistrictReportType 
} from '../../api/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// ExportModal Component - FIXED RETURN TYPE
const ExportModal = ({
  isOpen,
  onClose,
  onExport
}: {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: {
    format: 'pdf' | 'excel';
    period: 'weekly' | 'monthly' | 'quarterly' | 'custom';
    reportType: 'centers' | 'courses' | 'users' | 'approvals' | 'comprehensive';
    startDate?: string;
    endDate?: string;
    includeCenters: boolean;
    includeCourses: boolean;
    includeUsers: boolean;
    includeApprovals: boolean;
  }) => void;
}): React.ReactElement | null => { // FIXED: Changed from ReactNode to ReactElement | null
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'custom'>('monthly');
  const [reportType, setReportType] = useState<'centers' | 'courses' | 'users' | 'approvals' | 'comprehensive'>('comprehensive');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [includeOptions, setIncludeOptions] = useState({
    includeCenters: true,
    includeCourses: true,
    includeUsers: true,
    includeApprovals: true
  });
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport({
        format,
        period,
        reportType,
        startDate: period === 'custom' ? dateRange.start : undefined,
        endDate: period === 'custom' ? dateRange.end : undefined,
        ...includeOptions
      });
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Download className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Generate District Report</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Report Format
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setFormat('pdf')}
                className={`flex flex-col items-center p-4 border-2 rounded-lg transition-all ${
                  format === 'pdf'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className={`w-8 h-8 mb-2 ${
                  format === 'pdf' ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <span className={`font-medium ${
                  format === 'pdf' ? 'text-blue-900' : 'text-gray-700'
                }`}>
                  PDF
                </span>
                <span className="text-xs text-gray-500 mt-1">Document</span>
              </button>

              <button
                onClick={() => setFormat('excel')}
                className={`flex flex-col items-center p-4 border-2 rounded-lg transition-all ${
                  format === 'excel'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Table className={`w-8 h-8 mb-2 ${
                  format === 'excel' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <span className={`font-medium ${
                  format === 'excel' ? 'text-green-900' : 'text-gray-700'
                }`}>
                  Excel
                </span>
                <span className="text-xs text-gray-500 mt-1">Spreadsheet</span>
              </button>
            </div>
          </div>

          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="comprehensive">Comprehensive Report</option>
              <option value="centers">Centers Report</option>
              <option value="courses">Courses Report</option>
              <option value="users">Users Report</option>
              <option value="approvals">Approvals Report</option>
            </select>
          </div>

          {/* Period Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="custom">Custom Date Range</option>
            </select>

            {period === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Include Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Include in Report
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeOptions.includeCenters}
                  onChange={(e) => setIncludeOptions(prev => ({ ...prev, includeCenters: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Centers Data</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeOptions.includeCourses}
                  onChange={(e) => setIncludeOptions(prev => ({ ...prev, includeCourses: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Courses Data</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeOptions.includeUsers}
                  onChange={(e) => setIncludeOptions(prev => ({ ...prev, includeUsers: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Users Data</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeOptions.includeApprovals}
                  onChange={(e) => setIncludeOptions(prev => ({ ...prev, includeApprovals: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Approvals Data</span>
              </label>
            </div>
          </div>

          {/* Format Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {format === 'pdf' ? 'PDF District Report' : 'Excel District Report'}
            </h4>
            <p className="text-sm text-gray-600">
              {format === 'pdf' 
                ? 'Comprehensive district report with centers, courses, users, and approvals data. Suitable for district-level analysis.'
                : 'Detailed spreadsheet with district data for further analysis and management.'
              }
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              isExporting
                ? 'bg-gray-400 cursor-not-allowed'
                : format === 'pdf'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Generate Report</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// LoadingSpinner, PermissionDenied, ErrorDisplay
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600 text-lg">Loading district reports...</p>
    </div>
  </div>
);

const PermissionDenied = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center max-w-md">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <div className="text-red-800 font-semibold text-lg mb-2">Access Denied</div>
        <p className="text-red-600 mb-4">District Reports are only accessible to District Managers. Your role: {getUserRole()}.</p>
        <button
          onClick={() => window.history.back()}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
        >
          Go Back
        </button>
      </div>
    </div>
  </div>
);

const ErrorDisplay = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center max-w-md">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <div className="text-red-800 font-semibold text-lg mb-2">Error Loading Reports</div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center mx-auto"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </button>
      </div>
    </div>
  </div>
);

// Main Component
const DistrictManagerReports: React.FC = () => {
  const [reportData, setReportData] = useState<DistrictReportType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  if (!canAccessDistrictReports()) {
    return <PermissionDenied />;
  }

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      setRefreshing(true);
      
      const data = await fetchDistrictReports();
      setReportData(data);
    } catch (err: any) {
      console.error('Failed to load district reports:', err);
      setError(err.response?.data?.error || 'Failed to load district reports. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExport = async (options: {
    format: 'pdf' | 'excel';
    period: 'weekly' | 'monthly' | 'quarterly' | 'custom';
    reportType: 'centers' | 'courses' | 'users' | 'approvals' | 'comprehensive';
    startDate?: string;
    endDate?: string;
    includeCenters: boolean;
    includeCourses: boolean;
    includeUsers: boolean;
    includeApprovals: boolean;
  }) => {
    try {
      const blob = await exportDistrictReport(
        options.format, 
        options.period, 
        options.reportType,
        {
          start_date: options.startDate,
          end_date: options.endDate,
          include_centers: options.includeCenters,
          include_courses: options.includeCourses,
          include_users: options.includeUsers,
          include_approvals: options.includeApprovals
        }
      );
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const periodText = options.period === 'custom' 
        ? `${options.startDate}_to_${options.endDate}`
        : options.period;
        
      a.download = `district_report_${getUserDistrict()}_${periodText}_${new Date().toISOString().split('T')[0]}.${options.format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Export failed:', err);
      throw new Error(err.response?.data?.error || 'Failed to export district report');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} onRetry={loadReportData} />;
  if (!reportData) return <div>No data available</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExport}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4 sm:gap-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">District Manager Reports</h1>
            <p className="text-gray-600 mt-1">Comprehensive overview of centers, courses, users, and approvals</p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={loadReportData}
              disabled={refreshing}
              className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                refreshing ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
            <button
              onClick={() => setExportModalOpen(true)}
              className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              <span>Export District Report</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Centers</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalCenters.current}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Courses</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalCourses.current}</p>
              </div>
              <BookOpen className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalUsers.current}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.summary.pendingApprovals.current}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Students</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.summary.activeStudents.current}</p>
              </div>
              <Users className="w-8 h-8 text-indigo-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.summary.completionRate.current}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-teal-500" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Enrollment & Approvals Trend */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment & Approvals Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.enrollmentTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="enrollment" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Enrollment"
                />
                <Line 
                  type="monotone" 
                  dataKey="approvals" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Approvals"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Course Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.courseDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportData.courseDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Center Performance */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Center Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Center Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Courses</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.centerPerformance.map((center: any, index: number) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{center.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{center.students}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{center.courses}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{center.completion}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Approvals */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Approvals</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.recentApprovals.map((approval: any) => (
                  <tr key={approval.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{approval.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{approval.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        approval.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {approval.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{approval.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistrictManagerReports;