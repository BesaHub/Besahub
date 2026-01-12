import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const reportsApi = {
  getDashboard: () => api.get('/reports/dashboard'),
  
  getSalesPipeline: (params) => api.get('/reports/sales-pipeline', { params }),
  
  getPropertyPerformance: (params) => api.get('/reports/property-performance', { params }),
  
  getLeadAnalysis: (params) => api.get('/reports/lead-analysis', { params }),
  
  getActivitySummary: (params) => api.get('/reports/activity-summary', { params }),
  
  getRevenueForecast: (params) => api.get('/reports/revenue-forecast', { params }),
};

export default reportsApi;
