import React, { useState, useEffect } from 'react';
import { Download, FileText, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';
import { fetchReports, fetchCenters } from '../../api/api';
import type { Center } from '../../api/api';

const Reports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedCenter, setSelectedCenter] = useState('all');
  const [centers, setCenters] = useState<Center[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch centers for dropdown
  useEffect(() => {
    const loadCenters = async () => {
      try {
        const data = await fetchCenters();
        setCenters(data);
      } catch (e: any) {
        toast.error('Failed to load centers');
      }
    };
    loadCenters();
  }, []);

  // Fetch reports based on filters
  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const data = await fetchReports(selectedPeriod, selectedCenter);
        setReportData(data);
      } catch (e: any) {
        const msg = e.response?.data?.detail || 'Failed to load reports data';
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, [selectedPeriod, selectedCenter]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen text-gray-600">Loading reports...</div>;
  }

  // Fallbacks if data is missing
  const enrollmentTrends = reportData?.enrollment_trends || [];
  const completionRates = reportData?.completion_rates || [];
  const courseDistribution = reportData?.course_distribution || [];
  const keyMetrics = reportData?.key_metrics || {
    overall_completion_rate: 0,
    total_active_students: 0,
    total_instructors: 0,
    active_centers: 0,
    trends: {
      completion: 0,
      students: 0,
      instructors: 0,
      centers: 0,
    }
  };

  const reportTemplates = [
    {
      id: 1,
      name: 'Monthly Performance Report',
      description: 'Comprehensive monthly performance across all centers',
      icon: BarChart3,
      color: 'green'
    },
    {
      id: 2,
      name: 'Student Enrollment Report',
      description: 'Detailed enrollment statistics and trends',
      icon: TrendingUp,
      color: 'yellow'
    },
    {
      id: 3,
      name: 'Financial Summary Report',
      description: 'Budget utilization and financial performance',
      icon: PieChart,
      color: 'sky'
    },
    {
      id: 4,
      name: 'Staff Performance Report',
      description: 'Instructor and staff performance metrics',
      icon: FileText,
      color: 'lime'
    }
  ];

  const handleGenerateReport = (reportId: number) => {
    console.log('Generating report:', reportId);
    // TODO: Implement actual report generation, e.g., call backend endpoint
  };

  const handleExportData = (format: string) => {
    console.log('Exporting data as:', format);
    // TODO: Implement actual export, e.g., call backend and use libraries like jsPDF or xlsx
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600 mt-2">Generate comprehensive reports and analyze performance data</p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
              <select
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Centers</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id.toString()}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Report Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {reportTemplates.map((template) => {
            const Icon = template.icon;
            const colorClasses = {
              green: 'bg-green-600 text-white',
              yellow: 'bg-yellow-500 text-white',
              sky: 'bg-sky-400 text-white',
              lime: 'bg-lime-800 text-white'
            };

            return (
              <div key={template.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <div className={`p-3 rounded-lg ${colorClasses[template.color as keyof typeof colorClasses]} w-fit mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                <button
                  onClick={() => handleGenerateReport(template.id)}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Generate</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Enrollment Trends */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Enrollment Trends</h3>
              <button
                onClick={() => handleExportData('csv')}
                className="text-sm text-green-600 hover:text-green-700 flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={enrollmentTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="students" stroke="#16a34a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Completion Rates by Center */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Completion Rates by Center</h3>
              <button
                onClick={() => handleExportData('pdf')}
                className="text-sm text-green-600 hover:text-green-700 flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={completionRates}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="center" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="rate" fill="#eab308" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Distribution */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Course Distribution</h3>
              <button
                onClick={() => handleExportData('excel')}
                className="text-sm text-green-600 hover:text-green-700 flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={courseDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {courseDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Key Metrics */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Key Performance Indicators</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{keyMetrics.overall_completion_rate}%</div>
                <div className="text-sm text-gray-600">Overall Completion Rate</div>
                <div className="text-xs text-green-600 mt-1">+{keyMetrics.trends.completion}% from last month</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500 mb-2">{keyMetrics.total_active_students.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Active Students</div>
                <div className="text-xs text-green-600 mt-1">+{keyMetrics.trends.students}% from last month</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-sky-400 mb-2">{keyMetrics.total_instructors.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Instructors</div>
                <div className="text-xs text-green-600 mt-1">+{keyMetrics.trends.instructors}% from last month</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-lime-800 mb-2">{keyMetrics.active_centers}</div>
                <div className="text-sm text-gray-600">Active Centers</div>
                <div className="text-xs text-green-600 mt-1">+{keyMetrics.trends.centers} new centers</div>
              </div>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => handleExportData('pdf')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export as PDF</span>
            </button>
            <button
              onClick={() => handleExportData('excel')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export as Excel</span>
            </button>
            <button
              onClick={() => handleExportData('csv')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export as CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;