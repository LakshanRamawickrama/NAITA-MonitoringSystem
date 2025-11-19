import React, { useState } from 'react';
import { Calendar, Clock, BookOpen, Users, TrendingUp, Award } from 'lucide-react';

// Interfaces
interface InstructorStats {
  weeklyHours: number;
  totalStudents: number;
  completedCourses: number;
  upcomingClasses: number;
  performance: number;
  attendanceRate: number;
}

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
  onViewDetails: (classId: string) => void;
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
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-sm text-gray-600">{title}</div>
        </div>
        <Icon className={`w-8 h-8 ${colorClasses[color]}`} />
      </div>
    </div>
  );
};

// Class Card Component
const ClassCard: React.FC<ClassCardProps> = ({ classItem, onViewDetails }) => {
  return (
    <div className="border-b border-gray-100 last:border-b-0 py-4 last:pb-0 first:pt-0">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-900">{classItem.course}</h3>
          <p className="text-sm text-gray-600">{classItem.date} • {classItem.time}</p>
          <p className="text-sm text-gray-500">{classItem.students} students enrolled</p>
        </div>
        <button 
          onClick={() => onViewDetails(classItem.id)}
          className="text-green-600 hover:text-green-800 text-sm font-medium"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

// Activity Card Component
const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
  return (
    <div className="border-b border-gray-100 last:border-b-0 py-4 last:pb-0 first:pt-0">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-900">{activity.action}</h3>
          <p className="text-sm text-gray-600">{activity.course}</p>
        </div>
        <span className="text-sm text-gray-500">{activity.time}</span>
      </div>
    </div>
  );
};

const InstructorOverview: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('week');

  // Stats data with proper typing
  const statsData: InstructorStats = {
    weeklyHours: 32,
    totalStudents: 45,
    completedCourses: 12,
    upcomingClasses: 3,
    performance: 4.8,
    attendanceRate: 95
  };

  // Upcoming classes data
  const upcomingClasses: UpcomingClass[] = [
    {
      id: '1',
      course: 'Web Development Fundamentals',
      date: '2024-01-15',
      time: '09:00 AM - 12:00 PM',
      students: 15
    },
    {
      id: '2',
      course: 'Advanced React',
      date: '2024-01-16',
      time: '02:00 PM - 05:00 PM',
      students: 12
    },
    {
      id: '3',
      course: 'Mobile App Development',
      date: '2024-01-17',
      time: '10:00 AM - 01:00 PM',
      students: 18
    }
  ];

  // Recent activity data
  const recentActivity: RecentActivity[] = [
    {
      id: '1',
      action: 'Graded assignments',
      course: 'Web Development',
      time: '2 hours ago'
    },
    {
      id: '2',
      action: 'Added new course materials',
      course: 'Mobile Development',
      time: '5 hours ago'
    },
    {
      id: '3',
      action: 'Scheduled office hours',
      course: 'All Courses',
      time: '1 day ago'
    }
  ];

  // Period options
  const periodOptions = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' }
  ];

  // Event handlers
  const handleViewClassDetails = (classId: string): void => {
    console.log('Viewing details for class:', classId);
    // Implement navigation or modal opening logic here
  };

  const handlePeriodChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedPeriod(event.target.value);
  };

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
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Classes</h2>
            </div>
            <div className="p-6">
              {upcomingClasses.map((classItem) => (
                <ClassCard
                  key={classItem.id}
                  classItem={classItem}
                  onViewDetails={handleViewClassDetails}
                />
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              {recentActivity.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorOverview;