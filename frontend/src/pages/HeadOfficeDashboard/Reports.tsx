import React, { useState } from 'react';
import { Download,FileText, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

const Reports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedCenter, setSelectedCenter] = useState('all');

  const enrollmentTrends = [
    { month: 'Jul', students: 1100 },
    { month: 'Aug', students: 1250 },
    { month: 'Sep', students: 1180 },
    { month: 'Oct', students: 1420 },
    { month: 'Nov', students: 1380 },
    { month: 'Dec', students: 1500 }
  ];

  const completionRates = [
    { center: 'Kampala', rate: 92 },
    { center: 'Gulu', rate: 87 },
    { center: 'Mbarara', rate: 89 },
    { center: 'Jinja', rate: 85 },
    { center: 'Arua', rate: 78 }
  ];

  const courseDistribution = [
    { name: 'IT & Computing', value: 35, color: '#16a34a' },
    { name: 'Welding & Fabrication', value: 25, color: '#eab308' },
    { name: 'Automotive', value: 20, color: '#38bdf8' },
    { name: 'Electrical', value: 15, color: '#365314' },
    { name: 'Others', value: 5, color: '#6b7280' }
  ];

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
    // Handle report generation logic here
  };

  const handleExportData = (format: string) => {
    console.log('Exporting data as:', format);
    // Handle data export logic here
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
                <option value="kampala">Kampala Center</option>
                <option value="gulu">Gulu Center</option>
                <option value="mbarara">Mbarara Center</option>
                <option value="jinja">Jinja Center</option>
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
                <div className="text-3xl font-bold text-green-600 mb-2">87%</div>
                <div className="text-sm text-gray-600">Overall Completion Rate</div>
                <div className="text-xs text-green-600 mt-1">+5% from last month</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500 mb-2">15,847</div>
                <div className="text-sm text-gray-600">Total Active Students</div>
                <div className="text-xs text-green-600 mt-1">+12% from last month</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-sky-400 mb-2">1,234</div>
                <div className="text-sm text-gray-600">Total Instructors</div>
                <div className="text-xs text-green-600 mt-1">+8% from last month</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-lime-800 mb-2">42</div>
                <div className="text-sm text-gray-600">Active Centers</div>
                <div className="text-xs text-green-600 mt-1">+2 new centers</div>
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