// HeadOfficeCourses.tsx - UPDATED VERSION WITH REAL DATA
import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Building, Users, RefreshCw, AlertCircle } from 'lucide-react';
import { type CourseType, fetchCourses, fetchCourseCategories } from '../../api/api';
import toast from 'react-hot-toast';

const HeadOfficeCourses: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
    loadCategories();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const coursesData = await fetchCourses();
      setCourses(coursesData);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to load courses';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await fetchCourseCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const districts = ['All Districts', ...new Set(courses.map(course => course.district).filter(Boolean))];
  const statuses = ['All Status', 'Active', 'Pending', 'Approved', 'Rejected', 'Inactive'];
  const allCategories = ['All Categories', ...categories];

  let filteredCourses = courses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.instructor_details && 
        `${course.instructor_details.first_name} ${course.instructor_details.last_name}`
          .toLowerCase().includes(searchTerm.toLowerCase())) ||
      course.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.center_details && course.center_details.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (selectedDistrict !== 'All Districts') {
    filteredCourses = filteredCourses.filter(course => course.district === selectedDistrict);
  }

  if (selectedStatus !== 'All Status') {
    filteredCourses = filteredCourses.filter(course => course.status === selectedStatus);
  }

  if (selectedCategory !== 'All Categories') {
    filteredCourses = filteredCourses.filter(course => course.category === selectedCategory);
  }

  const groupedCourses = filteredCourses.reduce((acc: { [key: string]: CourseType[] }, course) => {
    const district = course.district || 'Unknown District';
    if (!acc[district]) {
      acc[district] = [];
    }
    acc[district].push(course);
    return acc;
  }, {});

  // Calculate statistics
  const totalCourses = courses.length;
  const activeCourses = courses.filter(c => c.status === 'Active' || c.status === 'Approved').length;
  const pendingCourses = courses.filter(c => c.status === 'Pending').length;
  const totalStudents = courses.reduce((acc, c) => acc + c.students, 0);
  const avgProgress = courses.length > 0 
    ? Math.round(courses.reduce((acc, c) => acc + c.progress, 0) / courses.length)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
          <div className="text-lg text-gray-600">Loading courses...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <button
            onClick={loadCourses}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Courses Overview</h1>
              <p className="text-gray-600 mt-2">Manage and monitor courses across all districts</p>
            </div>
            <button
              onClick={loadCourses}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalCourses}</div>
                <div className="text-sm text-gray-600">Total Courses</div>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{activeCourses}</div>
                <div className="text-sm text-gray-600">Active Courses</div>
              </div>
              <BookOpen className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-sky-500">{totalStudents}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
              <Users className="w-8 h-8 text-sky-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-lime-600">{avgProgress}%</div>
                <div className="text-sm text-gray-600">Avg Progress</div>
              </div>
              <BookOpen className="w-8 h-8 text-lime-500" />
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {allCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {filteredCourses.length} of {courses.length} courses
          </div>
          {pendingCourses > 0 && (
            <div className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              {pendingCourses} courses pending approval
            </div>
          )}
        </div>

        {/* District-wise Sections */}
        {Object.entries(groupedCourses).map(([district, districtCourses]) => (
          <div key={district} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{district}</h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {districtCourses.length} courses
              </span>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Course Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Center
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Schedule
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Instructor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Students
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {districtCourses.map((course) => (
                      <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-green-700" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {course.name}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center space-x-2">
                                <span>{course.code}</span>
                                {course.category && (
                                  <>
                                    <span>•</span>
                                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                      {course.category}
                                    </span>
                                  </>
                                )}
                              </div>
                              {course.description && (
                                <div className="text-xs text-gray-400 mt-1 truncate">
                                  {course.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Building className="w-4 h-4 text-gray-400" />
                            <span>
                              {course.center_details 
                                ? course.center_details.name
                                : 'No center assigned'
                              }
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div>
                            {course.schedule || 'Not scheduled'}
                          </div>
                          {course.duration && (
                            <div className="text-xs text-gray-400">
                              {course.duration}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {course.instructor_details 
                            ? (
                                <div>
                                  <div className="font-medium">
                                    {course.instructor_details.first_name} {course.instructor_details.last_name}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {course.instructor_details.email}
                                  </div>
                                </div>
                              )
                            : (
                                <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded-full text-xs">
                                  Not assigned
                                </span>
                              )
                          }
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {course.students}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${course.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-8">
                              {course.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                              course.status === 'Active' 
                                ? 'bg-green-100 text-green-800'
                                : course.status === 'Approved'
                                ? 'bg-blue-100 text-blue-800'
                                : course.status === 'Pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : course.status === 'Rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {course.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}

        {/* Show message if no courses found */}
        {Object.keys(groupedCourses).length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-200">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {courses.length === 0 
                ? 'No courses available in the system.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {courses.length === 0 && (
              <button
                onClick={loadCourses}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Refresh Data
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeadOfficeCourses;