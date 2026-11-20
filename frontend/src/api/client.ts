import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Attach Authorization Bearer token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('finance_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept 401 unauthenticated errors to redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('finance_token');
      localStorage.removeItem('finance_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
