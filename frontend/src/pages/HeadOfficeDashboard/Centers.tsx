// src/pages/HeadOfficeDashboard/Centers.tsx
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
} from "lucide-react";
import toast from "react-hot-toast";
import { fetchCenters, createCenter, type Center } from "../../api/api";

const Centers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [performanceFilter, setPerformanceFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCenter, setNewCenter] = useState({
    name: "",
    location: "",
    manager: "",
    phone: "",
    students: "",
    instructors: "",
    status: "Active",
    performance: "Average",
  });
  const [submitting, setSubmitting] = useState(false);

  const pageSize = 10;

  /* ========== FETCH CENTERS ========== */
  useEffect(() => {
    const load = async () => {
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
      }
    };
    load();
  }, []);

  /* ========== ADD CENTER ========== */
  const handleAddCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCenter.name.trim()) {
      toast.error("Center name is required");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createCenter({
        name: newCenter.name.trim(),
        location: newCenter.location.trim() || null,
        manager: newCenter.manager.trim() || null,
        phone: newCenter.phone.trim() || null,
        students: newCenter.students ? Number(newCenter.students) : null,
        instructors: newCenter.instructors ? Number(newCenter.instructors) : null,
        status: newCenter.status,
        performance: newCenter.performance || null,
      });
      setCenters(prev => [...prev, created]);
      setShowAddModal(false);
      setNewCenter({
        name: "",
        location: "",
        manager: "",
        phone: "",
        students: "",
        instructors: "",
        status: "Active",
        performance: "Average",
      });
      toast.success("Center added successfully");
    } catch (err: any) {
      const msg = err.response?.data?.name?.[0] || "Failed to add center";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ========== FILTERING ========== */
  const filtered = useMemo(() => {
    return centers
      .filter(c => {
        const s = searchTerm.toLowerCase();
        return (
          c.name.toLowerCase().includes(s) ||
          (c.location && c.location.toLowerCase().includes(s)) ||
          (c.manager && c.manager.toLowerCase().includes(s))
        );
      })
      .filter(c => (regionFilter ? c.location?.includes(regionFilter) : true))
      .filter(c => (performanceFilter ? c.performance === performanceFilter : true));
  }, [centers, searchTerm, regionFilter, performanceFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  /* ========== COLUMNS (same as your mock) ========== */
  const columns = [
    {
      key: "name",
      label: "Center Name",
      render: (value: string, row: Center) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500 flex items-center">
            <MapPin className="w-3 h-3 mr-1" />
            {row.location || "—"}
          </div>
        </div>
      ),
    },
    {
      key: "manager",
      label: "Manager",
      render: (value: string | null, row: Center) => (
        <div>
          <div className="font-medium text-gray-900">{value || "—"}</div>
          <div className="text-sm text-gray-500 flex items-center">
            <Phone className="w-3 h-3 mr-1" />
            {row.phone || "—"}
          </div>
        </div>
      ),
    },
    {
      key: "students",
      label: "Students",
      render: (value: number | null) => (
        <div className="flex items-center">
          <Users className="w-4 h-4 mr-1 text-gray-400" />
          <span className="font-medium">{value ?? 0}</span>
        </div>
      ),
    },
    {
      key: "instructors",
      label: "Instructors",
      render: (value: number | null) => (
        <span className="font-medium">{value ?? 0}</span>
      ),
    },
    {
      key: "performance",
      label: "Performance",
      render: (value: string | null) => {
        const badge = {
          Excellent: "bg-green-100 text-green-800",
          Good: "bg-yellow-100 text-yellow-800",
          Average: "bg-blue-100 text-blue-800",
          "Needs Improvement": "bg-red-100 text-red-800",
        }[value || ""] || "bg-gray-100 text-gray-800";
        return (
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badge}`}
          >
            {value || "—"}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            value === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {value}
        </span>
      ),
    },
  ];

  /* ========== SUMMARY STATS ========== */
  const totalCenters = centers.length;
  const totalStudents = centers.reduce((s, c) => s + (c.students ?? 0), 0);
  const totalInstructors = centers.reduce((s, c) => s + (c.instructors ?? 0), 0);
  const avgPerformance =
    centers.filter(c => c.performance).length > 0
      ? Math.round(
          centers.reduce((s, c) => {
            const scores: Record<string, number> = {
              Excellent: 100,
              Good: 80,
              Average: 60,
              "Needs Improvement": 40,
            };
            return s + (scores[c.performance!] || 0);
          }, 0) / centers.filter(c => c.performance).length
        )
      : 0;

  /* ========== RENDER ========== */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          <span className="text-gray-600">Loading centers...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg max-w-md">
          <p className="font-semibold">Error</p>
          <p className="text-sm mt-1">{error}</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Training Centers</h1>
              <p className="text-gray-600 mt-2">
                Manage all NAITA training centers across Uganda
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
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
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <select
              value={regionFilter}
              onChange={e => setRegionFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Regions</option>
              <option value="Central">Central Region</option>
              <option value="Northern">Northern Region</option>
              <option value="Western">Western Region</option>
              <option value="Eastern">Eastern Region</option>
            </select>
            <select
              value={performanceFilter}
              onChange={e => setPerformanceFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Performance</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Average">Average</option>
              <option value="Needs Improvement">Needs Improvement</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={paginated}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{totalCenters}</div>
            <div className="text-sm text-gray-600">Total Centers</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-yellow-500">
              {totalStudents.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-sky-400">
              {totalInstructors.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Instructors</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-2xl font-bold text-lime-800">{avgPerformance}%</div>
            <div className="text-sm text-gray-600">Avg Performance</div>
          </div>
        </div>
      </div>

      {/* ========== ADD CENTER MODAL ========== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative max-h-screen overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Center</h2>

            <form onSubmit={handleAddCenter} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Center Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCenter.name}
                  onChange={e => setNewCenter({ ...newCenter, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="NAITA Colombo Center"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={newCenter.location}
                  onChange={e => setNewCenter({ ...newCenter, location: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Colombo, Havelock Road"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manager
                </label>
                <input
                  type="text"
                  value={newCenter.manager}
                  onChange={e => setNewCenter({ ...newCenter, manager: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="D.P Perera"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={newCenter.phone}
                  onChange={e => setNewCenter({ ...newCenter, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="+9411 700 1234"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Students
                </label>
                <input
                  type="number"
                  value={newCenter.students}
                  onChange={e => setNewCenter({ ...newCenter, students: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="450"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructors
                </label>
                <input
                  type="number"
                  value={newCenter.instructors}
                  onChange={e => setNewCenter({ ...newCenter, instructors: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="25"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={newCenter.status}
                  onChange={e => setNewCenter({ ...newCenter, status: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Performance
                </label>
                <select
                  value={newCenter.performance}
                  onChange={e => setNewCenter({ ...newCenter, performance: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Needs Improvement">Needs Improvement</option>
                </select>
              </div>

              <div className="md:col-span-2 flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm disabled:opacity-70 flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add Center</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Centers;