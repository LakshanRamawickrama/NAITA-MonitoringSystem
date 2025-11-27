// HeadOfficeReports.tsx - COMPLETE WITH REAL BACKEND INTEGRATION AND IMPROVED MOBILE RESPONSIVENESS
import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Building2,
  CheckCircle,
  MapPin,
  X,
  FileText,
  Table,
  GraduationCap,
  RefreshCw,
  AlertCircle,
  Shield
} from 'lucide-react';
import { 
  exportHeadOfficeReport, 
  fetchHeadOfficeReports, 
  canAccessHeadOfficeReports,
  getUserRole 
} from '../../api/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

// Export Modal Component (Improved for mobile: full width on small screens, better spacing)
const ExportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: {
    format: 'pdf' | 'excel';
    period: 'weekly' | 'monthly' | 'quarterly' | 'custom';
    reportType: 'island' | 'districts' | 'centers' | 'comprehensive' | 'instructors';
    startDate?: string;
    endDate?: string;
    includeDistricts: boolean;
    includeCenters: boolean;
    includeCourses: boolean;
    includeInstructors: boolean;
  }) => void;
}> = ({ isOpen, onClose, onExport }) => {
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'custom'>('monthly');
  const [reportType, setReportType] = useState<'island' | 'districts' | 'centers' | 'comprehensive' | 'instructors'>('comprehensive');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [includeOptions, setIncludeOptions] = useState({
    includeDistricts: true,
    includeCenters: true,
    includeCourses: true,
    includeInstructors: true
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
      alert('Export failed. Please try again.');
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
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Generate Head Office Report</h3>
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
              <option value="comprehensive">Island-Wide Comprehensive</option>
              <option value="island">Island Performance</option>
              <option value="districts">District Comparison</option>
              <option value="centers">Centers Analysis</option>
              <option value="instructors">Instructors Summary</option>
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
                  checked={includeOptions.includeDistricts}
                  onChange={(e) => setIncludeOptions(prev => ({ 
                    ...prev, 
                    includeDistricts: e.target.checked 
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">District Performance</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeOptions.includeCenters}
                  onChange={(e) => setIncludeOptions(prev => ({ 
                    ...prev, 
                    includeCenters: e.target.checked 
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Centers Analysis</span>
              </label>
              
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
                <span className="ml-2 text-sm text-gray-700">Courses & Programs</span>
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
                <span className="ml-2 text-sm text-gray-700">Instructors Data</span>
              </label>
            </div>
          </div>

          {/* Format Info */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {format === 'pdf' ? 'PDF Head Office Report' : 'Excel Head Office Report'}
            </h4>
            <p className="text-xs sm:text-sm text-gray-600">
              {format === 'pdf' 
                ? 'Comprehensive island-wide report with district comparisons, center performance, and instructor analysis.'
                : 'Detailed spreadsheet with island-wide data for strategic analysis and decision making.'
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

// Loading Component (Improved: smaller text on mobile)
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-base sm:text-lg text-gray-600">Loading island-wide reports...</p>
      <p className="text-sm text-gray-500">This may take a few moments</p>
    </div>
  </div>
);

// Permission Denied Component (Improved: responsive width and padding)
const PermissionDenied: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="text-center w-full max-w-md">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
        <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-red-600 mx-auto mb-4" />
        <div className="text-red-800 font-semibold text-base sm:text-lg mb-2">Access Denied</div>
        <p className="text-red-600 text-sm sm:text-base mb-4">
          Head Office Reports are only accessible to administrators. 
          Your current role ({getUserRole()}) does not have permission to view this section.
        </p>
        <button
          onClick={() => window.history.back()}
          className="bg-red-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
        >
          Go Back
        </button>
      </div>
    </div>
  </div>
);

// Error Component (Improved: responsive)
const ErrorDisplay: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="text-center w-full max-w-md">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
        <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-600 mx-auto mb-4" />
        <div className="text-red-800 font-semibold text-base sm:text-lg mb-2">Error Loading Reports</div>
        <p className="text-red-600 text-sm sm:text-base mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="bg-red-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center mx-auto text-sm sm:text-base"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </button>
      </div>
    </div>
  </div>
);

// Empty State Component (Improved: responsive)
const EmptyState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="text-center w-full max-w-md">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6">
        <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-600 mx-auto mb-4" />
        <div className="text-yellow-800 font-semibold text-base sm:text-lg mb-2">No Data Available</div>
        <p className="text-yellow-600 text-sm sm:text-base mb-4">Unable to load report data. The system may be initializing or there might be connectivity issues.</p>
        <button
          onClick={onRetry}
          className="bg-yellow-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center mx-auto text-sm sm:text-base"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </button>
      </div>
    </div>
  </div>
);

// Main Head Office Reports Component (Improved mobile: tables converted to cards on small screens, responsive heights, flex wrapping)
const HeadOfficeReports: React.FC = () => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Check permissions on component mount
  useEffect(() => {
    if (!canAccessHeadOfficeReports()) {
      setLoading(false);
      return;
    }
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      setRefreshing(true);
      
      // Use real API call
      const realData = await fetchHeadOfficeReports();
      setReportData(realData);
      
    } catch (error: any) {
      console.error('Failed to load head office report data:', error);
      const errorMessage = error.response?.data?.error || 'Failed to load report data. Please check your connection and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExport = async (options: {
    format: 'pdf' | 'excel';
    period: 'weekly' | 'monthly' | 'quarterly' | 'custom';
    reportType: 'island' | 'districts' | 'centers' | 'comprehensive' | 'instructors';
    startDate?: string;
    endDate?: string;
    includeDistricts: boolean;
    includeCenters: boolean;
    includeCourses: boolean;
    includeInstructors: boolean;
  }) => {
    try {
      // Use real export function
      const blob = await exportHeadOfficeReport(
        options.format, 
        options.period, 
        options.reportType,
        {
          start_date: options.startDate,
          end_date: options.endDate,
          include_districts: options.includeDistricts,
          include_centers: options.includeCenters,
          include_courses: options.includeCourses,
          include_instructors: options.includeInstructors
        }
      );
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const periodText = options.period === 'custom' 
        ? `${options.startDate}_to_${options.endDate}`
        : options.period;
        
      a.download = `head_office_report_${periodText}_${new Date().toISOString().split('T')[0]}.${options.format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Export failed:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to export report. Please try again.';
      throw new Error(errorMessage);
    }
  };

  // Custom Legend for pie chart
  const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center mt-4 space-x-4 space-y-2">
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
            <span className="text-sm text-gray-700">{entry.value} - {entry.payload.value}%</span>
          </div>
        ))}
      </div>
    );
  };

  // Check permissions first
  if (!canAccessHeadOfficeReports()) {
    return <PermissionDenied />;
  }

  // Show loading state
  if (loading) {
    return <LoadingSpinner />;
  }

  // Show error state
  if (error) {
    return <ErrorDisplay error={error} onRetry={loadReportData} />;
  }

  // Show empty state
  if (!reportData) {
    return <EmptyState onRetry={loadReportData} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExport}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header (Improved: flex-col on small screens for better stacking) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div>
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Head Office Reports</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">Island-wide performance overview and strategic analytics</p>
              </div>
            </div>
            <p className="text-gray-500 text-xs sm:text-sm mt-2">
              Last updated: {new Date().toLocaleString()}
              {refreshing && <span className="ml-2 text-blue-600">Refreshing...</span>}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <button
              onClick={loadReportData}
              disabled={refreshing}
              className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                refreshing
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm">{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
            <button
              onClick={() => setExportModalOpen(true)}
              className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm">Export Island Report</span>
            </button>
          </div>
        </div>

        {/* Island Overview Cards - USING REAL DATA (Already responsive, added gap adjustments) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Districts</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.summary.total_districts}</p>
                <p className="text-xs text-gray-500 mt-1">Active regions</p>
              </div>
              <div className="bg-blue-50 p-2 sm:p-3 rounded-full">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Island Centers</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.summary.total_centers}</p>
                <p className="text-xs text-gray-500 mt-1">Training locations</p>
              </div>
              <div className="bg-green-50 p-2 sm:p-3 rounded-full">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.summary.total_students.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Registered learners</p>
              </div>
              <div className="bg-purple-50 p-2 sm:p-3 rounded-full">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Instructors</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.summary.total_instructors}</p>
                <p className="text-xs text-gray-500 mt-1">Teaching staff</p>
              </div>
              <div className="bg-orange-50 p-2 sm:p-3 rounded-full">
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Island Metrics - USING REAL DATA */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Courses</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.summary.total_courses}</p>
                <p className="text-xs text-gray-500 mt-1">Running programs</p>
              </div>
              <div className="bg-indigo-50 p-2 sm:p-3 rounded-full">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Island Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.summary.completion_rate}%</p>
                <p className="text-xs text-gray-500 mt-1">Overall success rate</p>
              </div>
              <div className="bg-teal-50 p-2 sm:p-3 rounded-full">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.summary.pending_approvals}</p>
                <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
              </div>
              <div className="bg-red-50 p-2 sm:p-3 rounded-full">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts - USING REAL DATA (Improved: dynamic height based on screen size) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Island Trends */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Island-Wide Trends</h3>
              <span className="text-xs sm:text-sm text-gray-500">Last 6 months</span>
            </div>
            <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 250 : 300}>
              <LineChart data={reportData.island_trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="period" 
                  stroke="#6b7280"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={10}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="enrollment" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Enrollment"
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#1d4ed8' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="completions" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="Completions"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#047857' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="new_instructors" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  name="New Instructors"
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#d97706' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Course Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Course Distribution</h3>
              <span className="text-xs sm:text-sm text-gray-500">By category</span>
            </div>
            <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 250 : 300}>
              <PieChart>
                <Pie
                  data={reportData.course_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={window.innerWidth < 640 ? 40 : 60}
                  outerRadius={window.innerWidth < 640 ? 80 : 100}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={5}
                  isAnimationActive={true}
                >
                  {reportData.course_distribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value}%`, name]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* District Performance - USING REAL DATA (Improved: cards on mobile, table on sm+) */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">District Performance Comparison</h3>
            <span className="text-xs sm:text-sm text-gray-500">{reportData.district_performance.length} districts</span>
          </div>
          
          {/* Mobile View: Cards */}
          <div className="sm:hidden space-y-4">
            {reportData.district_performance.map((district: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                <div className="text-sm font-medium text-gray-900 mb-2">{district.name}</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>Centers:</div><div className="font-medium">{district.centers}</div>
                  <div>Students:</div><div className="font-medium">{district.students.toLocaleString()}</div>
                  <div>Instructors:</div><div className="font-medium">{district.instructors}</div>
                  <div>Completion:</div>
                  <div className="flex items-center">
                    <span className="font-medium">{district.completion}%</span>
                    <div className={`ml-2 w-2 h-2 rounded-full ${
                      district.completion >= 80 ? 'bg-green-500' :
                      district.completion >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                  <div>Growth:</div>
                  <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    district.growth > 10 
                      ? 'bg-green-100 text-green-800'
                      : district.growth > 0
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <TrendingUp className={`w-3 h-3 mr-1 ${
                      district.growth > 10 
                        ? 'text-green-600'
                        : district.growth > 0
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`} />
                    {district.growth > 0 ? '+' : ''}{district.growth}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Centers</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructors</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.district_performance.map((district: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{district.name}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{district.centers}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{district.students.toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{district.instructors}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{district.completion}%</div>
                        <div className={`ml-2 w-2 h-2 rounded-full ${
                          district.completion >= 80 ? 'bg-green-500' :
                          district.completion >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        district.growth > 10 
                          ? 'bg-green-100 text-green-800'
                          : district.growth > 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <TrendingUp className={`w-3 h-3 mr-1 ${
                          district.growth > 10 
                            ? 'text-green-600'
                            : district.growth > 0
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`} />
                        {district.growth > 0 ? '+' : ''}{district.growth}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Performing Centers - USING REAL DATA (Improved: cards on mobile) */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Top Performing Centers Island-Wide</h3>
            <span className="text-xs sm:text-sm text-gray-500">By student completion rate</span>
          </div>
          
          {/* Mobile View: Cards */}
          <div className="sm:hidden space-y-4">
            {reportData.top_performing_centers.map((center: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                <div className="text-sm font-medium text-gray-900 mb-2">{center.name}</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>District:</div><div className="font-medium">{center.district}</div>
                  <div>Students:</div><div className="font-medium">{center.students}</div>
                  <div>Instructors:</div><div className="font-medium">{center.instructors}</div>
                  <div>Completion:</div>
                  <div className="flex items-center">
                    <span className="font-medium">{center.completion}%</span>
                    <div className={`ml-2 w-2 h-2 rounded-full ${
                      center.completion >= 90 ? 'bg-green-500' :
                      center.completion >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Center Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructors</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.top_performing_centers.map((center: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{center.name}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{center.district}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{center.students}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{center.instructors}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{center.completion}%</div>
                        <div className={`ml-2 w-2 h-2 rounded-full ${
                          center.completion >= 90 ? 'bg-green-500' :
                          center.completion >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Instructor Summary - USING REAL DATA (Improved: cards on mobile) */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Instructor Summary by District</h3>
            <span className="text-xs sm:text-sm text-gray-500">Teaching staff overview</span>
          </div>
          
          {/* Mobile View: Cards */}
          <div className="sm:hidden space-y-4">
            {reportData.instructor_summary.map((instructor: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                <div className="text-sm font-medium text-gray-900 mb-2">{instructor.district}</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>Total:</div><div className="font-medium">{instructor.total}</div>
                  <div>Active:</div>
                  <div className="font-medium">
                    {instructor.active} ({Math.round((instructor.active / instructor.total) * 100)}%)
                  </div>
                  <div>Avg Rating:</div>
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-xs ${
                            i < Math.floor(instructor.avg_rating)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="ml-1 font-medium">
                      {instructor.avg_rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Instructors</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Instructors</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Rating</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.instructor_summary.map((instructor: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{instructor.district}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{instructor.total}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm text-gray-600">{instructor.active}</div>
                        <div className="ml-2 text-xs text-gray-500">
                          ({Math.round((instructor.active / instructor.total) * 100)}% active)
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${
                                i < Math.floor(instructor.avg_rating)
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {instructor.avg_rating.toFixed(1)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Information (Improved: grid-cols-1 on mobile) */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">System Information</h3>
            <span className="text-xs sm:text-sm text-gray-500">Report generated for administrative use</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Generated By</p>
              <p className="font-medium text-gray-900">Head Office Administrator</p>
            </div>
            <div>
              <p className="text-gray-600">User Role</p>
              <p className="font-medium text-gray-900">{getUserRole()}</p>
            </div>
            <div>
              <p className="text-gray-600">Data Freshness</p>
              <p className="font-medium text-gray-900">Real-time from database</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeadOfficeReports;