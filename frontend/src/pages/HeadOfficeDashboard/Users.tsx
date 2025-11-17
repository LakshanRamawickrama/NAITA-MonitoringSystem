// src/pages/HeadOfficeDashboard/Users.tsx
import React, { useState, useEffect, useMemo } from "react";
import DataTable from "../../components/DataTable";
import {
  Search, Plus, Mail, Shield, X, Loader2,
  Edit, Trash2, Key, AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchUsers, createUser, fetchCenters,
  updateUser, deleteUser, changePassword
} from "../../api/api";

interface Center {
  id: number;
  name: string;
}

interface UserType {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  center: { id: number; name: string } | null;
  is_active: boolean;
  is_staff: boolean;
  last_login: string | null;
}

const Users: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
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
    role: "", center_id: "", is_active: true, is_staff: false
  };
  const [addForm, setAddForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);
  const [pwdForm, setPwdForm] = useState({ new_password: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const pageSize = 10;

  // === Get user role from localStorage (only needed for admin check) ===
  const userRole = localStorage.getItem("user_role") || "data_entry";
  const isAdmin = userRole === "admin";

  /* ========== FETCH DATA ========== */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true); setError("");
        const [u, c] = await Promise.all([fetchUsers(), fetchCenters()]);
        setUsers(u); setCenters(c);
      } catch (e: any) {
        const msg = e.response?.data?.detail || "Failed to load data";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* ========== HELPERS ========== */
  const resetForm = () => {
    setAddForm(initialForm);
    setEditForm(initialForm);
    setPwdForm({ new_password: "" });
    setFormErrors({});
  };

  const openEdit = (u: UserType) => {
    setSelectedUser(u);
    setEditForm({
      username: u.username, email: u.email, password: "",
      first_name: u.first_name, last_name: u.last_name,
      role: u.role, center_id: u.center?.id?.toString() || "",
      is_active: u.is_active, is_staff: u.is_staff
    });
    setShowEdit(true);
  };

  const openPwd = (u: UserType) => { setSelectedUser(u); setPwdForm({ new_password: "" }); setShowPwd(true); };
  const openDelete = (u: UserType) => { setSelectedUser(u); setShowDelete(true); };

  /* ========== CRUD ========== */
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setFormErrors({});
    try {
      const payload: any = {
        username: addForm.username.trim(),
        email: addForm.email.trim(),
        password: addForm.password,
        first_name: addForm.first_name.trim(),
        last_name: addForm.last_name.trim(),
        role: addForm.role,
        is_active: addForm.is_active,
        is_staff: addForm.is_staff
      };
      if (addForm.center_id) payload.center_id = Number(addForm.center_id);

      const nu = await createUser(payload);
      setUsers(p => [...p, nu]);
      setShowAdd(false); resetForm();
      toast.success("User created successfully");
    } catch (err: any) { handleApiError(err); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormErrors({});
    if (!selectedUser) return;
    try {
      const payload: any = {
        username: editForm.username.trim(),
        email: editForm.email.trim(),
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        role: editForm.role,
        is_active: editForm.is_active,
        is_staff: editForm.is_staff
      };
      if (editForm.center_id) payload.center_id = Number(editForm.center_id);

      const upd = await updateUser(selectedUser.id, payload);
      setUsers(p => p.map(u => u.id === selectedUser.id ? upd : u));
      setShowEdit(false); resetForm();
      toast.success("User updated");
    } catch (err: any) { handleApiError(err); }
  };

  const handlePwd = async (e: React.FormEvent) => {
    e.preventDefault(); setFormErrors({});
    if (!selectedUser) return;
    try {
      await changePassword(selectedUser.id, pwdForm.new_password);
      setShowPwd(false); resetForm();
      toast.success("Password changed");
    } catch (err: any) { handleApiError(err); }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setDeleteLoading(true);
    try {
      await deleteUser(selectedUser.id);
      setUsers(p => p.filter(u => u.id !== selectedUser.id));
      setShowDelete(false);
      toast.success(`${selectedUser.username} deleted`);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Delete failed";
      toast.error(msg);
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
      return u.username.toLowerCase().includes(s) ||
             u.email.toLowerCase().includes(s) ||
             name.includes(s) || center.includes(s);
    })
    .filter(u => roleFilter ? u.role === roleFilter : true)
    .filter(u => statusFilter ? (u.is_active ? "Active" : "Inactive") === statusFilter : true),
    [users, searchTerm, roleFilter, statusFilter]);

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
      key: "role",
      label: "Role",
      render: (v: string) => {
        const map: Record<string, string> = {
          admin: "bg-purple-100 text-purple-800",
          district_manager: "bg-green-100 text-green-800",
          training_officer: "bg-yellow-100 text-yellow-800",
          data_entry: "bg-blue-100 text-blue-800",
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
    { key: "center", label: "Center", render: (c: any) => <span className="text-sm font-medium">{c?.name || "—"}</span> },
    {
      key: "is_active",
      label: "Status",
      render: (a: boolean) => (
        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${a ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {a ? "Active" : "Inactive"}
        </span>
      )
    },
    ...(isAdmin ? [{
      key: "actions",
      label: "Actions",
      render: (_: any, row: UserType) => (
        <div className="flex space-x-2">
          <button onClick={() => openEdit(row)} className="text-blue-600 hover:text-blue-800">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => openPwd(row)} className="text-orange-600 hover:text-orange-800">
            <Key className="w-4 h-4" />
          </button>
          <button onClick={() => openDelete(row)} className="text-red-600 hover:text-red-800">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
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
          </div>
          {isAdmin && (
            <button onClick={() => { resetForm(); setShowAdd(true); }}
                    className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 flex items-center space-x-2 shadow-sm">
              <Plus className="w-4 h-4" /><span>Add User</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Search…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                   className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="district_manager">District Manager</option>
            <option value="training_officer">Training Officer</option>
            <option value="data_entry">Data Entry</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <DataTable columns={columns} data={paginated} currentPage={currentPage}
                   totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* ========== MODALS ========== */}
      {showAdd && (
        <Modal title="Add New User" onClose={() => { setShowAdd(false); resetForm(); }}>
          <form onSubmit={handleAdd} className="space-y-5">
            {formErrors.general && <Alert text={formErrors.general} />}
            <Input label="Username *" value={addForm.username} onChange={v => setAddForm({ ...addForm, username: v })} error={formErrors.username} required />
            <Input label="Email *" type="email" value={addForm.email} onChange={v => setAddForm({ ...addForm, email: v })} error={formErrors.email} required />
            <Input label="Password *" type="password" value={addForm.password} onChange={v => setAddForm({ ...addForm, password: v })} error={formErrors.password} required minLength={8} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" value={addForm.first_name} onChange={v => setAddForm({ ...addForm, first_name: v })} />
              <Input label="Last Name" value={addForm.last_name} onChange={v => setAddForm({ ...addForm, last_name: v })} />
            </div>
            <Select label="Role *" options={roleOptions} value={addForm.role} onChange={v => setAddForm({ ...addForm, role: v })} error={formErrors.role} required />
            <Select label="Center (Optional)" options={[{ value: "", label: "No Center" }, ...centers.map(c => ({ value: c.id.toString(), label: c.name }))]} value={addForm.center_id} onChange={v => setAddForm({ ...addForm, center_id: v })} />
            <Checkboxes active={addForm.is_active} staff={addForm.is_staff} onActive={v => setAddForm({ ...addForm, is_active: v })} onStaff={v => setAddForm({ ...addForm, is_staff: v })} />
            <ModalFooter onCancel={() => { setShowAdd(false); resetForm(); }} submitText="Create User" />
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
            <Select label="Role *" options={roleOptions} value={editForm.role} onChange={v => setEditForm({ ...editForm, role: v })} error={formErrors.role} required />
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
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center space-x-2 disabled:opacity-70"
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
const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "district_manager", label: "District Manager" },
  { value: "training_officer", label: "Training Officer" },
  { value: "data_entry", label: "Data Entry" },
];

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

type InputProps = { label: string; type?: string; value: string; onChange: (v: string) => void; error?: string; required?: boolean; minLength?: number; };
const Input = ({ label, type = "text", value, onChange, error, required, minLength }: InputProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      required={required} minLength={minLength}
      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${error ? "border-red-500" : "border-gray-300"}`}
    />
    {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
  </div>
);

type SelectProps = { label: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; error?: string; required?: boolean; };
const Select = ({ label, options, value, onChange, error, required }: SelectProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    <select
      value={value} onChange={e => onChange(e.target.value)} required={required}
      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${error ? "border-red-500" : "border-gray-300"}`}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
  </div>
);

type CheckboxesProps = { active: boolean; staff: boolean; onActive: (v: boolean) => void; onStaff: (v: boolean) => void; };
const Checkboxes = ({ active, staff, onActive, onStaff }: CheckboxesProps) => (
  <div className="flex items-center space-x-8">
    <label className="flex items-center cursor-pointer">
      <input type="checkbox" checked={active} onChange={e => onActive(e.target.checked)} className="w-4 h-4 text-green-600 rounded focus:ring-green-500" />
      <span className="ml-2 text-sm text-gray-700">Active</span>
    </label>
    <label className="flex items-center cursor-pointer">
      <input type="checkbox" checked={staff} onChange={e => onStaff(e.target.checked)} className="w-4 h-4 text-green-600 rounded focus:ring-green-500" />
      <span className="ml-2 text-sm text-gray-700">Staff</span>
    </label>
  </div>
);

type ModalFooterProps = { onCancel: () => void; submitText: string; };
const ModalFooter = ({ onCancel, submitText }: ModalFooterProps) => (
  <div className="flex justify-end space-x-3 pt-4 border-t">
    <button type="button" onClick={onCancel} className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
      Cancel
    </button>
    <button type="submit" className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm">
      {submitText}
    </button>
  </div>
);

const Alert = ({ text }: { text: string }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{text}</div>
);

export default Users;