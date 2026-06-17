import axios from 'axios';

let apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://luminous-studio-backend.onrender.com/api';
if (apiBaseUrl && !apiBaseUrl.endsWith('/api') && !apiBaseUrl.endsWith('/api/')) {
  apiBaseUrl = apiBaseUrl.replace(/\/$/, '') + '/api';
}

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('luminosToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401, suppress unhandled rejections
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('luminosToken');
      localStorage.removeItem('luminosUser');
    }
    // Return empty data for collection lists on network errors, reject others
    if (!err.response) {
      const url = err.config?.url || '';
      const isCollectionGet = err.config?.method === 'get' && 
        (url.includes('/portfolio') || url.includes('/services') || url.includes('/bookings'));
      
      if (isCollectionGet) {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error('Network error. Please check if the backend server is running.'));
    }
    return Promise.reject(err);
  }
);

export default api;
