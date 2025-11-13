// src/api.ts
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";
const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const loginUser = async (email: string, password: string) => {
  const res = await axios.post(`${API_BASE}/api/token/`, { email, password });
  localStorage.setItem("access_token", res.data.access);
  localStorage.setItem("refresh_token", res.data.refresh);
  localStorage.setItem("user_role", res.data.role || "admin");
  return res.data;
};

export const fetchUsers = () => api.get("/api/users/").then(r => r.data);
export const createUser = (data: any) => api.post("/api/users/", data).then(r => r.data);
export const updateUser = (id: number, data: any) => api.patch(`/api/users/${id}/`, data).then(r => r.data);
export const deleteUser = (id: number) => api.delete(`/api/users/${id}/delete/`).then(() => null);
export const changePassword = (id: number, new_password: string) =>
  api.post(`/api/users/${id}/change-password/`, { new_password }).then(r => r.data);

export const fetchCenters = () => api.get("/api/centers/").then(r => r.data);