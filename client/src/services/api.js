import axios from 'axios';

const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';
  // Remove trailing slash
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  // Append /api/v1 if not present
  if (!url.endsWith('/api/v1')) {
    url += '/api/v1';
  }
  return url;
};

const API_BASE_URL = getBaseUrl();

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
      // Always set Authorization header, even for multipart/form-data
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
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired, invalid, or missing
      const errorMessage = error.response?.data?.error || 'Authentication required';

      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Show error message before redirect
        if (errorMessage.includes('token') || errorMessage.includes('Authentication')) {
          // Small delay to allow toast to show if using toast notifications
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        } else {
          window.location.href = '/login';
        }
      }
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
  upload: (formData) => {
    // Get token to ensure it's included
    const token = localStorage.getItem('token');
    return api.post('/ingest/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        // Explicitly set Authorization header for multipart requests
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  },
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
