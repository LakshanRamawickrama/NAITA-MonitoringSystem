// InstructorOverview.tsx - FINAL VERSION WITHOUT LOCATION
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Users, 
  TrendingUp, 
  Award
} from 'lucide-react';
import { 
  fetchInstructorOverview, 
  type InstructorOverviewData
} from '../../api/api';

interface UpcomingClass {
  id: string;
  course: string;
  date: string;
  time: string;
  students: number;
}

interface RecentActivity {
  id: string;
  action: string;
  course: string;
  time: string;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: 'green' | 'blue' | 'purple' | 'orange' | 'yellow' | 'red';
}

interface ClassCardProps {
  classItem: UpcomingClass;
}

interface ActivityCardProps {
  activity: RecentActivity;
}

// Stats Card Component
const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-sm text-gray-600 mt-1">{title}</div>
        </div>
        <Icon className={`w-8 h-8 ${colorClasses[color]}`} />
      </div>
    </div>
  );
};

// Class Card Component - FINAL: Clean version without location
const ClassCard: React.FC<ClassCardProps> = ({ classItem }) => {
  return (
    <div className="border-b border-gray-100 last:border-b-0 py-4 last:pb-0 first:pt-0 hover:bg-gray-50 transition-colors duration-200 rounded-lg">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg mb-3">{classItem.course}</h3>
          
          {/* Date and Time */}
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{classItem.date}</span>
            <span className="mx-3 text-gray-300">•</span>
            <Clock className="w-4 h-4 mr-2" />
            <span>{classItem.time}</span>
          </div>

          {/* Students Only */}
          <div className="flex items-center text-sm text-gray-500">
            <Users className="w-4 h-4 mr-2" />
            <span>{classItem.students} students enrolled</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Activity Card Component
const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
  return (
    <div className="border-b border-gray-100 last:border-b-0 py-4 last:pb-0 first:pt-0 hover:bg-gray-50 transition-colors duration-200 rounded-lg">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{activity.action}</h3>
          <p className="text-sm text-gray-600 mt-1">{activity.course}</p>
        </div>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{activity.time}</span>
      </div>
    </div>
  );
};

const InstructorOverview: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('week');
  const [overviewData, setOverviewData] = useState<InstructorOverviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadInstructorOverview();
  }, []);

  const loadInstructorOverview = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchInstructorOverview();
      setOverviewData(data);
    } catch (err) {
      setError('Failed to load instructor overview');
      console.error('Error loading instructor overview:', err);
    } finally {
      setLoading(false);
    }
  };

  // Use real data instead of mock data
  const statsData = overviewData?.stats || {
    weeklyHours: 0,
    totalStudents: 0,
    completedCourses: 0,
    upcomingClasses: 0,
    performance: 0,
    attendanceRate: 0
  };

  const upcomingClasses = overviewData?.upcomingClasses || [];
  const recentActivity = overviewData?.recentActivity || [];

  // Period options
  const periodOptions = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' }
  ];

  const handlePeriodChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedPeriod(event.target.value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading instructor dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadInstructorOverview}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your teaching overview</p>
        </div>

        {/* Period Selector */}
        <div className="mb-6 flex justify-end">
          <select
            value={selectedPeriod}
            onChange={handlePeriodChange}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white shadow-sm"
          >
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Teaching Hours"
            value={`${statsData.weeklyHours}h`}
            icon={Clock}
            color="green"
          />
          <StatsCard
            title="Total Students"
            value={statsData.totalStudents}
            icon={Users}
            color="blue"
          />
          <StatsCard
            title="Completed Courses"
            value={statsData.completedCourses}
            icon={BookOpen}
            color="purple"
          />
          <StatsCard
            title="Upcoming Classes"
            value={statsData.upcomingClasses}
            icon={Calendar}
            color="orange"
          />
          <StatsCard
            title="Performance Rating"
            value={`${statsData.performance}/5.0`}
            icon={TrendingUp}
            color="yellow"
          />
          <StatsCard
            title="Attendance Rate"
            value={`${statsData.attendanceRate}%`}
            icon={Award}
            color="red"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Classes */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Upcoming Classes</h2>
                <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                  {upcomingClasses.length}
                </span>
              </div>
            </div>
            <div className="p-6">
              {upcomingClasses.length > 0 ? (
                upcomingClasses.map((classItem) => (
                  <ClassCard
                    key={classItem.id}
                    classItem={classItem}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No upcoming classes scheduled</p>
                  <p className="text-sm text-gray-400 mt-1">New classes will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  {recentActivity.length}
                </span>
              </div>
            </div>
            <div className="p-6">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No recent activity</p>
                  <p className="text-sm text-gray-400 mt-1">Your activities will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorOverview;