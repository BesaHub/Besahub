import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
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

// Response interceptor to handle common errors
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

// API service functions
export const apiService = {
  // Properties
  properties: {
    getAll: (params) => api.get('/properties', { params }),
    getById: (id) => api.get(`/properties/${id}`),
    create: (data) => api.post('/properties', data),
    update: (id, data) => api.put(`/properties/${id}`, data),
    delete: (id) => api.delete(`/properties/${id}`),
    uploadImages: (id, images) => {
      const formData = new FormData();
      images.forEach((image) => formData.append('images', image));
      return api.post(`/properties/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    removeImage: (id, imageIndex) => api.delete(`/properties/${id}/images/${imageIndex}`),
    inquire: (id, data) => api.post(`/properties/${id}/inquire`, data),
    mapSearch: (params) => api.get('/properties/search/map', { params }),
  },

  // Contacts
  contacts: {
    getAll: (params) => api.get('/contacts', { params }),
    getById: (id) => api.get(`/contacts/${id}`),
    create: (data) => api.post('/contacts', data),
    update: (id, data) => api.put(`/contacts/${id}`, data),
    delete: (id) => api.delete(`/contacts/${id}`),
    assign: (id, agentId) => api.post(`/contacts/${id}/assign`, { agentId }),
    getActivities: (id, params) => api.get(`/contacts/${id}/activities`, { params }),
    createActivity: (id, data) => api.post(`/contacts/${id}/activities`, data),
    getQualified: () => api.get('/contacts/search/qualified'),
  },

  // Companies
  companies: {
    getAll: (params) => api.get('/companies', { params }),
    getById: (id) => api.get(`/companies/${id}`),
    create: (data) => api.post('/companies', data),
    update: (id, data) => api.put(`/companies/${id}`, data),
    delete: (id) => api.delete(`/companies/${id}`),
    assign: (id, agentId) => api.post(`/companies/${id}/assign`, { agentId }),
    getMatchingProperties: (id, params) => api.get(`/companies/${id}/matching-properties`, { params }),
    getInvestors: (params) => api.get('/companies/search/investors', { params }),
    uploadLogo: (id, logoFile) => {
      const formData = new FormData();
      formData.append('logo', logoFile);
      return api.post(`/companies/${id}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    removeLogo: (id) => api.delete(`/companies/${id}/logo`),
  },

  // Deals
  deals: {
    getAll: (params) => api.get('/deals', { params }),
    getById: (id) => api.get(`/deals/${id}`),
    create: (data) => api.post('/deals', data),
    update: (id, data) => api.put(`/deals/${id}`, data),
    delete: (id) => api.delete(`/deals/${id}`),
    updateStage: (id, stage, notes, lostReason) => 
      api.post(`/deals/${id}/stage`, { stage, notes, lostReason }),
    getPipelineSummary: () => api.get('/deals/pipeline/summary'),
    getOverdue: () => api.get('/deals/search/overdue'),
    getClosingSoon: (days) => api.get('/deals/search/closing-soon', { params: { days } }),
  },

  // Tasks
  tasks: {
    getAll: (params) => api.get('/tasks', { params }),
    getById: (id) => api.get(`/tasks/${id}`),
    create: (data) => api.post('/tasks', data),
    update: (id, data) => api.put(`/tasks/${id}`, data),
    delete: (id) => api.delete(`/tasks/${id}`),
    complete: (id, data) => api.post(`/tasks/${id}/complete`, data),
    getDashboard: () => api.get('/tasks/my/dashboard'),
    getOverdue: () => api.get('/tasks/search/overdue'),
  },

  // Users
  users: {
    getAll: (params) => api.get('/users', { params }),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
    activate: (id) => api.post(`/users/${id}/activate`),
    getDashboard: (id) => api.get(`/users/${id}/dashboard`),
  },

  // Reports
  reports: {
    getDashboard: () => api.get('/reports/dashboard'),
    getSalesPipeline: (params) => api.get('/reports/sales-pipeline', { params }),
    getPropertyPerformance: (params) => api.get('/reports/property-performance', { params }),
    getLeadAnalysis: (params) => api.get('/reports/lead-analysis', { params }),
    getActivitySummary: (params) => api.get('/reports/activity-summary', { params }),
    getRevenueForecast: (params) => api.get('/reports/revenue-forecast', { params }),
  },

  // Integrations
  integrations: {
    getStatus: () => api.get('/integrations/status'),
    twilioCall: (data) => api.post('/integrations/twilio/call', data),
    twilioSMS: (data) => api.post('/integrations/twilio/sms', data),
    mailchimpSync: (data) => api.post('/integrations/mailchimp/sync-contact', data),
    geocodeAddress: (address) => api.post('/integrations/google-maps/geocode', { address }),
    slackNotify: (data) => api.post('/integrations/slack/notify', data),
    mlsSearch: (params) => api.get('/integrations/mls/search', { params }),
    quickbooksSync: (data) => api.post('/integrations/quickbooks/sync-contact', data),
    docusignSend: (data) => api.post('/integrations/docusign/send-envelope', data),
  },
};

// Individual API service exports for convenience
export const dashboardApi = {
  getOverview: () => api.get('/dashboard'),
  getProperties: () => api.get('/dashboard/properties'),
  getPipeline: () => api.get('/dashboard/pipeline'),
  getActivity: () => api.get('/dashboard/activity'),
};

export { api };

export const adminApi = {
  getOverview: () => api.get('/admin/overview'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getAnalytics: (params) => api.get('/admin/analytics', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

export const propertyApi = apiService.properties;
export const dealApi = apiService.deals;
export const contactApi = apiService.contacts;
export const companyApi = apiService.companies;
export const taskApi = apiService.tasks;
export const userApi = apiService.users;
export const reportApi = apiService.reports;

export default api;