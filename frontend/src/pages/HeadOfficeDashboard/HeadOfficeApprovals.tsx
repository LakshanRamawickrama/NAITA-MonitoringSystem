// Approvals.tsx (fixed import for ApprovalType and unused 'value' parameter)
import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import { Search, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { fetchGeneralApprovals, updateApprovalStatus } from '../../api/api'; // Adjust path if needed
import type { ApprovalType } from '../../api/api'; // Adjust path if needed

const Approvals: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [approvalsData, setApprovalsData] = useState<ApprovalType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadApprovals = async () => {
      try {
        setLoading(true);
        const data = await fetchGeneralApprovals();
        setApprovalsData(data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching approvals');
        setLoading(false);
      }
    };
    loadApprovals();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await updateApprovalStatus(id, 'approve');
      const data = await fetchGeneralApprovals();
      setApprovalsData(data);
    } catch (err) {
      console.error('Error approving:', err);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await updateApprovalStatus(id, 'reject');
      const data = await fetchGeneralApprovals();
      setApprovalsData(data);
    } catch (err) {
      console.error('Error rejecting:', err);
    }
  };

  const columns = [
    {
      key: 'type',
      label: 'Request Type',
      render: (value: string, row: any) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.center}</div>
        </div>
      )
    },
    {
      key: 'description',
      label: 'Description',
      render: (value: string, row: any) => (
        <div>
          <div className="text-sm text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">Requested by: {row.requested_by.first_name} {row.requested_by.last_name}</div>
        </div>
      )
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value === 'High' ? 'bg-red-100 text-red-800' :
          value === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'date_requested',
      label: 'Date Requested',
      render: (value: string) => (
        <span className="text-sm text-gray-600">{value}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <div className="flex items-center">
          {value === 'Pending' && <Clock className="w-4 h-4 mr-1 text-yellow-500" />}
          {value === 'Approved' && <CheckCircle className="w-4 h-4 mr-1 text-green-500" />}
          {value === 'Rejected' && <XCircle className="w-4 h-4 mr-1 text-red-500" />}
          {value === 'Under Review' && <AlertCircle className="w-4 h-4 mr-1 text-blue-500" />}
          <span className={`text-xs font-semibold ${
            value === 'Pending' ? 'text-yellow-800' :
            value === 'Approved' ? 'text-green-800' :
            value === 'Rejected' ? 'text-red-800' :
            'text-blue-800'
          }`}>
            {value}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_value: any, row: any) => (
        <div className="flex space-x-2">
          {row.status === 'Pending' && (
            <>
              <button
                onClick={() => handleApprove(row.id)}
                className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => handleReject(row.id)}
                className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
            </>
          )}
          {row.status !== 'Pending' && (
            <button className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-xs cursor-not-allowed">
              {row.status}
            </button>
          )}
        </div>
      )
    }
  ];

  const filteredData = approvalsData.filter(approval =>
    approval.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    approval.center.toLowerCase().includes(searchTerm.toLowerCase()) ||
    approval.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (approval.requested_by.first_name + ' ' + approval.requested_by.last_name).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = approvalsData.filter(a => a.status === 'Pending').length;
  const approvedCount = approvalsData.filter(a => a.status === 'Approved').length;
  const rejectedCount = approvalsData.filter(a => a.status === 'Rejected').length;
  const underReviewCount = approvalsData.filter(a => a.status === 'Under Review').length;

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Approvals</h1>
              <p className="text-gray-600 mt-2">Review and approve requests from training centers</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                {pendingCount} Pending
              </span>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{pendingCount}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{approvedCount}</div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{underReviewCount}</div>
                <div className="text-sm text-gray-600">Under Review</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{rejectedCount}</div>
                <div className="text-sm text-gray-600">Rejected</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search requests, centers, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option value="">All Types</option>
              <option value="equipment">Equipment Request</option>
              <option value="staff">Staff Recruitment</option>
              <option value="course">Course Addition</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="materials">Training Materials</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="under_review">Under Review</option>
            </select>
          </div>
        </div>

        {/* Approvals Table */}
        <DataTable
          columns={columns}
          data={filteredData}
          currentPage={currentPage}
          totalPages={Math.ceil(filteredData.length / 10)}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default Approvals;