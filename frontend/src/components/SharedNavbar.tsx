import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface NavbarProps {
  userRole: 'admin' | 'district_manager' | 'training_officer' | 'data_entry' | 'instructor';
  userName: string;
  children: React.ReactNode;
}

const SharedNavbar: React.FC<NavbarProps> = ({ userRole, userName, children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const getNavItems = () => {
    switch (userRole) {
      case 'admin':
        return [
          { path: '/dashboard/admin', label: 'Overview', icon: '📊' },
          { path: '/dashboard/admin/centers', label: 'Centers', icon: '🏢' },
          { path: '/dashboard/admin/users', label: 'Users', icon: '👥' },
          { path: '/dashboard/admin/instructors', label: 'Instructors', icon: '👨‍🏫' },
          { path: '/dashboard/admin/approvals', label: 'Approvals', icon: '✅' },
          { path: '/dashboard/admin/courses', label: 'Courses', icon: '📚' },
          { path: '/dashboard/admin/students', label: 'Students', icon: '👨‍🎓' },
          { path: '/dashboard/admin/reports', label: 'Reports', icon: '📈' }
        ];
      case 'district_manager':
        return [
          { path: '/dashboard/manager', label: 'Overview', icon: '📊' },
          { path: '/dashboard/manager/centers', label: 'Centers', icon: '🏢' },
          { path: '/dashboard/manager/courses', label: 'Courses', icon: '📚' },
          { path: '/dashboard/manager/users', label: 'Users', icon: '👥' },
          { path: '/dashboard/manager/students', label: 'Students', icon: '👨‍🎓' },
          { path: '/dashboard/manager/instructors', label: 'Instructors', icon: '👨‍🏫' },
          { path: '/dashboard/manager/approvals_dm', label: 'Approvals', icon: '✅' },
          { path: '/dashboard/manager/reports', label: 'Reports', icon: '📈' }
        ];
      case 'training_officer':
        return [
          { path: '/dashboard/training_officer', label: 'Overview', icon: '📊' },
          { path: '/dashboard/training_officer/courses', label: 'Courses', icon: '📚' },
          { path: '/dashboard/training_officer/users', label: 'Users', icon: '👥' },
          { path: '/dashboard/training_officer/instructors', label: 'Instructors', icon: '👨‍🏫' },
          { path: '/dashboard/training_officer/reports', label: 'Reports', icon: '📈' }
        ];
      case 'data_entry':
        return [
          { path: '/dashboard/data-entry/overview', label: 'Overview', icon: '📊' },
          { path: '/dashboard/data-entry', label: 'Students', icon: '👨‍🎓' }
        ];
      case 'instructor':
        return [
          { path: '/dashboard/instructor', label: 'Overview', icon: '📊' },
          { path: '/dashboard/instructor/courses', label: 'My Courses', icon: '📚' },
          { path: '/dashboard/instructor/student', label: 'Students', icon: '👨‍🎓' },
          { path: '/dashboard/instructor/attendance', label: 'Attendance', icon: '📝' },
        ];
      default:
        return [];
    }
  };


  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const navItems = getNavItems();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Hidden on mobile, visible on md+ */}
      <div
        className={`hidden md:flex md:flex-col bg-white shadow-lg border-r border-gray-200 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-transparent rounded-full flex items-center justify-center flex-shrink-0">
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
            {!isSidebarCollapsed && (
              <span className="text-xl font-bold text-gray-900">NAITA MIS</span>
            )}
          </div>

          {/* Collapse Button */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors group ${location.pathname === item.path
                  ? 'text-green-600 bg-green-50 border-r-2 border-green-600'
                  : 'text-gray-700 hover:text-green-600 hover:bg-gray-50'
                } ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title={isSidebarCollapsed ? item.label : ''}
            >
              <span className="text-lg mr-3">{item.icon}</span>
              {!isSidebarCollapsed && (
                <span className="flex-1">{item.label}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 p-4">
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isSidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{userName}</p>
                  <p className="text-xs text-gray-500 capitalize">{userRole.replace('_', ' ')}</p>
                </div>
              </div>
            )}
            {isSidebarCollapsed && (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`p-2 text-gray-400 hover:text-red-600 transition-colors ${isSidebarCollapsed ? 'mt-2' : ''
                }`}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Navigation Button */}
        <div className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-transparent rounded-full flex items-center justify-center flex-shrink-0">
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
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Menu - Full width on mobile */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${location.pathname === item.path
                      ? 'text-green-600 bg-green-50'
                      : 'text-gray-700 hover:text-green-600 hover:bg-gray-50'
                    }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="text-lg mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 w-full"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SharedNavbar;