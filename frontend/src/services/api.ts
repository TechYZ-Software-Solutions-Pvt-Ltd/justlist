import axios from 'axios';

// Get API URL from runtime config or environment variable
function getApiUrl(): string {
  // 1. Try to get from runtime config (e.g., public/config.js)
  const runtimeConfig = (window as any).__APP_CONFIG__?.apiUrl;
  if (runtimeConfig && !runtimeConfig.includes('your-backend.onrender.com') && !runtimeConfig.includes('your-')) {
    return runtimeConfig;
  }
  // 2. Fallback to environment variable (set at build time)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // 3. Default to localhost for local development
  return 'http://localhost:8000';
}

const API_URL = getApiUrl();

// Log API URL for debugging (always log in development)
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  console.log('🔧 API Configuration:', {
    apiUrl: API_URL,
    runtimeConfig: (window as any).__APP_CONFIG__?.apiUrl,
    envVar: process.env.REACT_APP_API_URL,
    currentOrigin: window.location.origin,
  });
  
  // Test backend connectivity on startup (non-blocking)
  setTimeout(() => {
    fetch(`${API_URL}/health`, { 
      method: 'GET',
      mode: 'cors',
      credentials: 'omit' // Don't send credentials for health check
    })
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        throw new Error(`HTTP ${res.status}`);
      })
      .then(data => {
        console.log('✅ Backend health check successful:', data);
        console.log('   Backend is reachable and CORS is working!');
      })
      .catch(err => {
        console.error('❌ Backend not reachable from browser:', err.message);
        console.error('   API URL:', API_URL);
        console.error('   Current origin:', window.location.origin);
        console.error('   Error type:', err.name);
        console.error('   Full error:', err);
        console.error('\n💡 Troubleshooting:');
        console.error('   1. Check if backend is running: python start_backend.py');
        console.error('   2. Check if backend is accessible: http://localhost:8000/health');
        console.error('   3. Check browser console for CORS errors');
        console.error('   4. Try refreshing the page');
      });
  }, 1000);
}

// Validate API URL
if (!API_URL || API_URL.trim() === '') {
  console.error('❌ ERROR: API URL is empty or undefined!');
  console.error('   Check getApiUrl() function and environment variables');
}

// Create axios instance
export const api = axios.create({
  baseURL: API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Set to false to avoid CORS issues with credentials
});

// Simple client-side activity logger
function appendLog(entry: any) {
  try {
    const key = 'activity_log';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.unshift({ time: new Date().toISOString(), ...entry });
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 200))); // keep last 200
  } catch {}
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    appendLog({ type: 'request', method: config.method, url: config.url, data: config.data ? '[payload]' : undefined });
    return config;
  },
  (error) => {
    appendLog({ type: 'request_error', error: String(error) });
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    appendLog({ type: 'response', status: response.status, url: response.config?.url });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(
            `${API_URL}/auth/refresh`,
            { refresh_token: refreshToken }
          );

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    appendLog({ type: 'response_error', status: error?.response?.status, url: error?.config?.url, detail: error?.response?.data?.detail || error?.message });
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  register: (userData: any) =>
    api.post('/auth/register', userData),
  getMe: () =>
    api.get('/auth/me'),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),
};

export const facilitiesAPI = {
  search: (searchData: any) =>
    api.post('/facilities/search', searchData, { timeout: 45000 }),
  searchFacilities: (searchData: any) =>
    api.post('/facilities/search', searchData, { timeout: 45000 }),
  getHistory: (skip = 0, limit = 20) =>
    api.get(`/facilities/history?skip=${skip}&limit=${limit}`),
  getSearchHistoryFacilities: (searchId: number) =>
    api.get(`/facilities/history/${searchId}/facilities`),
  deleteHistory: (searchId: number) =>
    api.delete(`/facilities/history/${searchId}`),
  deleteSearchHistory: (searchId: number) =>
    api.delete(`/search-history/${searchId}`),
  deleteAllSearchHistory: () =>
    api.delete('/search-history/delete-all-search-history'),
};

export const leadsAPI = {
  // Leads CRUD
  createLead: (leadData: any) =>
    api.post('/leads/', leadData),
  getLeads: (statusFilter?: string, skip = 0, limit = 50) =>
    api.get(`/leads/?${statusFilter ? `status_filter=${statusFilter}&` : ''}skip=${skip}&limit=${limit}`),
  getLead: (leadId: number) =>
    api.get(`/leads/${leadId}`),
  updateLead: (leadId: number, leadData: any) =>
    api.put(`/leads/${leadId}`, leadData),
  deleteLead: (leadId: number) =>
    api.delete(`/leads/${leadId}`),
  
  // Statistics
  getStats: () =>
    api.get('/leads/stats'),
  
  // Activities
  createActivity: (leadId: number, activityData: any) =>
    api.post(`/leads/${leadId}/activities`, activityData),
  getActivities: (leadId: number) =>
    api.get(`/leads/${leadId}/activities`),
  
  // Reminders
  createReminder: (leadId: number, reminderData: any) =>
    api.post(`/leads/${leadId}/reminders`, reminderData),
  getUpcomingReminders: (days = 7) =>
    api.get(`/leads/reminders/upcoming?days=${days}`),
};

