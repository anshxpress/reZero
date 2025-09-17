import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  logout: () => api.post('/auth/logout'),
};

// Ingest API
export const ingestAPI = {
  create: (ingestData) => api.post('/ingest', ingestData),
  upload: (formData) => api.post('/ingest/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getById: (id) => api.get(`/ingest/${id}`),
  list: (params = {}) => api.get('/ingest', { params }),
  delete: (id) => api.delete(`/ingest/${id}`),
};

// Tasks API
export const tasksAPI = {
  create: (taskData) => api.post('/tasks', taskData),
  getById: (id) => api.get(`/tasks/${id}`),
  list: (params = {}) => api.get('/tasks', { params }),
  update: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  cancel: (id) => api.post(`/tasks/${id}/cancel`),
  delete: (id) => api.delete(`/tasks/${id}`),
  getAvailableAgents: () => api.get('/tasks/agents/available'),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
