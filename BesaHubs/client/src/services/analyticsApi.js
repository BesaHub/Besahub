import api from './api';

export const analyticsApi = {
  // Get comprehensive analytics overview
  getOverview: (timeframe = '30d') => api.get(`/analytics/overview?timeframe=${timeframe}`),

  // Get specific analytics categories
  getSalesAnalytics: (timeframe = '12m') => api.get(`/analytics/sales?timeframe=${timeframe}`),
  getPropertyAnalytics: (timeframe = '12m') => api.get(`/analytics/properties?timeframe=${timeframe}`),
  getLeadAnalytics: (timeframe = '30d') => api.get(`/analytics/leads?timeframe=${timeframe}`),
  getMarketingAnalytics: (timeframe = '30d') => api.get(`/analytics/marketing?timeframe=${timeframe}`),
  getFinancialAnalytics: (timeframe = '12m') => api.get(`/analytics/financial?timeframe=${timeframe}`),

  // Get KPI tracking data
  getKPIs: () => api.get('/analytics/kpis'),

  // Get custom analytics
  getCustomAnalytics: (metrics, timeframe, filters) => {
    const params = new URLSearchParams();
    if (metrics) params.append('metrics', metrics.join(','));
    if (timeframe) params.append('timeframe', timeframe);
    if (filters) params.append('filters', JSON.stringify(filters));
    
    return api.get(`/analytics/custom?${params.toString()}`);
  },

  // Export analytics data
  exportAnalytics: (format, data, filename) => 
    api.post('/analytics/export', { format, data, filename }),

  // Dashboard management
  getDashboard: (id) => api.get(`/analytics/dashboard/${id}`),
  saveDashboard: (name, widgets, isPublic = false) => 
    api.post('/analytics/dashboard', { name, widgets, isPublic }),
  updateDashboard: (id, name, widgets, isPublic) => 
    api.put(`/analytics/dashboard/${id}`, { name, widgets, isPublic }),
  deleteDashboard: (id) => api.delete(`/analytics/dashboard/${id}`),

  // Real-time analytics (for live updates)
  getRealTimeMetrics: () => api.get('/analytics/realtime'),
  
  // Comparative analytics
  getComparativeAnalytics: (period1, period2, metrics) => 
    api.post('/analytics/compare', { period1, period2, metrics }),

  // Forecasting
  getForecasts: (metric, periods = 12) => 
    api.get(`/analytics/forecast?metric=${metric}&periods=${periods}`)
};
