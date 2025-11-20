// DataEntryOverview.tsx - COMPLETE UPDATED VERSION
import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, CheckCircle, Calendar, 
  Target, Award, Bookmark, MapPin, Building, GraduationCap
} from 'lucide-react';
import { 
  type StudentType,
  type StudentStatsType,
  fetchStudents, 
  fetchStudentStats,
  getUserDistrict
} from '../../api/api';

const StudentDashboardOverview: React.FC = () => {
  const [students, setStudents] = useState<StudentType[]>([]);
  const [stats, setStats] = useState<StudentStatsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [userDistrict, setUserDistrict] = useState<string>('');

  // Load data
  useEffect(() => {
    const loadUserInfo = () => {
      setUserDistrict(getUserDistrict());
    };

    loadUserInfo();
    loadStudents();
    loadStats();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await fetchStudents();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      alert('Error loading students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await fetchStudentStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getRecentStudents = () => {
    return [...students]
      .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
      .slice(0, 5);
  };

  // Statistics calculation
  const calculatedStats = {
    total: stats?.total_students || students.length,
    trained: stats?.trained_students || students.filter(s => s.training_received).length,
    enrolled: stats?.enrolled_students || students.filter(s => s.enrollment_status === 'Enrolled').length,
    completed: stats?.completed_students || students.filter(s => s.enrollment_status === 'Completed').length,
    pending: stats?.pending_students || students.filter(s => s.enrollment_status === 'Pending').length,
    withOL: stats?.with_ol_results || students.filter(s => s.ol_results.length > 0).length,
    withAL: stats?.with_al_results || students.filter(s => s.al_results.length > 0).length,
    recent: stats?.recent_students || students.filter(s => {
      const date = new Date(s.created_at || '');
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date > weekAgo;
    }).length,
  };

  const trainingStats = {
    trained: calculatedStats.trained,
    notTrained: calculatedStats.total - calculatedStats.trained,
  };

  const enrollmentStats = {
    enrolled: calculatedStats.enrolled,
    completed: calculatedStats.completed,
    pending: calculatedStats.pending,
    dropped: students.filter(s => s.enrollment_status === 'Dropped').length,
  };

  const centerDistribution = stats?.center_distribution || students.reduce((acc, student) => {
    const centerName = student.center_name || 'No Center';
    acc[centerName] = (acc[centerName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedCenters = Object.entries(centerDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // ============================================================================
  // DASHBOARD COMPONENTS
  // ============================================================================

  // Pie Chart Component for Training Distribution
  const TrainingPieChart = () => {
    const total = trainingStats.trained + trainingStats.notTrained;
    const trainedPercentage = total > 0 ? (trainingStats.trained / total) * 100 : 0;
    const notTrainedPercentage = total > 0 ? (trainingStats.notTrained / total) * 100 : 0;

    // Calculate SVG path for pie chart
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    
    const trainedStrokeDasharray = `${(trainedPercentage / 100) * circumference} ${circumference}`;
    const notTrainedStrokeDasharray = `${(notTrainedPercentage / 100) * circumference} ${circumference}`;

    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Training Distribution</h3>
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* Pie Chart */}
          <div className="relative mb-4 md:mb-0">
            <svg width="140" height="140" className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="12"
              />
              {/* Trained segment */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="#10b981"
                strokeWidth="12"
                strokeDasharray={trainedStrokeDasharray}
                strokeLinecap="round"
              />
              {/* Not Trained segment */}
              {notTrainedPercentage > 0 && (
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="#6b7280"
                  strokeWidth="12"
                  strokeDasharray={notTrainedStrokeDasharray}
                  strokeLinecap="round"
                  strokeDashoffset={-((trainedPercentage / 100) * circumference)}
                />
              )}
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{total}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <div>
                <span className="text-sm font-medium">Trained</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-900">{trainingStats.trained}</span>
                  <span className="text-xs text-gray-500">({trainedPercentage.toFixed(1)}%)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
              <div>
                <span className="text-sm font-medium">Not Trained</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-900">{trainingStats.notTrained}</span>
                  <span className="text-xs text-gray-500">({notTrainedPercentage.toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Enrollment Pie Chart
  const EnrollmentPieChart = () => {
    const total = enrollmentStats.enrolled + enrollmentStats.completed + enrollmentStats.pending + enrollmentStats.dropped;
    const enrolledPercentage = total > 0 ? (enrollmentStats.enrolled / total) * 100 : 0;
    const completedPercentage = total > 0 ? (enrollmentStats.completed / total) * 100 : 0;
    const pendingPercentage = total > 0 ? (enrollmentStats.pending / total) * 100 : 0;
    const droppedPercentage = total > 0 ? (enrollmentStats.dropped / total) * 100 : 0;

    const radius = 60;
    const circumference = 2 * Math.PI * radius;

    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Enrollment Status</h3>
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* Pie Chart */}
          <div className="relative mb-4 md:mb-0">
            <svg width="140" height="140" className="transform -rotate-90">
              <circle cx="70" cy="70" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="12" />
              <circle
                cx="70" cy="70" r={radius} fill="none" stroke="#10b981" strokeWidth="12"
                strokeDasharray={`${(enrolledPercentage / 100) * circumference} ${circumference}`}
              />
              <circle
                cx="70" cy="70" r={radius} fill="none" stroke="#3b82f6" strokeWidth="12"
                strokeDasharray={`${(completedPercentage / 100) * circumference} ${circumference}`}
                strokeDashoffset={-((enrolledPercentage / 100) * circumference)}
              />
              <circle
                cx="70" cy="70" r={radius} fill="none" stroke="#f59e0b" strokeWidth="12"
                strokeDasharray={`${(pendingPercentage / 100) * circumference} ${circumference}`}
                strokeDashoffset={-(((enrolledPercentage + completedPercentage) / 100) * circumference)}
              />
              <circle
                cx="70" cy="70" r={radius} fill="none" stroke="#ef4444" strokeWidth="12"
                strokeDasharray={`${(droppedPercentage / 100) * circumference} ${circumference}`}
                strokeDashoffset={-(((enrolledPercentage + completedPercentage + pendingPercentage) / 100) * circumference)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{total}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">Enrolled: {enrollmentStats.enrolled}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Completed: {enrollmentStats.completed}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Pending: {enrollmentStats.pending}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm">Dropped: {enrollmentStats.dropped}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Stat Cards Component
  const StatCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Students */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Students</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{calculatedStats.total}</p>
            <p className="text-sm text-blue-600 mt-1">All registered students</p>
          </div>
          <div className="p-3 rounded-full bg-blue-100 text-blue-600">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Enrolled Students */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Enrolled Students</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{calculatedStats.enrolled}</p>
            <p className="text-sm text-green-600 mt-1">
              {calculatedStats.total > 0 ? Math.round((calculatedStats.enrolled / calculatedStats.total) * 100) : 0}% enrolled
            </p>
          </div>
          <div className="p-3 rounded-full bg-green-100 text-green-600">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Trained Students */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Trained Students</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{calculatedStats.trained}</p>
            <p className="text-sm text-purple-600 mt-1">
              {calculatedStats.total > 0 ? Math.round((calculatedStats.trained / calculatedStats.total) * 100) : 0}% trained
            </p>
          </div>
          <div className="p-3 rounded-full bg-purple-100 text-purple-600">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Recent Entries</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{calculatedStats.recent}</p>
            <p className="text-sm text-orange-600 mt-1">Added this week</p>
          </div>
          <div className="p-3 rounded-full bg-orange-100 text-orange-600">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );

  // Education Summary Section
  const EducationSummary = () => (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8 hover:shadow-lg transition">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Education Summary</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 rounded-lg border border-gray-200 bg-blue-50 hover:bg-blue-100 transition">
          <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{calculatedStats.withOL}</div>
          <div className="text-sm text-gray-600">With O/L</div>
        </div>
        <div className="text-center p-4 rounded-lg border border-gray-200 bg-green-50 hover:bg-green-100 transition">
          <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{calculatedStats.withAL}</div>
          <div className="text-sm text-gray-600">With A/L</div>
        </div>
        <div className="text-center p-4 rounded-lg border border-gray-200 bg-purple-50 hover:bg-purple-100 transition">
          <Bookmark className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {students.length > 0 ? (students.reduce((sum, s) => sum + s.ol_results.length, 0) / students.length).toFixed(1) : '0.0'}
          </div>
          <div className="text-sm text-gray-600">Avg O/L Subjects</div>
        </div>
        <div className="text-center p-4 rounded-lg border border-gray-200 bg-orange-50 hover:bg-orange-100 transition">
          <Target className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {students.length > 0 ? (students.reduce((sum, s) => sum + s.al_results.length, 0) / students.length).toFixed(1) : '0.0'}
          </div>
          <div className="text-sm text-gray-600">Avg A/L Subjects</div>
        </div>
      </div>
    </div>
  );

  // Center Distribution Section
  const CenterDistribution = () => (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8 hover:shadow-lg transition">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
        <Building className="w-5 h-5 mr-2 text-green-600" />
        Student Distribution by Center
      </h3>
      <div className="space-y-4">
        {sortedCenters.map(([center, count]) => {
          const percentage = calculatedStats.total > 0 ? (count / calculatedStats.total) * 100 : 0;
          return (
            <div key={center} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 flex-1 truncate">{center}</span>
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold w-12 text-right">{count}</span>
              </div>
            </div>
          );
        })}
        {sortedCenters.length === 0 && (
          <div className="text-center text-gray-500 py-4">No center data available</div>
        )}
      </div>
    </div>
  );

  // Recent Activity Section
  const RecentActivitySection = () => (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Student Entries</h3>
      <div className="space-y-3">
        {getRecentStudents().map(student => (
          <div 
            key={student.id} 
            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{student.full_name_english}</p>
                <p className="text-sm text-gray-500">{student.registration_no}</p>
                <p className="text-xs text-gray-400">
                  {student.center_name && `Center: ${student.center_name}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                student.enrollment_status === 'Enrolled' ? 'bg-green-100 text-green-800' :
                student.enrollment_status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                student.enrollment_status === 'Dropped' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {student.enrollment_status || 'Pending'}
              </span>
              <p className="text-xs text-gray-400 mt-1">
                Added {formatDate(student.created_at || '')}
              </p>
            </div>
          </div>
        ))}
        {getRecentStudents().length === 0 && (
          <div className="text-center text-gray-500 py-4">No recent student entries</div>
        )}
      </div>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Dashboard Overview</h1>
            <p className="text-gray-600">Comprehensive overview of student data and analytics</p>
            {userDistrict && (
              <div className="flex items-center mt-1 text-sm text-green-600">
                <MapPin className="w-4 h-4 mr-1" />
                <span>District: {userDistrict}</span>
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Loading dashboard data...</div>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <StatCards />

            {/* Pie Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <TrainingPieChart />
              <EnrollmentPieChart />
            </div>

            {/* Education Summary */}
            <EducationSummary />

            {/* Center Distribution */}
            <CenterDistribution />

            {/* Recent Activity */}
            <RecentActivitySection />
          </>
        )}
      </div>
    </div>
  );
};

export default StudentDashboardOverview;