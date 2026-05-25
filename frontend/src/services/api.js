/**
 * api.js — Axios instance with JWT token injection.
 */
import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: "/api/",
  timeout: 30000,
});

// ── Request Interceptor: attach JWT token ────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token") || useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: handle 401 ─────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// ── API Methods ─────────────────────────────────────────
export const authAPI = {
  // JWT fallback login
  login: (data) => api.post("auth/login", data),
  // Called after Firebase signup to create/upsert the DB user
  register: (data, config = {}) =>
    api.post("auth/register", data, config),
  me: () => api.get("auth/me"),
};

export const resumeAPI = {
  upload: (formData) =>
    api.post("resume/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  list: (page = 1) => api.get(`resume/list?page=${page}`),
  get: (id) => api.get(`resume/${id}`),
  delete: (id) => api.delete(`resume/${id}`),
  download: (id) => api.get(`resume/${id}/download`, { responseType: "blob" }),
};

export const analysisAPI = {
  analyze: (data) => api.post("analysis/analyze", data),
  generateJD: (jobTitle) => api.post("analysis/generate-jd", { job_title: jobTitle }),
  get: (id) => api.get(`analysis/${id}`),
  history: (page = 1) => api.get(`analysis/history?page=${page}`),
  exportPdf: (id) =>
    api.get(`analysis/${id}/export-pdf`, { responseType: "blob" }),
  delete: (id) => api.delete(`analysis/${id}`),
};

export const adminAPI = {
  stats: () => api.get("admin/stats"),
  users: (page = 1, search = "") =>
    api.get(`admin/users?page=${page}&search=${search}`),
  deleteUser: (id) => api.delete(`admin/users/${id}`),
  toggleActive: (id) => api.patch(`admin/users/${id}/toggle-active`),
  makeAdmin: (id) => api.patch(`admin/users/${id}/make-admin`),
  logs: (page = 1) => api.get(`admin/logs?page=${page}`),
};

export const paymentAPI = {
  createOrder: (amount) => api.post("payment/create-order", { amount }),
  verifyPayment: (data) => api.post("payment/verify", data),
};

export default api;

