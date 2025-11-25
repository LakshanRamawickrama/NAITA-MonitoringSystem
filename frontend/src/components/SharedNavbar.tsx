import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, Bell } from 'lucide-react';

interface NavbarProps {
  userRole: 'admin' | 'district_manager' | 'training_officer' | 'data_entry' | 'instructor';
  userName: string;
}

const SharedNavbar: React.FC<NavbarProps> = ({ userRole, userName }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  
const getNavItems = () => {
  switch (userRole) {
    case 'admin':
      return [
        { path: '/dashboard/admin', label: 'Overview' },
        { path: '/dashboard/admin/centers', label: 'Centers' },
        { path: '/dashboard/admin/users', label: 'Users' },
        { path: '/dashboard/admin/approvals', label: 'Approvals' },
        {path: '/dashboard/admin/courses', label: 'Courses' },
        { path: '/dashboard/admin/reports', label: 'Reports' }
      ];
    case 'district_manager':
      return [
        { path: '/dashboard/manager', label: 'Overview' },
        {path: '/dashboard/manager/centers', label: 'Centers' },
        { path: '/dashboard/manager/courses', label: 'Courses' },
        {path: '/dashboard/manager/users', label: 'Users' },
        {path: '/dashboard/manager/approvals_dm', label: 'Approvals' },
        {path: '/dashboard/manager/reports', label: 'Reports' }
      ];
    case 'training_officer':
      return [
        { path: '/dashboard/training_officer', label: 'overview' },
        {path: '/dashboard/training_officer/courses', label: 'Courses' },
        {path: '/dashboard/training_officer/instructors', label: 'Instructors' },  
        {path: '/dashboard/training_officer/reports', label: 'Reports' }
      ];
    case 'data_entry':
      return [
        { path: '/dashboard/data-entry/overview', label: 'Overview' },
        { path: '/dashboard/data-entry', label: 'Students' }
        
      ];
     case 'instructor':
      return [
        {path: '/dashboard/instructor', label: 'Overview' },
        { path: '/dashboard/instructor/courses', label: 'My Courses' },
        { path: '/dashboard/instructor/student', label: 'Students' },
        { path: '/dashboard/instructor/attendance', label: 'Attendance' },

      ]; 
    default:
      return [];
  }
};

// Logout
const handleLogout = () => {
  localStorage.clear();
  navigate("/");
};

  

  const navItems = getNavItems();

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="text-xl font-bold text-gray-900">NAITA MIS</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-700 hover:text-green-600 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">{userName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-700 hover:text-green-600 hover:bg-gray-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-gray-200 pt-4 pb-3">
              <div className="flex items-center px-3">
                <User className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-700">{userName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="mt-3 block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default SharedNavbar;