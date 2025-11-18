import React, { useState } from 'react';
import SharedNavbar from '../../components/SharedNavbar';
import DataTable from '../../components/DataTable';
import { Search, Plus, User, Mail, Shield } from 'lucide-react';

const Users: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const usersData = [
    {
      id: 1,
      name: 'Sarah Nakato',
      email: 'sarah.nakato@naita.go.ug',
      role: 'Center Manager',
      center: 'NAITA Kampala Center',
      phone: '+256 700 123 456',
      status: 'Active',
      lastLogin: '2024-01-15 09:30'
    },
    {
      id: 2,
      name: 'James Okello',
      email: 'james.okello@naita.go.ug',
      role: 'Center Manager',
      center: 'NAITA Gulu Center',
      phone: '+256 700 234 567',
      status: 'Active',
      lastLogin: '2024-01-15 08:45'
    },
    {
      id: 3,
      name: 'Grace Tumusiime',
      email: 'grace.tumusiime@naita.go.ug',
      role: 'Center Manager',
      center: 'NAITA Mbarara Center',
      phone: '+256 700 345 678',
      status: 'Active',
      lastLogin: '2024-01-14 16:20'
    },
    {
      id: 4,
      name: 'Robert Wamala',
      email: 'robert.wamala@naita.go.ug',
      role: 'Instructor',
      center: 'NAITA Jinja Center',
      phone: '+256 700 456 789',
      status: 'Active',
      lastLogin: '2024-01-15 07:15'
    },
    {
      id: 5,
      name: 'Mary Alima',
      email: 'mary.alima@naita.go.ug',
      role: 'Data Entry Staff',
      center: 'NAITA Arua Center',
      phone: '+256 700 567 890',
      status: 'Inactive',
      lastLogin: '2024-01-10 14:30'
    }
  ];

  const columns = [
    {
      key: 'name',
      label: 'User',
      render: (value: string, row: any) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 flex items-center">
              <Mail className="w-3 h-3 mr-1" />
              {row.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      render: (value: string) => (
        <div className="flex items-center">
          <Shield className="w-4 h-4 mr-1 text-gray-400" />
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            value === 'Center Manager' ? 'bg-green-100 text-green-800' :
            value === 'Instructor' ? 'bg-yellow-100 text-yellow-800' :
            value === 'Data Entry Staff' ? 'bg-blue-100 text-blue-800' :
            'bg-purple-100 text-purple-800'
          }`}>
            {value}
          </span>
        </div>
      )
    },
    {
      key: 'center',
      label: 'Center',
      render: (value: string) => (
        <span className="text-sm text-gray-900">{value}</span>
      )
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (value: string) => (
        <span className="text-sm text-gray-600">{value}</span>
      )
    },
    {
      key: 'lastLogin',
      label: 'Last Login',
      render: (value: string) => (
        <span className="text-sm text-gray-600">{value}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      )
    }
  ];

  const filteredData = usersData.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.center.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNavbar userRole="admin" userName="John Doe" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-2">Manage system users and their permissions</p>
            </div>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users, emails, or centers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="center_manager">Center Manager</option>
              <option value="instructor">Instructor</option>
              <option value="data_entry">Data Entry Staff</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <DataTable
          columns={columns}
          data={filteredData}
          currentPage={currentPage}
          totalPages={Math.ceil(filteredData.length / 10)}
          onPageChange={setCurrentPage}
        />

        {/* User Role Distribution */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">5</div>
            <div className="text-sm text-gray-600">Administrators</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-yellow-500">42</div>
            <div className="text-sm text-gray-600">Center Managers</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-sky-400">1,234</div>
            <div className="text-sm text-gray-600">Instructors</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-lime-800">156</div>
            <div className="text-sm text-gray-600">Data Entry Staff</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;