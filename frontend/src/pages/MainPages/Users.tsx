// src/pages/HeadOfficeDashboard/Users.tsx
import React, { useState, useEffect, useMemo } from "react";
import DataTable from "../../components/DataTable";
import {
  Search, Plus, Mail, Shield, X, Loader2,
  Edit, Trash2, Key, AlertCircle, MapPin, User, Filter
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchUsers, createUser, fetchCenters,
  updateUser, deleteUser, changePassword
} from "../../api/api";

interface Center {
  id: number;
  name: string;
  district: string | null;
}

interface UserType {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  center: { id: number; name: string; district: string | null } | null;
  district: string | null;
  epf_no: string | null;
  phone_number: string | null;
  is_active: boolean;
  is_staff: boolean;
  last_login: string | null;
}

const Users: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState<UserType[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

  // Delete loading
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Forms
  const initialForm = {
    username: "", email: "", password: "", first_name: "", last_name: "",
    role: "", center_id: "", district: "", epf_no: "", phone_number: "", is_active: true, is_staff: false
  };
  const [addForm, setAddForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);
  const [pwdForm, setPwdForm] = useState({ new_password: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const pageSize = 10;

  // Get user info from localStorage
  const userRole = localStorage.getItem("user_role") || "data_entry";
  const userDistrict = localStorage.getItem("user_district") || "";
  const isAdmin = userRole === "admin";
  const isDistrictManager = userRole === "district_manager";
  const isTrainingOfficer = userRole === "training_officer";

  // Get role options based on user role
  const getRoleOptions = () => {
    if (isAdmin) {
      return [
        { value: "admin", label: "Admin" },
        { value: "district_manager", label: "District Manager" },
        { value: "training_officer", label: "Training Officer" },
        { value: "data_entry", label: "Data Entry" },
        { value: "instructor", label: "Instructor" },
      ];
    } else if (isDistrictManager) {
      return [
        { value: "training_officer", label: "Training Officer" },
        { value: "data_entry", label: "Data Entry" },
        { value: "instructor", label: "Instructor" },
      ];
    } else if (isTrainingOfficer) {
      // Training officers can only add instructors
      return [
        { value: "instructor", label: "Instructor" },
      ];
    }
    return [];
  };

  const roleOptions = getRoleOptions();

  // Get unique districts for filter - only show districts that the user can access
  const districts = useMemo(() => {
    if (isAdmin) {
      // Admin can see all districts
      const districtSet = new Set(users.map(user => user.district).filter(Boolean));
      return Array.from(districtSet).sort();
    } else if (isDistrictManager || isTrainingOfficer) {
      // District managers and training officers can only see their own district
      if (userDistrict) {
        return [userDistrict];
      }
      return [];
    }
    return [];
  }, [users, userDistrict, isAdmin, isDistrictManager, isTrainingOfficer]);

  /* ========== FETCH DATA ========== */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [u, c] = await Promise.all([fetchUsers(), fetchCenters()]);

        // Filter users based on role permissions
        let filteredUsers = u;

        if (isTrainingOfficer) {
          // Training officers can only see instructors in their district
          filteredUsers = u.filter(user =>
            user.role === 'instructor' &&
            user.district === userDistrict
          );
        } else if (isDistrictManager) {
          // District managers can see all non-admin users in their district
          filteredUsers = u.filter(user =>
            user.district === userDistrict &&
            user.role !== 'admin'
          );
        }

        // Filter out any users without IDs for safety
        const validUsers = filteredUsers.filter(user => user.id != null);

        setUsers(validUsers);
        setCenters(c);
      } catch (e: any) {
        const msg = e.response?.data?.detail || "Failed to load data";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isTrainingOfficer, isDistrictManager, userDistrict]);

  /* ========== HELPERS ========== */
  const resetForm = () => {
    setAddForm(initialForm);
    setEditForm(initialForm);
    setPwdForm({ new_password: "" });
    setFormErrors({});
  };

  const openEdit = (u: UserType) => {
    if (!u.id) {
      toast.error("Cannot edit user: ID is missing");
      return;
    }

    // Check if training officer is trying to edit non-instructor
    if (isTrainingOfficer && u.role !== 'instructor') {
      toast.error("Training officers can only edit instructors");
      return;
    }

    // Check if district manager/training officer is trying to edit user from different district
    if ((isDistrictManager || isTrainingOfficer) && u.district !== userDistrict) {
      toast.error("You can only edit users in your district");
      return;
    }

    setSelectedUser(u);
    setEditForm({
      username: u.username,
      email: u.email,
      password: "",
      first_name: u.first_name,
      last_name: u.last_name,
      role: u.role,
      center_id: u.center?.id?.toString() || "",
      district: u.district || "",
      epf_no: u.epf_no || "",
      phone_number: u.phone_number || "",
      is_active: u.is_active,
      is_staff: u.is_staff
    });
    setShowEdit(true);
  };

  const openPwd = (u: UserType) => {
    if (!u.id) {
      toast.error("Cannot change password: User ID is missing");
      return;
    }

    // Check permissions
    if (isTrainingOfficer && u.role !== 'instructor') {
      toast.error("Training officers can only change passwords for instructors");
      return;
    }

    if ((isDistrictManager || isTrainingOfficer) && u.district !== userDistrict) {
      toast.error("You can only change passwords for users in your district");
      return;
    }

    setSelectedUser(u);
    setPwdForm({ new_password: "" });
    setShowPwd(true);
  };

  const openDelete = (u: UserType) => {
    if (!u.id) {
      toast.error("Cannot delete user: ID is missing");
      return;
    }

    // Check permissions
    if (isTrainingOfficer && u.role !== 'instructor') {
      toast.error("Training officers can only delete instructors");
      return;
    }

    if ((isDistrictManager || isTrainingOfficer) && u.district !== userDistrict) {
      toast.error("You can only delete users in your district");
      return;
    }

    setSelectedUser(u);
    setShowDelete(true);
  };

  /* ========== EFFECT FOR EPF FIELD ========== */
  useEffect(() => {
    // When role changes in add form
    if (addForm.role === 'instructor') {
      setAddForm(prev => ({ ...prev, epf_no: "" }));
    } else if (addForm.role && addForm.role !== 'instructor' && !addForm.epf_no) {
      setAddForm(prev => ({ ...prev, epf_no: "" }));
    }
  }, [addForm.role]);

  useEffect(() => {
    // When role changes in edit form
    if (editForm.role === 'instructor') {
      setEditForm(prev => ({ ...prev, epf_no: "" }));
    } else if (editForm.role && editForm.role !== 'instructor' && !editForm.epf_no) {
      setEditForm(prev => ({ ...prev, epf_no: "" }));
    }
  }, [editForm.role]);

  /* ========== CRUD ========== */
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Check permissions based on role
    if (isTrainingOfficer && addForm.role !== 'instructor') {
      toast.error("Training officers can only add instructors");
      return;
    }

    if (isDistrictManager && addForm.role === 'district_manager') {
      setFormErrors({ role: "District managers cannot create other district managers." });
      toast.error("District managers cannot create other district managers.");
      return;
    }

    try {
      const payload: any = {
        username: addForm.username.trim(),
        email: addForm.email.trim(),
        password: addForm.password,
        first_name: addForm.first_name.trim(),
        last_name: addForm.last_name.trim(),
        role: addForm.role,
        district: addForm.district.trim(),
        phone_number: addForm.phone_number.trim(),
        is_active: addForm.is_active,
        is_staff: addForm.is_staff
      };

      // Add EPF only for non-instructor roles, auto-uppercase
      if (addForm.role !== 'instructor') {
        payload.epf_no = addForm.epf_no.trim().toUpperCase();
      } else {
        // Clear EPF for instructors
        payload.epf_no = "";
      }

      if (addForm.center_id) payload.center_id = Number(addForm.center_id);

      const nu = await createUser(payload);
      setUsers(p => [...p, nu]);
      setShowAdd(false);
      resetForm();
      toast.success("User created successfully");
    } catch (err: any) {
      handleApiError(err);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    if (!selectedUser || !selectedUser.id) {
      toast.error("Cannot update: User ID is missing");
      return;
    }

    // Check permissions
    if (isTrainingOfficer && editForm.role !== 'instructor') {
      toast.error("Training officers can only edit instructors");
      return;
    }

    try {
      const payload: any = {
        username: editForm.username.trim(),
        email: editForm.email.trim(),
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        role: editForm.role,
        district: editForm.district.trim(),
        phone_number: editForm.phone_number.trim(),
        is_active: editForm.is_active,
        is_staff: editForm.is_staff
      };

      // Add EPF only for non-instructor roles, auto-uppercase
      if (editForm.role !== 'instructor') {
        payload.epf_no = editForm.epf_no.trim().toUpperCase();
      } else {
        // Clear EPF for instructors
        payload.epf_no = "";
      }

      if (editForm.center_id) payload.center_id = Number(editForm.center_id);

      const upd = await updateUser(selectedUser.id, payload);
      setUsers(p => p.map(u => u.id === selectedUser.id ? upd : u));
      setShowEdit(false);
      resetForm();
      toast.success("User updated");
    } catch (err: any) {
      handleApiError(err);
    }
  };

  const handlePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    if (!selectedUser || !selectedUser.id) {
      toast.error("Cannot change password: User ID is missing");
      return;
    }
    try {
      await changePassword(selectedUser.id, pwdForm.new_password);
      setShowPwd(false);
      resetForm();
      toast.success("Password changed");
    } catch (err: any) {
      handleApiError(err);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser || !selectedUser.id) {
      toast.error("Cannot delete: User ID is missing");
      setShowDelete(false);
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteUser(selectedUser.id);

      // Update local state
      setUsers(prevUsers => prevUsers.filter(u => u.id !== selectedUser.id));
      setShowDelete(false);
      setSelectedUser(null);

      toast.success(`${selectedUser.username} deleted successfully`);
    } catch (err: any) {
      let errorMessage = "Delete failed";
      if (err.response) {
        if (err.response.status === 403) {
          errorMessage = "Permission denied. You don't have access to delete this user.";
        } else if (err.response.status === 404) {
          errorMessage = "User not found.";
        } else if (err.response.data?.detail) {
          errorMessage = err.response.data.detail;
        }
      }

      toast.error(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleApiError = (err: any) => {
    const data = err.response?.data;
    const errors: Record<string, string> = {};
    if (data) {
      Object.keys(data).forEach(k => errors[k] = Array.isArray(data[k]) ? data[k][0] : data[k]);
    } else errors.general = "Operation failed";
    setFormErrors(errors);
    toast.error(errors.general || "Validation error");
  };

  /* ========== FILTER & PAGINATION ========== */
  const filtered = useMemo(() => users
    .filter(u => {
      const s = searchTerm.toLowerCase();
      const name = `${u.first_name} ${u.last_name}`.toLowerCase();
      const center = u.center?.name.toLowerCase() || "";
      const district = u.district?.toLowerCase() || "";
      const epf = u.epf_no?.toLowerCase() || "";
      return u.username.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        name.includes(s) ||
        center.includes(s) ||
        district.includes(s) ||
        epf.includes(s);
    })
    .filter(u => roleFilter ? u.role === roleFilter : true)
    .filter(u => statusFilter ? (u.is_active ? "Active" : "Inactive") === statusFilter : true)
    .filter(u => districtFilter ? u.district === districtFilter : true),
    [users, searchTerm, roleFilter, statusFilter, districtFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  /* ========== COLUMNS ========== */
  const columns = [
    {
      key: "username",
      label: "User",
      render: (_: string, row: UserType) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {row.first_name[0]}{row.last_name[0]}
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.username}</div>
            <div className="text-sm text-gray-500 flex items-center">
              <Mail className="w-3 h-3 mr-1" />
              {row.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: "phone_number",
      label: "Phone",
      render: (phone: string | null) => (
        <span className="text-sm text-gray-600 font-medium">
          {phone || "—"}
        </span>
      )
    },
    {
      key: "role",
      label: "Role",
      render: (v: string) => {
        const map: Record<string, string> = {
          admin: "bg-purple-100 text-purple-800",
          district_manager: "bg-green-100 text-green-800",
          training_officer: "bg-yellow-100 text-yellow-800",
          data_entry: "bg-blue-100 text-blue-800",
          instructor: "bg-orange-100 text-orange-800",
        };
        const label = v.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
        return (
          <div className="flex items-center">
            <Shield className="w-4 h-4 mr-1 text-gray-400" />
            <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${map[v] || "bg-gray-100 text-gray-800"}`}>
              {label}
            </span>
          </div>
        );
      }
    },
    {
      key: "epf_no",
      label: "EPF No",
      render: (epf: string | null, row: UserType) => (
        <div className="flex items-center">
          <User className="w-4 h-4 mr-1 text-gray-400" />
          <div>
            <span className="text-sm font-medium block">{epf || "—"}</span>
            {row.role === 'instructor' && (
              <span className="text-xs text-gray-400 italic">Not required</span>
            )}
          </div>
        </div>
      )
    },
    {
      key: "district",
      label: "District",
      render: (d: string | null) => (
        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-1 text-gray-400" />
          <span className="text-sm font-medium">{d || "—"}</span>
        </div>
      )
    },
    {
      key: "center",
      label: "Center",
      render: (c: any) => <span className="text-sm font-medium">{c?.name || "—"}</span>
    },
    {
      key: "is_active",
      label: "Status",
      render: (a: boolean) => (
        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${a ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {a ? "Active" : "Inactive"}
        </span>
      )
    },
    ...((isAdmin || isDistrictManager || isTrainingOfficer) ? [{
      key: "actions",
      label: "Actions",
      render: (_: any, row: UserType) => {
        // Check if user can perform actions on this row
        const canEdit = isAdmin ||
          (isDistrictManager && row.district === userDistrict && row.role !== 'admin') ||
          (isTrainingOfficer && row.role === 'instructor' && row.district === userDistrict);

        const canDelete = canEdit; // Same permission for delete

        if (!canEdit && !canDelete) {
          return <span className="text-sm text-gray-400">No actions</span>;
        }

        return (
          <div className="flex space-x-2">
            {canEdit && (
              <button
                onClick={() => openEdit(row)}
                className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {canEdit && (
              <button
                onClick={() => openPwd(row)}
                className="text-orange-600 hover:text-orange-800 p-1 hover:bg-orange-50 rounded"
                title="Change Password"
              >
                <Key className="w-4 h-4" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => openDelete(row)}
                className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      }
    }] : [])
  ];

  /* ========== RENDER ========== */
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex items-center space-x-3">
        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        <span className="text-gray-600">Loading users...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg max-w-md">
        <p className="font-semibold">Error</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage system users and permissions</p>

            {/* Role-specific messages */}
            {isDistrictManager && userDistrict && (
              <p className="text-sm text-green-600 mt-1 flex items-center">
                <Shield className="w-3 h-3 mr-1" />
                Managing all non-admin users in: <strong className="ml-1">{userDistrict}</strong> district
              </p>
            )}

            {isTrainingOfficer && userDistrict && (
              <p className="text-sm text-yellow-600 mt-1 flex items-center">
                <Filter className="w-3 h-3 mr-1" />
                Managing instructors only in: <strong className="ml-1">{userDistrict}</strong> district
              </p>
            )}

            {isAdmin && (
              <p className="text-sm text-purple-600 mt-1 flex items-center">
                <Shield className="w-3 h-3 mr-1" />
                Admin view: Managing all users across all districts
              </p>
            )}
          </div>

          {/* Add User Button with permissions */}
          {(isAdmin || isDistrictManager || isTrainingOfficer) && (
            <button
              onClick={() => {
                resetForm();

                // Auto-fill based on role
                if (isDistrictManager && userDistrict) {
                  setAddForm(prev => ({
                    ...prev,
                    district: userDistrict,
                    role: roleOptions[0]?.value || ""
                  }));
                } else if (isTrainingOfficer && userDistrict) {
                  // Training officers can only add instructors
                  setAddForm(prev => ({
                    ...prev,
                    district: userDistrict,
                    role: "instructor" // Force instructor role
                  }));
                }

                setShowAdd(true);
              }}
              className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 flex items-center space-x-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>
                {isTrainingOfficer ? "Add Instructor" : "Add User"}
              </span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            />
          </div>

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          >
            <option value="">All Roles</option>
            {/* Show only roles that the user can see */}
            {isAdmin && (
              <>
                <option value="admin">Admin</option>
                <option value="district_manager">District Manager</option>
                <option value="training_officer">Training Officer</option>
                <option value="data_entry">Data Entry</option>
              </>
            )}
            {(isDistrictManager || isTrainingOfficer) && (
              <>
                {isDistrictManager && <option value="training_officer">Training Officer</option>}
                <option value="data_entry">Data Entry</option>
              </>
            )}
            <option value="instructor">Instructor</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select
            value={districtFilter}
            onChange={e => setDistrictFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            disabled={!isAdmin && (isDistrictManager || isTrainingOfficer)} // Disabled for non-admins
          >
            <option value="">All Districts</option>
            {districts.map(district => (
              <option key={district} value={district || ""}>{district}</option>
            ))}
          </select>
        </div>

        {/* Info box about permissions */}
        {isTrainingOfficer && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              <p className="text-sm font-medium">Training Officer View</p>
            </div>
            <p className="text-sm mt-1">
              You can only view and manage instructors in your district ({userDistrict}).
              You cannot see or manage other user roles.
            </p>
          </div>
        )}

        <DataTable
          columns={columns}
          data={paginated}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* ========== MODALS ========== */}
      {showAdd && (
        <Modal title={isTrainingOfficer ? "Add New Instructor" : "Add New User"} onClose={() => { setShowAdd(false); resetForm(); }}>
          <form onSubmit={handleAdd} className="space-y-5">
            {formErrors.general && <Alert text={formErrors.general} />}
            <Input label="Username *" value={addForm.username} onChange={v => setAddForm({ ...addForm, username: v })} error={formErrors.username} required />
            <Input label="Email *" type="email" value={addForm.email} onChange={v => setAddForm({ ...addForm, email: v })} error={formErrors.email} required />
            <Input label="Password *" type="password" value={addForm.password} onChange={v => setAddForm({ ...addForm, password: v })} error={formErrors.password} required minLength={8} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" value={addForm.first_name} onChange={v => setAddForm({ ...addForm, first_name: v })} />
              <Input label="Last Name" value={addForm.last_name} onChange={v => setAddForm({ ...addForm, last_name: v })} />
            </div>

            {/* Role selection - limited for training officers */}
            <Select
              label="Role *"
              options={roleOptions}
              value={addForm.role}
              onChange={v => setAddForm({ ...addForm, role: v })}
              error={formErrors.role}
              required
              disabled={isTrainingOfficer} // Training officers can only add instructors
            />

            {/* EPF Number Field - Always show but conditionally required */}
            <div className={addForm.role === 'instructor' ? 'opacity-50' : ''}>
              <Input
                label={addForm.role === 'instructor' ? "EPF Number (Not required for instructors)" : "EPF Number *"}
                value={addForm.epf_no}
                onChange={v => {
                  // Auto-uppercase EPF numbers for consistency
                  setAddForm({ ...addForm, epf_no: v.toUpperCase() })
                }}
                error={formErrors.epf_no}
                required={addForm.role !== 'instructor'}
                disabled={addForm.role === 'instructor'}
                placeholder="e.g., GAL/89/78, 12345, AB-1234/X"
              />
              <p className="text-xs text-gray-500 mt-1">
                {addForm.role === 'instructor'
                  ? "Instructors do not require EPF numbers"
                  : "Enter EPF number in any format (letters, numbers, special characters allowed)"}
              </p>
            </div>

            <Input label="Phone Number" value={addForm.phone_number} onChange={v => setAddForm({ ...addForm, phone_number: v })} />

            {/* District field - auto-filled for non-admins */}
            {isAdmin && (
              <Input label="District" value={addForm.district} onChange={v => setAddForm({ ...addForm, district: v })} error={formErrors.district} />
            )}
            {(isDistrictManager || isTrainingOfficer) && (
              <Input
                label="District"
                value={addForm.district}
                onChange={v => setAddForm({ ...addForm, district: v })}
                error={formErrors.district}
                disabled
              />
            )}

            <Select label="Center (Optional)" options={[{ value: "", label: "No Center" }, ...centers.map(c => ({ value: c.id.toString(), label: c.name }))]} value={addForm.center_id} onChange={v => setAddForm({ ...addForm, center_id: v })} />
            <Checkboxes active={addForm.is_active} staff={addForm.is_staff} onActive={v => setAddForm({ ...addForm, is_active: v })} onStaff={v => setAddForm({ ...addForm, is_staff: v })} />
            <ModalFooter onCancel={() => { setShowAdd(false); resetForm(); }} submitText={isTrainingOfficer ? "Create Instructor" : "Create User"} />
          </form>
        </Modal>
      )}

      {showEdit && selectedUser && (
        <Modal title="Edit User" onClose={() => { setShowEdit(false); resetForm(); }}>
          <form onSubmit={handleEdit} className="space-y-5">
            {formErrors.general && <Alert text={formErrors.general} />}
            <Input label="Username *" value={editForm.username} onChange={v => setEditForm({ ...editForm, username: v })} error={formErrors.username} required />
            <Input label="Email *" type="email" value={editForm.email} onChange={v => setEditForm({ ...editForm, email: v })} error={formErrors.email} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" value={editForm.first_name} onChange={v => setEditForm({ ...editForm, first_name: v })} />
              <Input label="Last Name" value={editForm.last_name} onChange={v => setEditForm({ ...editForm, last_name: v })} />
            </div>

            {/* Role selection - limited for training officers */}
            <Select
              label="Role *"
              options={roleOptions}
              value={editForm.role}
              onChange={v => setEditForm({ ...editForm, role: v })}
              error={formErrors.role}
              required
              disabled={isTrainingOfficer} // Training officers can only edit instructors
            />

            {/* EPF Number Field - Always show but conditionally required */}
            <div className={editForm.role === 'instructor' ? 'opacity-50' : ''}>
              <Input
                label={editForm.role === 'instructor' ? "EPF Number (Not required for instructors)" : "EPF Number *"}
                value={editForm.epf_no}
                onChange={v => {
                  // Auto-uppercase EPF numbers for consistency
                  setEditForm({ ...editForm, epf_no: v.toUpperCase() })
                }}
                error={formErrors.epf_no}
                required={editForm.role !== 'instructor'}
                disabled={editForm.role === 'instructor'}
                placeholder="e.g., GAL/89/78, 12345, AB-1234/X"
              />
              <p className="text-xs text-gray-500 mt-1">
                {editForm.role === 'instructor'
                  ? "Instructors do not require EPF numbers"
                  : "Enter EPF number in any format (letters, numbers, special characters allowed)"}
              </p>
            </div>

            <Input label="Phone Number" value={editForm.phone_number} onChange={v => setEditForm({ ...editForm, phone_number: v })} />

            {/* District field - auto-filled for non-admins */}
            {isAdmin && (
              <Input label="District" value={editForm.district} onChange={v => setEditForm({ ...editForm, district: v })} error={formErrors.district} />
            )}
            {(isDistrictManager || isTrainingOfficer) && (
              <Input
                label="District"
                value={editForm.district}
                onChange={v => setEditForm({ ...editForm, district: v })}
                error={formErrors.district}
                disabled
              />
            )}

            <Select label="Center (Optional)" options={[{ value: "", label: "No Center" }, ...centers.map(c => ({ value: c.id.toString(), label: c.name }))]} value={editForm.center_id} onChange={v => setEditForm({ ...editForm, center_id: v })} />
            <Checkboxes active={editForm.is_active} staff={editForm.is_staff} onActive={v => setEditForm({ ...editForm, is_active: v })} onStaff={v => setEditForm({ ...editForm, is_staff: v })} />
            <ModalFooter onCancel={() => { setShowEdit(false); resetForm(); }} submitText="Save Changes" />
          </form>
        </Modal>
      )}

      {showPwd && selectedUser && (
        <Modal title="Change Password" onClose={() => { setShowPwd(false); resetForm(); }}>
          <form onSubmit={handlePwd} className="space-y-5">
            <Input label="New Password *" type="password" value={pwdForm.new_password} onChange={v => setPwdForm({ new_password: v })} error={formErrors.new_password} required minLength={8} />
            <ModalFooter onCancel={() => { setShowPwd(false); resetForm(); }} submitText="Change Password" />
          </form>
        </Modal>
      )}

      {showDelete && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="fixed inset-0" onClick={() => setShowDelete(false)}></div>
          <div className="relative bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center space-x-2 text-red-600 mb-4">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-semibold text-lg">Delete User?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Are you sure you want to delete <strong>{selectedUser.username}</strong>?
            </p>
            <p className="text-xs text-gray-500 mb-6">This action <strong>cannot be undone</strong>.</p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDelete(false)}
                disabled={deleteLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center space-x-2 disabled:opacity-70 font-medium"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ========== REUSABLE COMPONENTS ========== */
type ModalProps = { title: string; onClose: () => void; children: React.ReactNode };
const Modal = ({ title, onClose, children }: ModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
    <div className="fixed inset-0" onClick={onClose}></div>
    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-screen overflow-y-auto">
      <div className="sticky top-0 bg-white flex justify-between items-center p-6 border-b z-10">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  </div>
);

type InputProps = {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  minLength?: number;
  disabled?: boolean;
  placeholder?: string;
};
const Input = ({ label, type = "text", value, onChange, error, required, minLength, disabled, placeholder }: InputProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      required={required}
      minLength={minLength}
      disabled={disabled}
      placeholder={placeholder}
      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${error ? "border-red-500" : "border-gray-300"} ${disabled ? "bg-gray-100 cursor-not-allowed opacity-70" : ""}`}
    />
    {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
  </div>
);

// UPDATED SELECT COMPONENT WITH DISABLED PROP
type SelectProps = {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean; // Added disabled prop
};
const Select = ({ label, options, value, onChange, error, required, disabled }: SelectProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      required={required}
      disabled={disabled}
      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${error ? "border-red-500" : "border-gray-300"} ${options.length === 1 ? "bg-gray-50" : ""} ${disabled ? "bg-gray-100 cursor-not-allowed opacity-70" : ""}`}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
  </div>
);

type CheckboxesProps = {
  active: boolean;
  staff: boolean;
  onActive: (v: boolean) => void;
  onStaff: (v: boolean) => void;
};
const Checkboxes = ({ active, staff, onActive, onStaff }: CheckboxesProps) => (
  <div className="flex items-center space-x-8">
    <label className="flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={active}
        onChange={e => onActive(e.target.checked)}
        className="w-4 h-4 text-green-600 rounded focus:ring-green-500 border-gray-300"
      />
      <span className="ml-2 text-sm text-gray-700">Active</span>
    </label>
    <label className="flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={staff}
        onChange={e => onStaff(e.target.checked)}
        className="w-4 h-4 text-green-600 rounded focus:ring-green-500 border-gray-300"
      />
      <span className="ml-2 text-sm text-gray-700">Staff</span>
    </label>
  </div>
);

type ModalFooterProps = { onCancel: () => void; submitText: string; };
const ModalFooter = ({ onCancel, submitText }: ModalFooterProps) => (
  <div className="flex justify-end space-x-3 pt-4 border-t">
    <button
      type="button"
      onClick={onCancel}
      className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition"
    >
      Cancel
    </button>
    <button
      type="submit"
      className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm transition"
    >
      {submitText}
    </button>
  </div>
);

const Alert = ({ text }: { text: string }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{text}</div>
);

export default Users;