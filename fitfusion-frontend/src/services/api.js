import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error('[API] Auth Error detected:', {
        status: error.response.status,
        url: error.config.url,
        method: error.config.method,
        message: error.response.data?.message
      });
      // localStorage.removeItem('token');
      // localStorage.removeItem('user');
      // window.location.href = '/login';
      alert(`AUTH ERROR: ${error.response.status} - ${error.config.url}\nCheck console for details.`);
    }
    return Promise.reject(error);
  }
);

export default api;
