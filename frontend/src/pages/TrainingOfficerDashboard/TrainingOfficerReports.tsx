// TrainingOfficerReports.tsx - COMPLETE SINGLE FILE
import React, { useState, useEffect } from 'react';
import { Download, Filter, Calendar, Users, BookOpen, GraduationCap, TrendingUp, BarChart3, Building2, X, FileText, Table } from 'lucide-react';
import { fetchTrainingOfficerReports, exportTrainingReport, type TrainingOfficerReportType } from '../../api/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Export Modal Component (Internal)
const ExportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'pdf' | 'excel', period: string, reportType: string) => void;
  currentPeriod: string;
}> = ({ isOpen, onClose, onExport, currentPeriod }) => {
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [period, setPeriod] = useState(currentPeriod);
  const [reportType, setReportType] = useState('comprehensive');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(format, period, reportType);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Download className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Export Report</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
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

          {/* Period Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="summary">Summary Report</option>
              <option value="comprehensive">Comprehensive Report</option>
              <option value="performance">Performance Report</option>
            </select>
          </div>

          {/* Format Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {format === 'pdf' ? 'PDF Export' : 'Excel Export'}
            </h4>
            <p className="text-sm text-gray-600">
              {format === 'pdf' 
                ? 'Download as printable document with charts and summaries.'
                : 'Download as spreadsheet with multiple sheets for detailed analysis.'
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
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export {format.toUpperCase()}</span>
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
  const [period, setPeriod] = useState<string>('monthly');
  const [exportModalOpen, setExportModalOpen] = useState(false);

  useEffect(() => {
    loadReportData();
  }, [period]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const data = await fetchTrainingOfficerReports(period);
      setReportData(data);
    } catch (err) {
      setError('Failed to load report data');
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (format: 'pdf' | 'excel', period: string, reportType: string) => {
    try {
      const blob = await exportTrainingReport(format, period, reportType);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Set filename based on format and period
      const timestamp = new Date().toISOString().split('T')[0];
      const extension = format === 'pdf' ? 'pdf' : 'xlsx';
      a.download = `training_report_${period}_${timestamp}.${extension}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err) {
      console.error('Export failed:', err);
      throw new Error('Failed to export report');
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'Excellent': return 'bg-green-100 text-green-800';
      case 'Good': return 'bg-blue-100 text-blue-800';
      case 'Average': return 'bg-yellow-100 text-yellow-800';
      case 'Needs Improvement': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report data...</p>
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
            onClick={loadReportData}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No report data available</p>
        </div>
      </div>
    );
  }

  // Prepare chart data from real data
  const trainingProgramsChart = [
    { name: 'Active', value: reportData.training_programs.active_programs, color: '#10b981' },
    { name: 'Pending', value: reportData.training_programs.pending_approval, color: '#f59e0b' },
    { name: 'Approved', value: reportData.training_programs.approved_programs, color: '#3b82f6' },
    { name: 'Completed', value: reportData.training_programs.completed_programs, color: '#8b5cf6' },
    { name: 'Inactive', value: reportData.training_programs.inactive_programs, color: '#6b7280' }
  ];

  const trainingProgressChart = [
    { name: 'Trained', value: reportData.training_progress.total_trained, color: '#10b981' },
    { name: 'In Training', value: reportData.training_progress.in_training, color: '#3b82f6' },
    { name: 'Completed', value: reportData.training_progress.completed_training, color: '#8b5cf6' },
    { name: 'Awaiting', value: reportData.training_progress.awaiting_training, color: '#f59e0b' },
    { name: 'Dropped', value: reportData.training_progress.dropped_training, color: '#ef4444' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Export Modal */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExportReport}
        currentPeriod={period}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Training Analysis Report</h1>
              <p className="text-gray-600 mt-2">
                {reportData.user_district} District - Comprehensive Training Performance Analysis
              </p>
            </div>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select 
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <button
                onClick={() => setExportModalOpen(true)}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Export Report</span>
              </button>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Report generated: {new Date(reportData.report_generated_at).toLocaleString()}
            {reportData.generated_by && ` • Generated by: ${reportData.generated_by}`}
          </div>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {reportData.overall_stats.total_students}
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
                <p className="text-sm font-medium text-gray-600">Training Centers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {reportData.overall_stats.total_centers}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Instructors</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {reportData.overall_stats.total_instructors}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <GraduationCap className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {reportData.overall_stats.completion_rate}%
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Training Trends */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.training_trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
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
                <Line 
                  type="monotone" 
                  dataKey="new_courses" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="New Courses"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Training Programs Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Programs</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={trainingProgramsChart}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {trainingProgramsChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Center Performance */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Center Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Center
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Courses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completion Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.center_performance.map((center, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {center.center_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {center.total_students}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {center.total_courses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {center.completion_rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {center.attendance_rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPerformanceColor(center.performance)}`}>
                        {center.performance}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Instructor Performance */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructor Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Instructor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Courses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completion Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.instructor_metrics.map((instructor, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {instructor.instructor_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {instructor.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {instructor.total_courses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {instructor.total_students}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {instructor.completion_rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {instructor.attendance_rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPerformanceColor(instructor.performance)}`}>
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
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Effectiveness</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Instructor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrolled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completion Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.course_effectiveness.map((course, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {course.course_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course.course_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course.instructor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        course.status === 'Active' ? 'bg-green-100 text-green-800' :
                        course.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        course.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course.total_enrolled}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course.completion_rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course.attendance_rate}%
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