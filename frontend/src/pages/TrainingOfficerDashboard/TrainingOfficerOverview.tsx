import React from 'react';
import StatsCard from '../../components/StatsCard';
import { Users, BookOpen, TrendingUp, Clock, Award, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const TrainingOfficerOverview: React.FC = () => {
  // Training progress data
  const trainingProgressData = [
    { course: 'IT Fundamentals', progress: 85 },
    { course: 'Welding Basics', progress: 92 },
    { course: 'Auto Mechanics', progress: 78 },
    { course: 'Electrical Safety', progress: 88 },
    { course: 'Carpentry', progress: 75 }
  ];

  // Student performance data
  const studentPerformance = [
    { week: 'Week 1', average: 72, top: 90 },
    { week: 'Week 2', average: 78, top: 92 },
    { week: 'Week 3', average: 82, top: 95 },
    { week: 'Week 4', average: 85, top: 96 },
    { week: 'Week 5', average: 88, top: 98 }
  ];

  // Skill distribution data
  const skillDistribution = [
    { name: 'Beginner', value: 25 },
    { name: 'Intermediate', value: 45 },
    { name: 'Advanced', value: 20 },
    { name: 'Expert', value: 10 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Upcoming training sessions
  const upcomingSessions = [
    { 
      id: 1, 
      title: 'IT - Advanced Programming', 
      date: '2024-01-20', 
      time: '09:00 AM',
      instructor: 'John Smith',
      students: 15,
      type: 'regular'
    },
    { 
      id: 2, 
      title: 'Welding - Safety Training', 
      date: '2024-01-22', 
      time: '10:30 AM',
      instructor: 'Maria Garcia',
      students: 12,
      type: 'safety'
    },
    { 
      id: 3, 
      title: 'Auto - Engine Maintenance', 
      date: '2024-01-25', 
      time: '02:00 PM',
      instructor: 'Robert Chen',
      students: 18,
      type: 'workshop'
    },
    { 
      id: 4, 
      title: 'Electrical - Circuit Design', 
      date: '2024-01-28', 
      time: '11:00 AM',
      instructor: 'Sarah Johnson',
      students: 10,
      type: 'theory'
    }
  ];

  // Pending assessments
  const pendingAssessments = [
    { id: 1, student: 'Kamal Perera', course: 'IT Fundamentals', dueDate: '2024-01-22', type: 'Practical' },
    { id: 2, student: 'Samantha Silva', course: 'Welding Basics', dueDate: '2024-01-23', type: 'Theory' },
    { id: 3, student: 'Ajith Fernando', course: 'Auto Mechanics', dueDate: '2024-01-24', type: 'Practical' },
    { id: 4, student: 'Nimal Rathnayake', course: 'Electrical Safety', dueDate: '2024-01-25', type: 'Both' }
  ];

  return (
    <div className="min-h-screen bg-gray-50"> 
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Training Officer Dashboard</h1>
          <p className="text-gray-600 mt-2">NAITA Kampala Center - Training Management & Student Progress</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Assigned Students"
            value="85"
            icon={Users}
            trend={{ value: 12, isPositive: true }}
            color="sky"
          />
          <StatsCard
            title="Training Sessions"
            value="24"
            icon={BookOpen}
            trend={{ value: 3, isPositive: true }}
            color="lime"
          />
          <StatsCard
            title="Avg. Performance"
            value="85%"
            icon={TrendingUp}
            trend={{ value: 8, isPositive: true }}
            color="green"
          />
          <StatsCard
            title="Pending Assessments"
            value="18"
            icon={Clock}
            trend={{ value: 5, isPositive: false }}
            color="yellow"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Training Progress */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Progress by Course</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trainingProgressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="course" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="progress" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Student Performance Trend */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Performance Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={studentPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="average" stroke="#3b82f6" strokeWidth={2} name="Average Score" />
                <Line type="monotone" dataKey="top" stroke="#10b981" strokeWidth={2} name="Top Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Skill Level Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Skill Level Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={skillDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {skillDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Upcoming Training Sessions */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Training Sessions</h3>
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${
                      session.type === 'regular' ? 'bg-blue-100 text-blue-600' :
                      session.type === 'safety' ? 'bg-red-100 text-red-600' :
                      session.type === 'workshop' ? 'bg-green-100 text-green-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{session.title}</p>
                      <p className="text-xs text-gray-500">
                        {session.date} • {session.time} • {session.instructor}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{session.students} students</p>
                    <button className="mt-1 text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors">
                      Prepare
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Assessments */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Assessments</h3>
            <div className="space-y-3">
              {pendingAssessments.map((assessment) => (
                <div key={assessment.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{assessment.student}</p>
                    <p className="text-xs text-gray-500">{assessment.course} • Due: {assessment.dueDate}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      assessment.type === 'Practical' ? 'bg-orange-100 text-orange-800' :
                      assessment.type === 'Theory' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {assessment.type}
                    </span>
                    <button className="text-green-600 hover:text-green-800 p-1">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Management</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center space-x-3">
                <Award className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900">Record Assessment</div>
                  <div className="text-sm text-gray-500">Enter student performance scores</div>
                </div>
              </button>
              <button className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center space-x-3">
                <BookOpen className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium text-gray-900">Schedule Training</div>
                  <div className="text-sm text-gray-500">Plan new training sessions</div>
                </div>
              </button>
              <button className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center space-x-3">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="font-medium text-gray-900">Student Progress</div>
                  <div className="text-sm text-gray-500">View individual student reports</div>
                </div>
              </button>
              <button className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="font-medium text-gray-900">Generate Training Report</div>
                  <div className="text-sm text-gray-500">Monthly training effectiveness</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingOfficerOverview;