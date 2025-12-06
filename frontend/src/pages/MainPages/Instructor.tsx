// Updated Instructor.tsx - Removed Edit Profile button
import React, { useState, useEffect } from 'react';
import { 
  Search, Mail, Phone, User, ChevronDown, Loader, 
  Users, BookOpen, CheckCircle, 
  XCircle, Filter, Plus, Building,
  AlertTriangle,
  UserCheck,
  UserX
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  fetchUsers,
  fetchCenters,
  fetchCourses,
  toggleInstructorStatus,
  checkAccountStatus,
  logoutUser,
  type UserType,
  type Center,
  type CourseType
} from '../../api/api';

// Deactivation Confirmation Modal Component
const DeactivationConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  instructorName: string;
  isCurrentlyActive: boolean;
  isSelf: boolean;
  loading?: boolean;
}> = ({
  isOpen,
  onClose,
  onConfirm,
  instructorName,
  isCurrentlyActive,
  isSelf,
  loading = false
}) => {
  if (!isOpen) return null;
  
  const title = isCurrentlyActive ? 'Deactivate Instructor' : 'Activate Instructor';
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-start mb-4">
          <div className={`p-3 rounded-full ${isCurrentlyActive ? 'bg-red-100' : 'bg-green-100'} mr-4`}>
            {isCurrentlyActive ? (
              <UserX className="w-6 h-6 text-red-600" />
            ) : (
              <UserCheck className="w-6 h-6 text-green-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">
              Instructor: <span className="font-medium">{instructorName}</span>
            </p>
          </div>
        </div>
        
        {isSelf && isCurrentlyActive ? (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" />
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> You are about to deactivate your own account.
                This will immediately log you out and you won't be able to login again
                until another administrator reactivates your account.
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-sm text-gray-700">
              {isCurrentlyActive ? (
                <>
                  Are you sure you want to deactivate this instructor?
                  <ul className="mt-2 ml-4 list-disc text-gray-600 space-y-1">
                    <li>They will be immediately logged out of all sessions</li>
                    <li>Cannot login until reactivated by an administrator</li>
                    <li>Cannot access any dashboard features</li>
                    <li>Will receive an email notification</li>
                  </ul>
                </>
              ) : (
                <>
                  Are you sure you want to activate this instructor?
                  <ul className="mt-2 ml-4 list-disc text-gray-600 space-y-1">
                    <li>They will be able to login immediately</li>
                    <li>Access will be restored to all features</li>
                    <li>Will receive an activation notification email</li>
                  </ul>
                </>
              )}
            </p>
          </div>
        )}
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
            }}
            disabled={loading || (isSelf && isCurrentlyActive)}
            className={`px-4 py-2 rounded-lg text-white transition-colors flex items-center justify-center min-w-[120px] ${
              isCurrentlyActive
                ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
                : 'bg-green-600 hover:bg-green-700 disabled:bg-green-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : isCurrentlyActive ? (
              'Deactivate'
            ) : (
              'Activate'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

interface InstructorWithDetails extends UserType {
  specialization?: string;
  is_verified?: boolean;
  courses?: CourseType[];
  centers?: Center[];
  active_courses_count?: number;
  total_students?: number;
}

const Instructors: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedInstructor, setExpandedInstructor] = useState<number | null>(null);
  const [instructors, setInstructors] = useState<InstructorWithDetails[]>([]);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [specializationFilter, setSpecializationFilter] = useState<string>('all');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [allCenters, setAllCenters] = useState<Center[]>([]);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<{
    id: number;
    name: string;
    is_active: boolean;
    email: string;
  } | null>(null);

  useEffect(() => {
    loadAllData();
    
    // Check current user's account status on mount
    checkCurrentUserStatus();
  }, []);

  // Function to check current user's account status
  const checkCurrentUserStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      
      const status = await checkAccountStatus();
      if (!status.is_active) {
        toast.error('Your account has been deactivated. Please contact your administrator.');
        setTimeout(() => {
          logoutUser();
          window.location.href = '/login';
        }, 3000);
      }
    } catch (error) {
      console.error('Error checking account status:', error);
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [users, courses, centers] = await Promise.all([
        fetchUsers(),
        fetchCourses(),
        fetchCenters()
      ]);
      
      setAllUsers(users);
      setAllCenters(centers);
      
      // Filter only users with role='instructor'
      const instructorUsers = users.filter(user => user.role === 'instructor');
      
      // Calculate course and student counts for each instructor
      const instructorsData: InstructorWithDetails[] = instructorUsers.map(user => {
        // Get courses for this instructor
        const instructorCourses = courses.filter(course => course.instructor === user.id);
        
        // Calculate total students
        const totalStudents = instructorCourses.reduce((sum, course) => sum + (course.students || 0), 0);
        
        // Get active courses (Active or Approved status)
        const activeCourses = instructorCourses.filter(course => 
          course.status === 'Active' || course.status === 'Approved'
        );
        
        // Get specialization from course categories or use district
        const courseCategories = instructorCourses
          .map(c => c.category)
          .filter(Boolean) as string[];
        
        const specialization = courseCategories.length > 0 
          ? courseCategories[0] 
          : user.center?.district || user.district || 'General';
        
        return {
          ...user,
          specialization,
          is_verified: user.is_active,
          courses: instructorCourses,
          active_courses_count: activeCourses.length,
          total_students: totalStudents,
        };
      });
      
      setInstructors(instructorsData);
      calculateStats(instructorsData);
      
      // Extract unique specializations
      const uniqueSpecializations = Array.from(
        new Set(instructorsData.map(i => i.specialization || 'General'))
      );
      setSpecializations(uniqueSpecializations);
      
      toast.success(`Loaded ${instructorUsers.length} instructors`);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (instructorsData: InstructorWithDetails[]) => {
    const total_instructors = instructorsData.length;
    const active_instructors = instructorsData.filter(i => i.is_active).length;
    const inactive_instructors = instructorsData.filter(i => !i.is_active).length;
    
    // Calculate average courses per instructor using real data
    const totalCourses = instructorsData.reduce((sum, i) => 
      sum + (i.active_courses_count || 0), 0
    );
    const average_courses = totalCourses / total_instructors || 0;
    
    // Calculate average students per instructor
    const totalStudents = instructorsData.reduce((sum, i) => 
      sum + (i.total_students || 0), 0
    );
    const average_students = totalStudents / total_instructors || 0;
    
    // Calculate top specializations based on actual data
    const specializationCount: Record<string, number> = {};
    instructorsData.forEach(instructor => {
      const spec = instructor.specialization || 'General';
      specializationCount[spec] = (specializationCount[spec] || 0) + 1;
    });
    
    const top_specializations = Object.entries(specializationCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
    
    // Calculate distribution by district
    const districtDistribution: Record<string, number> = {};
    instructorsData.forEach(instructor => {
      const district = instructor.district || 'Not assigned';
      districtDistribution[district] = (districtDistribution[district] || 0) + 1;
    });
    
    setStats({
      total_instructors,
      active_instructors,
      inactive_instructors,
      average_courses: parseFloat(average_courses.toFixed(1)),
      average_students: Math.round(average_students),
      top_specializations,
      district_distribution: districtDistribution,
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const openStatusModal = (instructor: InstructorWithDetails) => {
    setSelectedInstructor({
      id: instructor.id,
      name: `${instructor.first_name} ${instructor.last_name}`,
      is_active: instructor.is_active,
      email: instructor.email
    });
    setModalOpen(true);
  };

  const handleStatusChange = async () => {
    if (!selectedInstructor) return;

    try {
      setDeletingId(selectedInstructor.id);
      
      // Call the new toggle status endpoint
      const response = await toggleInstructorStatus(selectedInstructor.id);
      
      // Update local state
      setInstructors(prev => prev.map(instructor =>
        instructor.id === selectedInstructor.id 
          ? { ...instructor, is_active: response.is_active } 
          : instructor
      ));
      
      // Recalculate stats
      calculateStats(instructors.map(instructor =>
        instructor.id === selectedInstructor.id 
          ? { ...instructor, is_active: response.is_active } 
          : instructor
      ));
      
      toast.success(response.detail);
      
      // Check if deactivating current user
      const currentUserId = parseInt(localStorage.getItem('user_id') || '0');
      
      if (selectedInstructor.id === currentUserId && !response.is_active) {
        setTimeout(() => {
          toast.error('Your account has been deactivated. You will be logged out.');
          logoutUser();
          window.location.href = '/login';
        }, 2000);
      }
      
      // Close modal
      setModalOpen(false);
      setSelectedInstructor(null);
      
    } catch (error: any) {
      console.error('Error updating instructor status:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to update instructor status';
      toast.error(errorMessage);
      
      // Special handling for self-deactivation attempt
      if (error.response?.status === 400 && error.response?.data?.detail?.includes('own account')) {
        toast.error('You cannot deactivate your own account. Please ask another administrator.');
      }
      
      // Check permissions error
      if (error.response?.status === 403) {
        toast.error('You do not have permission to perform this action.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpanded = (id: number) => {
    setExpandedInstructor(expandedInstructor === id ? null : id);
  };

  const filteredInstructors = instructors.filter(instructor => {
    const fullName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.toLowerCase().trim();
    const matchesSearch = !searchTerm || 
      fullName.includes(searchTerm.toLowerCase()) ||
      instructor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructor.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && instructor.is_active) ||
      (statusFilter === 'inactive' && !instructor.is_active);
    
    const matchesSpecialization = specializationFilter === 'all' || 
      instructor.specialization === specializationFilter;
    
    return matchesSearch && matchesStatus && matchesSpecialization;
  });

  const getInstructorCenters = (instructor: InstructorWithDetails) => {
    const centers: Center[] = [];
    
    // Add user's assigned center if available
    if (instructor.center) {
      const userCenter = allCenters.find(c => c.id === instructor.center?.id);
      if (userCenter && !centers.some(c => c.id === userCenter.id)) {
        centers.push(userCenter);
      }
    }
    
    // Add centers from instructor's courses
    if (instructor.courses) {
      instructor.courses.forEach(course => {
        if (course.center_details) {
          const centerExists = centers.some(c => c.id === course.center_details?.id);
          if (!centerExists) {
            centers.push(course.center_details);
          }
        }
      });
    }
    
    return centers;
  };

  // Function to get role-based access
  const canManageInstructors = () => {
    const userRole = localStorage.getItem("user_role");
    return userRole === 'admin' || userRole === 'district_manager' || userRole === 'training_officer';
  };

  // Check if current user is the instructor being managed
  const isCurrentUser = (instructorId: number) => {
    const currentUserId = parseInt(localStorage.getItem('user_id') || '0');
    return instructorId === currentUserId;
  };

  // Get status badge color
  const getStatusBadgeColor = (isActive: boolean) => {
    if (isActive) {
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        dot: 'bg-green-400'
      };
    } else {
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        dot: 'bg-red-400'
      };
    }
  };

  // Get status action button
  const getStatusActionButton = (instructor: InstructorWithDetails) => {
    const isSelf = isCurrentUser(instructor.id);
    
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          openStatusModal(instructor);
        }}
        disabled={deletingId === instructor.id}
        className={`px-4 py-2 rounded-lg transition-colors flex items-center justify-center ${
          instructor.is_active
            ? 'bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50'
            : 'bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50'
        } ${isSelf && instructor.is_active ? 'cursor-not-allowed opacity-60' : ''}`}
        title={isSelf && instructor.is_active ? "You cannot deactivate your own account" : ""}
      >
        {deletingId === instructor.id ? (
          <Loader className="w-4 h-4 mr-2 animate-spin" />
        ) : instructor.is_active ? (
          <>
            <XCircle className="w-4 h-4 mr-2" />
            Deactivate
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Activate
          </>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Deactivation Confirmation Modal */}
      <DeactivationConfirmModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedInstructor(null);
        }}
        onConfirm={handleStatusChange}
        instructorName={selectedInstructor?.name || ''}
        isCurrentlyActive={selectedInstructor?.is_active || false}
        isSelf={selectedInstructor ? isCurrentUser(selectedInstructor.id) : false}
        loading={deletingId === selectedInstructor?.id}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header and Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Instructors Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage instructor profiles (showing only users with 'instructor' role)
            </p>
          </div>
          {canManageInstructors() && (
            <button
              onClick={() => {
                // Get current user role
                const userRole = localStorage.getItem("user_role") || "";
                
                // Define paths for different roles
                let usersPagePath = '/dashboard/admin/users';
                
                if (userRole === 'district_manager') {
                  usersPagePath = '/dashboard/manager/users';
                } else if (userRole === 'training_officer') {
                  usersPagePath = '/dashboard/training_officer/users';
                } else if (userRole === 'admin') {
                  usersPagePath = '/dashboard/admin/users';
                }
                
                window.location.href = usersPagePath;
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Instructor
            </button>
          )}
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Instructors</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_instructors}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.active_instructors} active • {stats.inactive_instructors} inactive
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-500 bg-green-50 p-1.5 rounded-lg" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.average_courses.toFixed(1)}</p>
                  <p className="text-xs text-gray-500 mt-1">per instructor</p>
                </div>
                <BookOpen className="w-8 h-8 text-purple-500 bg-purple-50 p-1.5 rounded-lg" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Students</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.average_students}</p>
                  <p className="text-xs text-gray-500 mt-1">per instructor</p>
                </div>
                <Users className="w-8 h-8 text-blue-500 bg-blue-50 p-1.5 rounded-lg" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Role Filter</p>
                  <p className="text-lg font-bold text-gray-900">Instructor Only</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Showing {allUsers.filter(u => u.role === 'instructor').length} of {allUsers.length} users
                  </p>
                </div>
                <Filter className="w-8 h-8 text-yellow-500 bg-yellow-50 p-1.5 rounded-lg" />
              </div>
            </div>
          </div>
        )}

        {/* Role Information Bar */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">
                Showing only users with <span className="font-bold">'instructor'</span> role
              </p>
              <p className="text-xs text-blue-600 mt-1">
                To view all users or add new instructors, go to the Users page
              </p>
              <p className="text-xs text-blue-500 mt-1">
                <span className="font-medium">Note:</span> Deactivated instructors will be immediately logged out and cannot login until reactivated.
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search instructors by name, email, or specialization..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-4">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={specializationFilter}
                  onChange={(e) => setSpecializationFilter(e.target.value)}
                  className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="all">All Specializations</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <button
                onClick={loadAllData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Instructors List */}
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredInstructors.length > 0 ? (
          <>
            <div className="space-y-4">
              {filteredInstructors.map((instructor) => {
                const instructorCourses = instructor.courses || [];
                const activeCourses = instructorCourses.filter(course => 
                  course.status === 'Active' || course.status === 'Approved'
                );
                const totalStudents = instructor.total_students || 0;
                const instructorCenters = getInstructorCenters(instructor);
                const statusColors = getStatusBadgeColor(instructor.is_active);
                
                return (
                  <div 
                    key={instructor.id} 
                    className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
                  >
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleExpanded(instructor.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          instructor.is_active ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {instructor.first_name && instructor.last_name ? (
                            <span className={`font-semibold ${
                              instructor.is_active ? 'text-blue-700' : 'text-gray-500'
                            }`}>
                              {instructor.first_name[0]}{instructor.last_name[0]}
                            </span>
                          ) : (
                            <User className={`w-6 h-6 ${
                              instructor.is_active ? 'text-blue-500' : 'text-gray-400'
                            }`} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">
                              {instructor.first_name} {instructor.last_name}
                            </h3>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              Instructor
                            </span>
                            {isCurrentUser(instructor.id) && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{instructor.specialization || 'General'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-400">
                              {instructor.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                          <p className="text-sm font-medium text-gray-900">
                            {activeCourses.length} Course{activeCourses.length !== 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-gray-500">{totalStudents} Student{totalStudents !== 1 ? 's' : ''}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${statusColors.bg} ${statusColors.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusColors.dot}`}></span>
                          {instructor.is_active ? 'Active' : 'Inactive'}
                        </div>
                        <ChevronDown 
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            expandedInstructor === instructor.id ? 'rotate-180' : ''
                          }`} 
                        />
                      </div>
                    </div>

                    {expandedInstructor === instructor.id && (
                      <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                          <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              {instructor.email}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Phone</p>
                            <p className="font-medium flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              {instructor.phone || 'Not provided'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Role</p>
                            <p className="font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full inline-block">
                              {instructor.role}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">District</p>
                            <p className="font-medium">
                              {instructor.district || 'Not assigned'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Assigned Center</p>
                            <p className="font-medium">
                              {instructor.center?.name || 'Not assigned'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <p className={`font-medium px-2 py-1 rounded-full inline-block flex items-center gap-1.5 ${statusColors.bg} ${statusColors.text}`}>
                              <span className={`w-2 h-2 rounded-full ${statusColors.dot}`}></span>
                              {instructor.is_active ? 'Active' : 'Inactive'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium text-gray-900">Assigned Courses</h4>
                              <span className="text-xs text-gray-500">
                                {instructorCourses.length} total • {activeCourses.length} active
                              </span>
                            </div>
                            {instructorCourses.length > 0 ? (
                              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {instructorCourses.map(course => (
                                  <div key={course.id} className="p-3 bg-white rounded-lg border border-gray-200">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-900">{course.name}</p>
                                        <p className="text-sm text-gray-500">{course.code} • {course.duration}</p>
                                      </div>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                        course.status === 'Active' ? 'bg-green-100 text-green-800' :
                                        course.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                                        course.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                        course.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {course.status}
                                      </span>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-600 grid grid-cols-2 gap-2">
                                      <div>
                                        <span className="font-medium">Students:</span> {course.students || 0}
                                      </div>
                                      <div>
                                        <span className="font-medium">Progress:</span> {course.progress || 0}%
                                      </div>
                                      {course.center_details && (
                                        <div className="col-span-2">
                                          <span className="font-medium">Center:</span> {course.center_details.name}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-4 bg-white rounded-lg border border-gray-200 text-center">
                                <p className="text-gray-500">No courses assigned yet</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Assign courses from the Courses page
                                </p>
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium text-gray-900">Working Centers</h4>
                              <span className="text-xs text-gray-500">
                                {instructorCenters.length} center{instructorCenters.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            {instructorCenters.length > 0 ? (
                              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {instructorCenters.map(center => (
                                  <div key={center.id} className="p-3 bg-white rounded-lg border border-gray-200">
                                    <div className="flex items-start">
                                      <Building className="w-5 h-5 mr-2 text-gray-600 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                          <span className="font-medium">{center.name}</span>
                                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                            Center
                                          </span>
                                        </div>
                                        <div className="mt-1 text-sm text-gray-600 space-y-1">
                                          <p>District: {center.district}</p>
                                          {center.location && <p>Location: {center.location}</p>}
                                          {center.phone && <p>Phone: {center.phone}</p>}
                                          {center.manager && <p>Manager: {center.manager}</p>}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-4 bg-white rounded-lg border border-gray-200 text-center">
                                <p className="text-gray-500">No centers assigned yet</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Assign centers from the Centers page
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
                          {canManageInstructors() && getStatusActionButton(instructor)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer Info */}
            <div className="mt-6 text-sm text-gray-600 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p>
                  Showing <span className="font-semibold text-gray-900">{filteredInstructors.length}</span> of{' '}
                  <span className="font-semibold text-gray-900">{instructors.length}</span> instructors
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Filtered from {allUsers.length} total users in the system
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    <span className="text-xs">Active</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                    <span className="text-xs">Inactive</span>
                  </div>
                </div>
              </div>
              
              {stats?.top_specializations && Object.keys(stats.top_specializations).length > 0 && (
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Top specializations:</span>{' '}
                  {Object.entries(stats.top_specializations)
                    .map(([spec, count]) => `${spec} (${count})`)
                    .join(', ')}
                </div>
              )}
              
              {stats?.district_distribution && Object.keys(stats.district_distribution).length > 0 && (
                <div className="text-xs text-gray-500">
                  <span className="font-medium">By district:</span>{' '}
                  {Object.entries(stats.district_distribution)
                    .map(([district, count]) => `${district} (${count})`)
                    .join(', ')}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
            {instructors.length === 0 ? (
              <>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No instructors found</h3>
                <p className="text-gray-500 mt-2">
                  There are no users with the 'instructor' role in the system yet.
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  There are {allUsers.length} total users in the system.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => {
                      const userRole = localStorage.getItem("user_role") || "";
                      let usersPath = '/dashboard/admin/users';
                      
                      if (userRole === 'district_manager') {
                        usersPath = '/dashboard/manager/users';
                      } else if (userRole === 'training_officer') {
                        usersPath = '/dashboard/training_officer/users';
                      } else if (userRole === 'admin') {
                        usersPath = '/dashboard/admin/users';
                      }
                      
                      window.location.href = usersPath;
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Instructor
                  </button>
                  <button
                    onClick={loadAllData}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              </>
            ) : (
              <>
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No matching instructors found</h3>
                <p className="text-gray-500 mt-2">
                  Try adjusting your search or filters. There are {instructors.length} instructors in total.
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Remember: Only showing users with 'instructor' role.
                </p>
                <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setSpecializationFilter('all');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={loadAllData}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Refresh Data
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Instructors;