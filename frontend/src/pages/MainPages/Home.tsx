import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, GraduationCap, BarChart3, ArrowRight} from 'lucide-react';

const Home: React.FC = () => {
  const features = [
    {
      icon: Building2,
      title: 'Center Management',
      description: 'Monitor and manage all 49 NAITA training centers across Sri Lanka from a centralized dashboard.',
      color: 'green'
    },
    {
      icon: Users,
      title: 'Student Tracking',
      description: 'Track student enrollment, attendance, progress, and completion rates in real-time.',
      color: 'yellow'
    },
    {
      icon: GraduationCap,
      title: 'Staff Management',
      description: 'Manage instructors, staff performance, and training schedules efficiently.',
      color: 'sky'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Generate comprehensive reports and analytics for data-driven decision making.',
      color: 'lime'
    }
  ];

  const stats = [
    { label: 'Training Centers', value: '49', color: 'text-green-600' },
    { label: 'Active Students', value: '15,847', color: 'text-yellow-500' },
    { label: 'Instructors', value: '1,234', color: 'text-sky-400' },
    { label: 'Completion Rate', value: '87%', color: 'text-lime-800' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-transparent rounded-full flex items-center justify-center flex-shrink-0">
                <img 
                  src="/naita-logo.png" 
                  alt="NAITA Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextSibling && ((target.nextSibling as HTMLElement).style.display = 'flex');
                  }}
                />
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center hidden">
                  <span className="text-red-600 font-bold text-lg">N</span>
                </div>
              </div>
              <span className="text-xl font-bold text-gray-900">NAITA MIS</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                to="/login"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Login
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-lime-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              NAITA Digital
              <span className="text-green-600"> Monitoring System</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Centralized monitoring and management system for all 49 NAITA training centers across Sri Lanka. 
              Track attendance, monitor progress, and generate comprehensive reports in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#features"
                className="border border-green-600 text-green-600 px-8 py-3 rounded-lg hover:bg-green-50 transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-4xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Management Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to monitor and manage NAITA training centers efficiently
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const colorClasses = {
                green: 'bg-green-600 text-white',
                yellow: 'bg-yellow-500 text-white',
                sky: 'bg-sky-400 text-white',
                lime: 'bg-lime-800 text-white'
              };

              return (
                <div key={index} className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
                  <div className={`p-3 rounded-lg ${colorClasses[feature.color as keyof typeof colorClasses]} w-fit mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;