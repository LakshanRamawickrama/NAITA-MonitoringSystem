import React, { useState } from 'react';
import DataTable from '../../components/DataTable';
import { Search, Plus, MapPin, Users, Phone } from 'lucide-react';

const Centers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const centersData = [
    {
      id: 1,
      name: 'NAITA Kampala Center',
      location: 'Kampala, Central Region',
      manager: 'Sarah Nakato',
      students: 450,
      instructors: 25,
      phone: '+256 700 123 456',
      status: 'Active',
      performance: 'Excellent'
    },
    {
      id: 2,
      name: 'NAITA Gulu Center',
      location: 'Gulu, Northern Region',
      manager: 'James Okello',
      students: 320,
      instructors: 18,
      phone: '+256 700 234 567',
      status: 'Active',
      performance: 'Good'
    },
    {
      id: 3,
      name: 'NAITA Mbarara Center',
      location: 'Mbarara, Western Region',
      manager: 'Grace Tumusiime',
      students: 380,
      instructors: 22,
      phone: '+256 700 345 678',
      status: 'Active',
      performance: 'Excellent'
    },
    {
      id: 4,
      name: 'NAITA Jinja Center',
      location: 'Jinja, Eastern Region',
      manager: 'Robert Wamala',
      students: 290,
      instructors: 16,
      phone: '+256 700 456 789',
      status: 'Active',
      performance: 'Good'
    },
    {
      id: 5,
      name: 'NAITA Arua Center',
      location: 'Arua, West Nile Region',
      manager: 'Mary Alima',
      students: 210,
      instructors: 12,
      phone: '+256 700 567 890',
      status: 'Active',
      performance: 'Average'
    }
  ];

  const columns = [
    {
      key: 'name',
      label: 'Center Name',
      render: (value: string, row: any) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500 flex items-center">
            <MapPin className="w-3 h-3 mr-1" />
            {row.location}
          </div>
        </div>
      )
    },
    {
      key: 'manager',
      label: 'Manager',
      render: (value: string, row: any) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500 flex items-center">
            <Phone className="w-3 h-3 mr-1" />
            {row.phone}
          </div>
        </div>
      )
    },
    {
      key: 'students',
      label: 'Students',
      render: (value: number) => (
        <div className="flex items-center">
          <Users className="w-4 h-4 mr-1 text-gray-400" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'instructors',
      label: 'Instructors',
      render: (value: number) => (
        <span className="font-medium">{value}</span>
      )
    },
    {
      key: 'performance',
      label: 'Performance',
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value === 'Excellent' ? 'bg-green-100 text-green-800' :
          value === 'Good' ? 'bg-yellow-100 text-yellow-800' :
          value === 'Average' ? 'bg-blue-100 text-blue-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
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

  const filteredData = centersData.filter(center =>
    center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.manager.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Training Centers</h1>
              <p className="text-gray-600 mt-2">Manage all NAITA training centers across Uganda</p>
            </div>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Center</span>
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
                placeholder="Search centers, locations, or managers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option value="">All Regions</option>
              <option value="central">Central Region</option>
              <option value="northern">Northern Region</option>
              <option value="western">Western Region</option>
              <option value="eastern">Eastern Region</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option value="">All Performance</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="average">Average</option>
              <option value="needs-improvement">Needs Improvement</option>
            </select>
          </div>
        </div>

        {/* Centers Table */}
        <DataTable
          columns={columns}
          data={filteredData}
          currentPage={currentPage}
          totalPages={Math.ceil(filteredData.length / 10)}
          onPageChange={setCurrentPage}
        />

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">42</div>
            <div className="text-sm text-gray-600">Total Centers</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-yellow-500">15,847</div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-sky-400">1,234</div>
            <div className="text-sm text-gray-600">Total Instructors</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-lime-800">87%</div>
            <div className="text-sm text-gray-600">Avg Performance</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Centers;