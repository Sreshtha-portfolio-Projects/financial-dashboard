import axios from 'axios';
import { useAuthStore } from '../features/auth/store/useAuthStore';

// Use relative URL for same-domain deployments (Vercel), or absolute URL if specified
// If VITE_API_URL is set and is a full URL, use it; otherwise use relative '/api'
const getApiBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // If no API URL is set, use relative path (works for Vercel and local dev with proxy)
  if (!apiUrl) {
    console.log('Using relative API path /api (will use Vite proxy in dev)');
    return '/api';
  }
  
  // If it's already a relative path, use it as is
  if (apiUrl.startsWith('/')) {
    return apiUrl;
  }
  
  // If it's a full URL, use it (for cross-domain scenarios)
  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    // Remove trailing slash if present, but don't add /api if it's already there
    const cleanUrl = apiUrl.replace(/\/$/, '');
    // Check if /api is already in the URL
    if (cleanUrl.endsWith('/api')) {
      return cleanUrl;
    }
    return cleanUrl + '/api';
  }
  
  // Default fallback
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

// Log API configuration in development
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL);
  console.log('VITE_API_URL env:', import.meta.env.VITE_API_URL);
}

// Create axios instance
const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
  },
});

// Request interceptor to add auth token and prevent caching
httpClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Remove conditional request headers to prevent 304 responses
    delete config.headers['If-None-Match'];
    delete config.headers['If-Modified-Since'];
    
    // Add cache-busting for GET requests
    if (config.method === 'get' || config.method === 'GET') {
      config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      config.headers['Pragma'] = 'no-cache';
      // Add timestamp to prevent browser caching
      const separator = config.url.includes('?') ? '&' : '?';
      config.url = `${config.url}${separator}_t=${Date.now()}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
httpClient.interceptors.response.use(
  (response) => {
    // Handle 304 Not Modified by treating it as a fresh response
    if (response.status === 304) {
      console.warn('Received 304 Not Modified - this should not happen with cache headers');
    }
    return response;
  },
  (error) => {
    // Log all errors for debugging
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        fullURL: `${error.config?.baseURL}${error.config?.url}`,
        data: error.response.data,
      });
    } else if (error.request) {
      // Request was made but no response received
      console.error('API Request Error (no response):', {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        fullURL: `${error.config?.baseURL}${error.config?.url}`,
        message: error.message,
      });
    } else {
      // Error setting up the request
      console.error('API Setup Error:', error.message);
    }
    
    if (error.response?.status === 404) {
      console.error('API endpoint not found');
    }
    
    if (error.response?.status === 401) {
      // Unauthorized - clear auth and redirect to login
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    
    if (error.response?.status === 500) {
      console.error('Server Error (500):', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export default httpClient;

