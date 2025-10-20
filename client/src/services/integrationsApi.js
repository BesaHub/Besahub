import api from './api';

const integrationsApi = {
  getSendGridStatus: async () => {
    const response = await api.get('/integrations/sendgrid/status');
    return response.data;
  },

  sendTestEmail: async (to) => {
    const response = await api.post('/integrations/sendgrid/test', { to });
    return response.data;
  },

  getCalendarAccounts: async () => {
    const response = await api.get('/calendar/accounts');
    return response.data;
  },

  getSystemHealth: async () => {
    const response = await api.get('/integrations/system-health');
    return response.data;
  },

  getFeatureFlags: async () => {
    const response = await api.get('/integrations/feature-flags');
    return response.data;
  },

  getWizardStatus: async () => {
    const response = await api.get('/wizard/status');
    return response.data;
  },

  completeWizard: async () => {
    const response = await api.post('/wizard/complete');
    return response.data;
  },

  createSampleDashboard: async () => {
    const response = await api.post('/wizard/create-sample-dashboard');
    return response.data;
  }
};

export default integrationsApi;
