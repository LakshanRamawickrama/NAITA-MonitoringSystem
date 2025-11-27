// TrainingOfficerReports.tsx - FIXED VERSION WITH IMPROVED MOBILE RESPONSIVENESS
import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Users, 
  BookOpen, 
  TrendingUp, 
  X,
  FileText,
  Table,
  RefreshCw,
  AlertCircle
} from 'lucide-react'; // REMOVED: TrendingDown (unused)
import { 
  exportTrainingReport, 
  fetchTrainingOfficerReports,
  canAccessTrainingOfficerReports, // NOW AVAILABLE
  getUserRole,
  getUserDistrict,
  type TrainingOfficerReportType 
} from '../../api/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-base sm:text-lg text-gray-600">Loading training reports...</p>
    </div>
  </div>
);

// Permission Denied Component
const PermissionDenied = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="text-center w-full max-w-md">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
        <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-600 mx-auto mb-4" />
        <div className="text-red-800 font-semibold text-base sm:text-lg mb-2">Access Denied</div>
        <p className="text-red-600 text-sm sm:text-base mb-4">Training Officer Reports are only accessible to Training Officers. Your role: {getUserRole()}.</p>
        <button
          onClick={() => window.history.back()}
          className="bg-red-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-red-700 text-sm sm:text-base"
        >
          Go Back
        </button>
      </div>
    </div>
  </div>
);

// Error Display Component
const ErrorDisplay = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="text-center w-full max-w-md">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
        <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-600 mx-auto mb-4" />
        <div className="text-red-800 font-semibold text-base sm:text-lg mb-2">Error Loading Reports</div>
        <p className="text-red-600 text-sm sm:text-base mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="bg-red-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center mx-auto text-sm sm:text-base"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </button>
      </div>
    </div>
  </div>
);

// Export Modal Component
const ExportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: {
    format: 'pdf' | 'excel';
    period: 'weekly' | 'monthly' | 'quarterly' | 'custom';
    reportType: 'summary' | 'detailed' | 'performance';
    startDate?: string;
    endDate?: string;
    includeCourses: boolean;
    includeInstructors: boolean;
    includeCharts: boolean;
  }) => void;
}> = ({ isOpen, onClose, onExport }) => {
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'custom'>('monthly');
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'performance'>('detailed');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [includeOptions, setIncludeOptions] = useState({
    includeCourses: true,
    includeInstructors: true,
    includeCharts: true
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md sm:max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Download className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Generate Training Report</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
              Report Format
            </label>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => setFormat('pdf')}
                className={`flex flex-col items-center p-3 sm:p-4 border-2 rounded-lg transition-all ${
                  format === 'pdf'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className={`w-6 h-6 sm:w-8 sm:h-8 mb-2 ${
                  format === 'pdf' ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <span className={`font-medium text-sm sm:text-base ${
                  format === 'pdf' ? 'text-blue-900' : 'text-gray-700'
                }`}>
                  PDF
                </span>
                <span className="text-xs text-gray-500 mt-1">Document</span>
              </button>

              <button
                onClick={() => setFormat('excel')}
                className={`flex flex-col items-center p-3 sm:p-4 border-2 rounded-lg transition-all ${
                  format === 'excel'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Table className={`w-6 h-6 sm:w-8 sm:h-8 mb-2 ${
                  format === 'excel' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <span className={`font-medium text-sm sm:text-base ${
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="summary">Summary Report</option>
              <option value="detailed">Detailed Report</option>
              <option value="performance">Performance Report</option>
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 text-sm"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="custom">Custom Date Range</option>
            </select>

            {period === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
              Include in Report
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeOptions.includeCourses}
                  onChange={(e) => setIncludeOptions(prev => ({ 
                    ...prev, 
                    includeCourses: e.target.checked 
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Courses Summary</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeOptions.includeInstructors}
                  onChange={(e) => setIncludeOptions(prev => ({ 
                    ...prev, 
                    includeInstructors: e.target.checked 
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Instructors Summary</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeOptions.includeCharts}
                  onChange={(e) => setIncludeOptions(prev => ({ 
                    ...prev, 
                    includeCharts: e.target.checked 
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Charts & Graphs</span>
              </label>
            </div>
          </div>

          {/* Format Info */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {format === 'pdf' ? 'PDF Training Report' : 'Excel Training Report'}
            </h4>
            <p className="text-xs sm:text-sm text-gray-600">
              {format === 'pdf' 
                ? 'Professional training report with comprehensive analysis of courses, instructors, and student performance.'
                : 'Detailed spreadsheet with training data for further analysis and management.'
              }
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-4 sm:p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`flex items-center space-x-2 px-3 sm:px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
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

// Main Reports Component
const TrainingOfficerReports: React.FC = () => {
  const [reportData, setReportData] = useState<TrainingOfficerReportType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Check permissions
  if (!canAccessTrainingOfficerReports()) {
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
      
      const data = await fetchTrainingOfficerReports();
      setReportData(data);
    } catch (err: any) {
      console.error('Failed to load training reports:', err);
      setError(err.response?.data?.error || 'Failed to load training reports. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExport = async (options: {
    format: 'pdf' | 'excel';
    period: 'weekly' | 'monthly' | 'quarterly' | 'custom';
    reportType: 'summary' | 'detailed' | 'performance';
    startDate?: string;
    endDate?: string;
    includeCourses: boolean;
    includeInstructors: boolean;
    includeCharts: boolean;
  }) => {
    try {
      const blob = await exportTrainingReport(options.format, options.period, options.reportType);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const periodText = options.period === 'custom' 
        ? `${options.startDate}_to_${options.endDate}`
        : options.period;
        
      a.download = `training_report_${getUserDistrict()}_${periodText}_${new Date().toISOString().split('T')[0]}.${options.format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Export failed:', err);
      throw new Error(err.response?.data?.error || 'Failed to export training report');
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Training Officer Reports</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Comprehensive overview of training programs and performance metrics</p>
            <p className="text-xs sm:text-sm text-blue-600 mt-1">District: {reportData.user_district}</p>
          </div>
          <div className="flex space-x-3 w-full sm:w-auto">
            <button
              onClick={loadReportData}
              disabled={refreshing}
              className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors w-1/2 sm:w-auto ${
                refreshing ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              <RefreshCw className={`w-4 sm:w-5 h-4 sm:h-5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm">{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
            <button
              onClick={() => setExportModalOpen(true)}
              className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-1/2 sm:w-auto"
            >
              <Download className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="text-sm">Export Training Report</span>
            </button>
          </div>
        </div>

        {/* Overall Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{reportData.overall_stats.total_students}</p>
              </div>
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Centers</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{reportData.overall_stats.total_centers}</p>
              </div>
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{reportData.overall_stats.completion_rate}%</p>
              </div>
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Training Programs Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Programs</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{reportData.training_programs.active_programs}</p>
                <p className="text-xs text-gray-500">of {reportData.training_programs.total_programs} total</p>
              </div>
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{reportData.training_programs.pending_approval}</p>
              </div>
              <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Training</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{reportData.training_progress.completed_training}</p>
              </div>
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Training Trends */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Training Trends</h3>
            <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 250 : 300}>
              <LineChart data={reportData.training_trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" angle={-45} textAnchor="end" height={60} fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="new_students" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="New Students"
                />
                <Line 
                  type="monotone" 
                  dataKey="completed_training" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Completed Training"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Course Effectiveness */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Course Effectiveness</h3>
            <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 250 : 300}>
              <BarChart data={reportData.course_effectiveness.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="course_name" angle={-45} textAnchor="end" height={80} fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="completion_rate" fill="#10b981" name="Completion Rate %" />
                <Bar dataKey="attendance_rate" fill="#3b82f6" name="Attendance Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Center Performance */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Center Performance</h3>
          {/* Mobile Cards */}
          <div className="sm:hidden space-y-4">
            {reportData.center_performance.map((center: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                <div className="text-sm font-medium text-gray-900 mb-2">{center.center_name}</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>Students:</div><div className="font-medium">{center.total_students}</div>
                  <div>Courses:</div><div className="font-medium">{center.total_courses}</div>
                  <div>Completion:</div><div className="font-medium">{center.completion_rate}%</div>
                  <div>Performance:</div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    center.performance === 'Excellent' ? 'bg-green-100 text-green-800' :
                    center.performance === 'Good' ? 'bg-blue-100 text-blue-800' :
                    center.performance === 'Average' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {center.performance}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Center Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Courses</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.center_performance.map((center: any, index: number) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{center.center_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{center.total_students}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{center.total_courses}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{center.completion_rate}%</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        center.performance === 'Excellent' ? 'bg-green-100 text-green-800' :
                        center.performance === 'Good' ? 'bg-blue-100 text-blue-800' :
                        center.performance === 'Average' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {center.performance}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Instructor Metrics */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Instructor Performance</h3>
          {/* Mobile Cards */}
          <div className="sm:hidden space-y-4">
            {reportData.instructor_metrics.slice(0, 5).map((instructor: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                <div className="text-sm font-medium text-gray-900 mb-2">{instructor.instructor_name}</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>Email:</div><div className="font-medium">{instructor.email}</div>
                  <div>Courses:</div><div className="font-medium">{instructor.total_courses}</div>
                  <div>Students:</div><div className="font-medium">{instructor.total_students}</div>
                  <div>Completion:</div><div className="font-medium">{instructor.completion_rate}%</div>
                  <div>Performance:</div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    instructor.performance === 'Excellent' ? 'bg-green-100 text-green-800' :
                    instructor.performance === 'Good' ? 'bg-blue-100 text-blue-800' :
                    instructor.performance === 'Average' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {instructor.performance}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instructor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Courses</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.instructor_metrics.slice(0, 5).map((instructor: any, index: number) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{instructor.instructor_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{instructor.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{instructor.total_courses}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{instructor.total_students}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{instructor.completion_rate}%</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        instructor.performance === 'Excellent' ? 'bg-green-100 text-green-800' :
                        instructor.performance === 'Good' ? 'bg-blue-100 text-blue-800' :
                        instructor.performance === 'Average' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {instructor.performance}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Course Effectiveness */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Course Effectiveness</h3>
          {/* Mobile Cards */}
          <div className="sm:hidden space-y-4">
            {reportData.course_effectiveness.slice(0, 6).map((course: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                <div className="text-sm font-medium text-gray-900 mb-2">{course.course_name}</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>Category:</div><div className="font-medium">{course.category}</div>
                  <div>Instructor:</div><div className="font-medium">{course.instructor}</div>
                  <div>Enrolled:</div><div className="font-medium">{course.total_enrolled}</div>
                  <div>Completion:</div><div className="font-medium">{course.completion_rate}%</div>
                  <div>Status:</div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    course.status === 'Active' ? 'bg-green-100 text-green-800' :
                    course.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {course.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instructor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrolled</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.course_effectiveness.slice(0, 6).map((course: any, index: number) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{course.course_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{course.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{course.instructor}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{course.total_enrolled}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{course.completion_rate}%</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        course.status === 'Active' ? 'bg-green-100 text-green-800' :
                        course.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {course.status}
                      </span>
                    </td>
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

export default TrainingOfficerReports;