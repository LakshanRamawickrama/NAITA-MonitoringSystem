// src/pages/HeadOfficeDashboard/Centers.tsx - UPDATED VERSION
import React, { useState, useEffect, useMemo } from "react";
import DataTable from "../../components/DataTable";
import {
  Search,
  Plus,
  MapPin,
  Users,
  Phone,
  Loader2,
  X,
  Edit,
  Trash2,
  AlertCircle,
  GraduationCap,
  Building2,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchCenters,
  createCenter,
  updateCenter,
  deleteCenter,
  type Center,
} from "../../api/api";

const Centers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [performanceFilter, setPerformanceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCenter, setEditingCenter] = useState<Center | null>(null);
  const [deletingCenter, setDeletingCenter] = useState<Center | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [form, setForm] = useState({
    name: "",
    location: "",
    district: "",
    manager: "",
    phone: "",
    student_count: "",  // CHANGED
    instructor_count: "",  // CHANGED
    status: "Active",
    performance: "Average",
  });

  const pageSize = 10;

  // Get user info
  const userRole = localStorage.getItem("user_role") || "data_entry";
  const userDistrict = localStorage.getItem("user_district") || "";
  const isAdmin = userRole === "admin";
  const isDistrictManager = userRole === "district_manager";

  // Get unique districts for filter
  const districts = useMemo(() => {
    const districtSet = new Set(centers.map(center => center.district).filter(Boolean));
    return Array.from(districtSet).sort();
  }, [centers]);

  // Get unique performance ratings
  const performanceOptions = ["All Performance", "Excellent", "Good", "Average", "Needs Improvement"];
  const statusOptions = ["All Status", "Active", "Inactive"];

  /* ========== FETCH CENTERS ========== */
  const loadCenters = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchCenters();
      setCenters(data);
    } catch (e: any) {
      const msg = e.response?.data?.detail || "Failed to load centers";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCenters();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCenters();
  };

  /* ========== OPEN EDIT MODAL ========== */
  const openEditModal = (center: Center) => {
    setEditingCenter(center);
    setForm({
      name: center.name || "",
      location: center.location || "",
      district: center.district || "",
      manager: center.manager || "",
      phone: center.phone || "",
      student_count: center.student_count?.toString() || "0",  // CHANGED
      instructor_count: center.instructor_count?.toString() || "0",  // CHANGED
      status: center.status || "Active",
      performance: center.performance || "Average",
    });
    setShowEditModal(true);
  };

  /* ========== OPEN DELETE MODAL ========== */
  const openDeleteModal = (center: Center) => {
    setDeletingCenter(center);
    setShowDeleteModal(true);
  };

  /* ========== ADD CENTER ========== */
  const handleAddCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Center name is required");

    setSubmitting(true);
    try {
      const created = await createCenter({
        name: form.name.trim(),
        location: form.location.trim() || null,
        district: form.district.trim() || null,
        manager: form.manager.trim() || null,
        phone: form.phone.trim() || null,
        student_count: form.student_count ? Number(form.student_count) : 0,  // CHANGED
        instructor_count: form.instructor_count ? Number(form.instructor_count) : 0,  // CHANGED
        status: form.status,
        performance: form.performance || null,
      });
      setCenters(prev => [...prev, created]);
      closeAddModal();
      toast.success("Center added successfully");
    } catch (err: any) {
      const errorMsg = err.response?.data?.name?.[0] || 
                      err.response?.data?.detail || 
                      "Failed to add center";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ========== EDIT CENTER ========== */
  const handleEditCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCenter || !form.name.trim()) return;

    setSubmitting(true);
    try {
      const updated = await updateCenter(editingCenter.id, {
        name: form.name.trim(),
        location: form.location.trim() || null,
        district: form.district.trim() || null,
        manager: form.manager.trim() || null,
        phone: form.phone.trim() || null,
        student_count: form.student_count ? Number(form.student_count) : 0,  // CHANGED
        instructor_count: form.instructor_count ? Number(form.instructor_count) : 0,  // CHANGED
        status: form.status,
        performance: form.performance || null,
      });
      setCenters(prev => prev.map(c => (c.id === updated.id ? updated : c)));
      setShowEditModal(false);
      toast.success("Center updated successfully");
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Failed to update center";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ========== DELETE CENTER ========== */
  const handleDeleteCenter = async () => {
    if (!deletingCenter) return;

    try {
      await deleteCenter(deletingCenter.id);
      setCenters(prev => prev.filter(c => c.id !== deletingCenter.id));
      setShowDeleteModal(false);
      toast.success("Center deleted successfully");
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Failed to delete center";
      toast.error(errorMsg);
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setForm({
      name: "",
      location: "",
      district: "",
      manager: "",
      phone: "",
      student_count: "",  // CHANGED
      instructor_count: "",  // CHANGED
      status: "Active",
      performance: "Average",
    });
  };

  /* ========== FILTERING ========== */
  const filtered = useMemo(() => {
    return centers
      .filter(c => {
        const s = searchTerm.toLowerCase();
        return (
          c.name?.toLowerCase().includes(s) ||
          (c.location && c.location.toLowerCase().includes(s)) ||
          (c.manager && c.manager.toLowerCase().includes(s)) ||
          (c.district && c.district.toLowerCase().includes(s)) ||
          (c.phone && c.phone.toLowerCase().includes(s))
        );
      })
      .filter(c => (districtFilter ? c.district === districtFilter : true))
      .filter(c => (performanceFilter ? c.performance === performanceFilter : true))
      .filter(c => (statusFilter ? c.status === statusFilter : true));
  }, [centers, searchTerm, districtFilter, performanceFilter, statusFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  /* ========== COLUMNS ========== */
  const columns = [
    {
      key: "name",
      label: "Center Name",
      render: (value: string, row: Center) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Building2 className="w-5 h-5 text-green-700" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{value || "Unnamed Center"}</div>
            <div className="text-sm text-gray-500 flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              {row.location || "No location"}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "district",
      label: "District",
      render: (value: string | null) => (
        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
          <span className="font-medium text-gray-700">{value || "—"}</span>
        </div>
      ),
    },
    {
      key: "manager",
      label: "Manager",
      render: (value: string | null | undefined, row: Center) => (
        <div>
          <div className="font-medium text-gray-900">{value || "Not assigned"}</div>
          <div className="text-sm text-gray-500 flex items-center">
            <Phone className="w-3 h-3 mr-1" />
            {row.phone || "No phone"}
          </div>
        </div>
      ),
    },
    {
      key: "student_count",  // CHANGED
      label: "Students",
      render: (value: number | null | undefined) => (
        <div className="flex items-center">
          <Users className="w-4 h-4 mr-2 text-gray-400" />
          <span className="font-medium text-gray-700">{value ?? 0}</span>
        </div>
      ),
    },
    {
      key: "instructor_count",  // CHANGED
      label: "Instructors",
      render: (value: number | null | undefined) => (
        <div className="flex items-center">
          <GraduationCap className="w-4 h-4 mr-2 text-gray-400" />
          <span className="font-medium text-gray-700">{value ?? 0}</span>
        </div>
      ),
    },
    {
      key: "performance",
      label: "Performance",
      render: (value: string | null | undefined) => {
        const badge = {
          Excellent: "bg-green-100 text-green-800 border border-green-200",
          Good: "bg-yellow-100 text-yellow-800 border border-yellow-200",
          Average: "bg-blue-100 text-blue-800 border border-blue-200",
          "Needs Improvement": "bg-red-100 text-red-800 border border-red-200",
        }[value || ""] || "bg-gray-100 text-gray-800 border border-gray-200";
        return (
          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${badge}`}>
            {value || "Not rated"}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (value: string | undefined) => (
        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
          value === "Active" 
            ? "bg-green-100 text-green-800 border border-green-200" 
            : "bg-red-100 text-red-800 border border-red-200"
        }`}>
          {value || "—"}
        </span>
      ),
    },
    ...((isAdmin || isDistrictManager) ? [{
      key: "actions",
      label: "Actions",
      render: (_: any, row: Center) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => openEditModal(row)}
            className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
            title="Edit Center"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => openDeleteModal(row)}
            className="text-red-600 hover:text-red-800 p-1 transition-colors"
            title="Delete Center"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    }] : [])
  ];

  /* ========== SUMMARY STATS ========== */
  const stats = useMemo(() => {
    const totalCenters = centers.length;
    const totalStudents = centers.reduce((s, c) => s + (c.student_count ?? 0), 0);  // CHANGED
    const totalInstructors = centers.reduce((s, c) => s + (c.instructor_count ?? 0), 0);  // CHANGED
    const activeCenters = centers.filter(c => c.status === "Active").length;
    
    // Calculate average performance score
    const performanceScores = centers
      .filter(c => c.performance)
      .map(c => {
        const scores: Record<string, number> = {
          Excellent: 100,
          Good: 80,
          Average: 60,
          "Needs Improvement": 40,
        };
        return scores[c.performance!] || 0;
      });
    
    const avgPerformance = performanceScores.length > 0
      ? Math.round(performanceScores.reduce((a, b) => a + b, 0) / performanceScores.length)
      : 0;

    return {
      totalCenters,
      totalStudents,
      totalInstructors,
      activeCenters,
      avgPerformance,
    };
  }, [centers]);

  /* ========== RENDER ========== */
  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <div className="text-gray-600">Loading training centers...</div>
        </div>
      </div>
    );
  }

  if (error && centers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Centers</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadCenters}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Training Centers</h1>
              <p className="text-gray-600 mt-2">
                Manage all NAITA training centers across Sri Lanka
              </p>
              {isDistrictManager && userDistrict && (
                <p className="text-sm text-green-600 mt-1 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  Managing centers in: <strong className="ml-1">{userDistrict}</strong> district
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 w-full sm:w-auto"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              {(isAdmin || isDistrictManager) && (
                <button
                  onClick={() => {
                    setShowAddModal(true);
                    // Auto-fill district for district managers
                    if (isDistrictManager && userDistrict) {
                      setForm(prev => ({ ...prev, district: userDistrict }));
                    }
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Center</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search centers..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={districtFilter}
              onChange={e => setDistrictFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Districts</option>
              {districts.map(district => (
                <option key={district} value={district || ""}>{district}</option>
              ))}
            </select>

            <select
              value={performanceFilter}
              onChange={e => setPerformanceFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {performanceOptions.map(option => (
                <option key={option} value={option === "All Performance" ? "" : option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {statusOptions.map(option => (
                <option key={option} value={option === "All Status" ? "" : option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {filtered.length} of {centers.length} centers
            {searchTerm && ` for "${searchTerm}"`}
          </div>
          {filtered.length === 0 && centers.length > 0 && (
            <div className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              No centers match your filters
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filtered.length > 0 ? (
            <DataTable
              columns={columns}
              data={paginated}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          ) : (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {centers.length === 0 
                  ? "No training centers found" 
                  : "No centers match your search"
                }
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {centers.length === 0 
                  ? "Get started by adding your first training center."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              {centers.length === 0 && (isAdmin || isDistrictManager) && (
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setShowAddModal(true);
                      if (isDistrictManager && userDistrict) {
                        setForm(prev => ({ ...prev, district: userDistrict }));
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Center
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalCenters}</div>
                <div className="text-sm text-gray-600">Total Centers</div>
              </div>
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.activeCenters}</div>
                <div className="text-sm text-gray-600">Active Centers</div>
              </div>
              <Building2 className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-sky-500">{stats.totalStudents.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
              <Users className="w-8 h-8 text-sky-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-lime-700">{stats.avgPerformance}%</div>
                <div className="text-sm text-gray-600">Avg Performance</div>
              </div>
              <GraduationCap className="w-8 h-8 text-lime-500" />
            </div>
          </div>
        </div>
      </div>

      {/* ========== ADD / EDIT MODAL (SHARED) ========== */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative max-h-screen overflow-y-auto">
            <button
              onClick={() => {
                showAddModal ? closeAddModal() : setShowEditModal(false);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {showAddModal ? "Add New Training Center" : "Edit Training Center"}
            </h2>
            <p className="text-gray-600 mb-6">
              {showAddModal 
                ? "Register a new NAITA training center in the system" 
                : `Update details for ${editingCenter?.name}`
              }
            </p>

            <form
              onSubmit={showAddModal ? handleAddCenter : handleEditCenter}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Center Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="NAITA Colombo Center"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Address
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="123 Main Street, Colombo 05"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  District {isDistrictManager && <span className="text-green-600 text-xs">(Auto-filled)</span>}
                </label>
                <input
                  type="text"
                  value={form.district}
                  onChange={e => setForm({ ...form, district: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50"
                  placeholder="Colombo District"
                  disabled={isDistrictManager}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Center Manager
                </label>
                <input
                  type="text"
                  value={form.manager}
                  onChange={e => setForm({ ...form, manager: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="S.K Nalaka"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="+9411 700 1235"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Students
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.student_count}  // CHANGED
                  onChange={e => setForm({ ...form, student_count: e.target.value })}  // CHANGED
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="450"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Instructors
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.instructor_count}  // CHANGED
                  onChange={e => setForm({ ...form, instructor_count: e.target.value })}  // CHANGED
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="25"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Center Status
                </label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Performance Rating
                </label>
                <select
                  value={form.performance}
                  onChange={e => setForm({ ...form, performance: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Needs Improvement">Needs Improvement</option>
                </select>
              </div>

              <div className="md:col-span-2 flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    showAddModal ? closeAddModal() : setShowEditModal(false);
                  }}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm disabled:opacity-70 flex items-center space-x-2 transition-colors"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{showAddModal ? "Add Center" : "Save Changes"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== DELETE CONFIRMATION MODAL ========== */}
      {showDeleteModal && deletingCenter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center space-x-3 text-red-600 mb-4">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Delete Center?</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong className="text-gray-900">{deletingCenter.name}</strong>? This action cannot be undone.
            </p>
            {deletingCenter.student_count && deletingCenter.student_count > 0 && (  // CHANGED
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <p className="text-orange-800 text-sm">
                  ⚠️ This center has {deletingCenter.student_count} enrolled students. Deleting it may affect student records.  // CHANGED
                </p>
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCenter}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm transition-colors"
              >
                Delete Center
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Centers;