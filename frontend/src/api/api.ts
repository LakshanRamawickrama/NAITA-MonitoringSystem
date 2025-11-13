// src/api.ts
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";
const api = axios.create({ baseURL: API_BASE });

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Login function
export const loginUser = async (email: string, password: string) => {
  const res = await axios.post(`${API_BASE}/api/token/`, { email, password });
  localStorage.setItem("access_token", res.data.access);
  localStorage.setItem("refresh_token", res.data.refresh);
  localStorage.setItem("user_role", res.data.role || "admin");
  return res.data;
};

// Protected endpoints
export const fetchUsers = () => api.get("/api/users/").then(r => r.data);
export const createUser = (data: any) => api.post("/api/users/", data).then(r => r.data);
export const fetchCenters = () => api.get("/api/centers/").then(r => r.data);
