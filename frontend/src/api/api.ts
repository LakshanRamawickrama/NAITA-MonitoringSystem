// src/api/api.ts (updated with approvals APIs)
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// Add JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ========== USER API ========== */
export interface UserType {
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

/* ========== CENTER API (FULL UI SUPPORT) ========== */
export interface Center {
  id: number;
  name: string;
  location: string | null;
  manager?: string | null;
  phone?: string | null;
  students?: number | null;
  instructors?: number | null;
  status?: string;
  performance?: string | null;
}

/* GET /api/users/ */
export const fetchUsers = async (): Promise<UserType[]> => {
  const res = await api.get("/api/users/");
  return res.data;
};

/* POST /api/users/ */
export const createUser = async (data: any): Promise<UserType> => {
  const res = await api.post("/api/users/", data);
  return res.data;
};

/* PATCH /api/users/:id/ */
export const updateUser = async (id: number, data: any): Promise<UserType> => {
  const res = await api.patch(`/api/users/${id}/`, data);
  return res.data;
};

/* DELETE /api/users/:id/ */
export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/api/users/${id}/`);
};

/* POST /api/users/:id/change-password/ */
export const changePassword = async (id: number, new_password: string): Promise<void> => {
  await api.post(`/api/users/${id}/change-password/`, { new_password });
};

/* GET /api/centers/ */
export const fetchCenters = async (): Promise<Center[]> => {
  const res = await api.get("/api/centers/");
  return res.data;
};

/* POST /api/centers/create/ */
export const createCenter = async (data: {
  name: string;
  location?: string | null;
  manager?: string | null;
  phone?: string | null;
  students?: number | null;
  instructors?: number | null;
  status?: string;
  performance?: string | null;
}): Promise<Center> => {
  const res = await api.post("/api/centers/create/", data);
  return res.data;
};


/* PATCH /api/centers/<id>/update/ */
export const updateCenter = async (
  id: number,
  data: Partial<{
    name: string;
    location: string | null;
    manager: string | null;
    phone: string | null;
    students: number | null;
    instructors: number | null;
    status: string;
    performance: string | null;
  }>
): Promise<Center> => {
  const res = await api.patch(`/api/centers/${id}/update/`, data);
  return res.data;
};

/* DELETE /api/centers/<id>/delete/ */
export const deleteCenter = async (id: number): Promise<void> => {
  await api.delete(`/api/centers/${id}/delete/`);
};

/* GET /api/overview/ */

export const fetchOverview = async () => {
  const res = await api.get("/api/overview/");
  return res.data;
};

/* GET /api/report/ */

export const fetchReports = async (period: string, center: string) => {
  const res = await api.get(`/api/reports/?period=${period}&center=${center}`);
  return res.data;
};

/* ========== AUTH API ========== */
export const loginUser = async (email: string, password: string) => {
  const res = await api.post("/api/token/", { email, password });

  localStorage.setItem("access_token", res.data.access);
  localStorage.setItem("refresh_token", res.data.refresh);

  const payload = JSON.parse(atob(res.data.access.split(".")[1]));
  localStorage.setItem("user_role", payload.role);
  localStorage.setItem("center_id", payload.center_id || "");
  localStorage.setItem("center_name", payload.center_name || "");

  const me = await api.get("/api/users/me/");
  localStorage.setItem("user_first_name", me.data.first_name || "");
  localStorage.setItem("user_last_name", me.data.last_name || "");

  return res.data;
};


/* ========== APPROVALS API ========== */
export interface ApprovalType {
  id: number;
  type: string;
  center: string;
  requested_by: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  description: string;
  date_requested: string;
  priority: string;
  status: string;
}

/* GET /api/approvals/ */
export const fetchApprovals = async (): Promise<ApprovalType[]> => {
  const res = await api.get("/api/approvals/");
  return res.data;
};

/* POST /api/approvals/ */
export const createApproval = async (data: {
  type: string;
  center: string;
  description: string;
  priority: string;
}): Promise<ApprovalType> => {
  const res = await api.post("/api/approvals/", data);
  return res.data;
};

/* GET /api/approvals/my/ */
export const fetchMyApprovals = async (): Promise<ApprovalType[]> => {
  const res = await api.get("/api/approvals/my/");
  return res.data;
};

/* PUT /api/approvals/:id/:action/ */  // action is 'approve' or 'reject'
export const updateApprovalStatus = async (id: number, action: 'approve' | 'reject'): Promise<ApprovalType> => {
  const res = await api.put(`/api/approvals/${id}/${action}/`);
  return res.data;
};


export default api;