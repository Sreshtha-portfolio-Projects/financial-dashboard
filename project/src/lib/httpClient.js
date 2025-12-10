import axios from 'axios';
import { useAuthStore } from '../features/auth/store/useAuthStore';

// Use relative URL for same-domain deployments (Vercel), or absolute URL if specified
// If VITE_API_URL is set and is a full URL, use it; otherwise use relative '/api'
const getApiBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // If no API URL is set, use relative path (works for Vercel)
  if (!apiUrl) {
    return '/api';
  }
  
  // If it's already a relative path, use it as is
  if (apiUrl.startsWith('/')) {
    return apiUrl;
  }
  
  // If it's a full URL, use it (for cross-domain scenarios)
  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    // Remove trailing slash if present
    return apiUrl.replace(/\/$/, '') + '/api';
  }
  
  // Default fallback
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance
const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
httpClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear auth and redirect to login
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default httpClient;

