import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import { Search, Clock, CheckCircle, XCircle, AlertCircle, Plus, X as CloseIcon, AlertCircle as ErrorIcon } from 'lucide-react';
import { fetchMyApprovals, createApproval } from '../../api/api'; // Adjust path if needed
import type { ApprovalType } from '../../api/api'; // Adjust path if needed

const DistrictManagerApprovals: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [approvalsData, setApprovalsData] = useState<ApprovalType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const data = await fetchMyApprovals();
      setApprovalsData(data);
      setLoading(false);
    } catch (err) {
      setError('Error fetching approvals');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const handleSuccess = () => {
    loadApprovals(); // Refresh the list after successful submission
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

  const ApprovalRequestForm = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void; }) => {
    const [formData, setFormData] = useState({
      type: '',
      center: localStorage.getItem("center_name") || '',
      description: '',
      priority: 'Medium',
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setFormError(null);
      setFormSuccess(false);

      try {
        await createApproval(formData);
        setFormSuccess(true);
        onSuccess();
        setFormData({
          type: '',
          center: localStorage.getItem("center_name") || '',
          description: '',
          priority: 'Medium',
        });
        setTimeout(() => {
          onClose();
        }, 1500); // Close after showing success message
      } catch (err) {
        setFormError('Error submitting request');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 max-w-2xl w-full relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
            <CloseIcon className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Submit Approval Request</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">Request Type</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">Select type</option>
                  <option value="Equipment Request">Equipment Request</option>
                  <option value="Staff Recruitment">Staff Recruitment</option>
                  <option value="Course Addition">Course Addition</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Training Materials">Training Materials</option>
                </select>
              </div>
              <div>
                <label htmlFor="center" className="block text-sm font-medium text-gray-700">Center</label>
                <input
                  type="text"
                  id="center"
                  name="center"
                  value={formData.center}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            {formError && (
              <div className="mt-4 flex items-center text-red-600">
                <ErrorIcon className="w-5 h-5 mr-2" />
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="mt-4 text-green-600">
                Request submitted successfully!
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Approval Requests</h1>
              <p className="text-gray-600 mt-2">View status of your submitted requests</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                {pendingCount} Pending
              </span>
              <button
                onClick={() => setShowModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Request</span>
              </button>
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

        {showModal && (
          <ApprovalRequestForm
            onClose={() => setShowModal(false)}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default DistrictManagerApprovals;