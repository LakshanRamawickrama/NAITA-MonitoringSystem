// src/api/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000", // Adjust if needed
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

export interface Center {
  id: number;
  name: string;
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

/* ========== AUTH API ========== */
export const loginUser = async (email: string, password: string) => {
  const res = await api.post("/api/token/", { email, password });

  localStorage.setItem("access_token", res.data.access);
  localStorage.setItem("refresh_token", res.data.refresh);

  const payload = JSON.parse(atob(res.data.access.split(".")[1]));
  localStorage.setItem("user_role", payload.role);
  localStorage.setItem("center_id", payload.center_id || "");
  localStorage.setItem("center_name", payload.center_name || "");

  // Get full user info
  const me = await api.get("/api/users/me/");
  localStorage.setItem("user_first_name", me.data.first_name || "");
  localStorage.setItem("user_last_name", me.data.last_name || "");

  return res.data;
};

export default api;