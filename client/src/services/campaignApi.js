import api from './api';

// Campaign API endpoints
export const campaignApi = {
  // Get all campaigns with filtering and pagination
  getCampaigns: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/campaigns${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  },

  // Get single campaign by ID
  getCampaignById: async (id) => {
    try {
      const response = await api.get(`/campaigns/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching campaign:', error);
      throw error;
    }
  },

  // Create new campaign
  createCampaign: async (campaignData) => {
    try {
      const response = await api.post('/campaigns', campaignData);
      return response.data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  },

  // Update existing campaign
  updateCampaign: async (id, campaignData) => {
    try {
      const response = await api.put(`/campaigns/${id}`, campaignData);
      return response.data;
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
  },

  // Delete campaign
  deleteCampaign: async (id) => {
    try {
      const response = await api.delete(`/campaigns/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting campaign:', error);
      throw error;
    }
  },

  // Schedule campaign for sending
  scheduleCampaign: async (id, scheduledDate) => {
    try {
      const response = await api.post(`/campaigns/${id}/schedule`, { scheduledDate });
      return response.data;
    } catch (error) {
      console.error('Error scheduling campaign:', error);
      throw error;
    }
  },

  // Send campaign immediately
  sendCampaign: async (id) => {
    try {
      const response = await api.post(`/campaigns/${id}/send`);
      return response.data;
    } catch (error) {
      console.error('Error sending campaign:', error);
      throw error;
    }
  },

  // Pause campaign sending
  pauseCampaign: async (id) => {
    try {
      const response = await api.post(`/campaigns/${id}/pause`);
      return response.data;
    } catch (error) {
      console.error('Error pausing campaign:', error);
      throw error;
    }
  },

  // Cancel campaign
  cancelCampaign: async (id) => {
    try {
      const response = await api.post(`/campaigns/${id}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling campaign:', error);
      throw error;
    }
  },

  // Get campaign recipients
  getCampaignRecipients: async (id) => {
    try {
      const response = await api.get(`/campaigns/${id}/recipients`);
      return response.data;
    } catch (error) {
      console.error('Error fetching campaign recipients:', error);
      throw error;
    }
  },

  // Get campaign analytics
  getCampaignAnalytics: async (id) => {
    try {
      const response = await api.get(`/campaigns/${id}/analytics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      throw error;
    }
  },

  // Send test email
  sendTestEmail: async (id, email) => {
    try {
      const response = await api.post(`/campaigns/${id}/test`, { email });
      return response.data;
    } catch (error) {
      console.error('Error sending test email:', error);
      throw error;
    }
  },

  // Duplicate campaign
  duplicateCampaign: async (id) => {
    try {
      const response = await api.post(`/campaigns/${id}/duplicate`);
      return response.data;
    } catch (error) {
      console.error('Error duplicating campaign:', error);
      throw error;
    }
  }
};

// Campaign type definitions
export const CAMPAIGN_TYPES = [
  { id: 'email', name: 'Email', description: 'General email campaign' },
  { id: 'newsletter', name: 'Newsletter', description: 'Regular newsletter' },
  { id: 'property_promo', name: 'Property Promotion', description: 'Promote properties' },
  { id: 'investor_update', name: 'Investor Update', description: 'Update for investors' },
  { id: 'event', name: 'Event', description: 'Event invitation or update' }
];

// Campaign status definitions
export const CAMPAIGN_STATUSES = [
  { id: 'draft', name: 'Draft', color: 'default' },
  { id: 'scheduled', name: 'Scheduled', color: 'info' },
  { id: 'sending', name: 'Sending', color: 'warning' },
  { id: 'sent', name: 'Sent', color: 'success' },
  { id: 'paused', name: 'Paused', color: 'warning' },
  { id: 'cancelled', name: 'Cancelled', color: 'error' }
];

// Recipient type definitions
export const RECIPIENT_TYPES = [
  { id: 'all_contacts', name: 'All Contacts', description: 'Send to all contacts in CRM' },
  { id: 'filtered', name: 'Filtered Contacts', description: 'Send to contacts matching criteria' },
  { id: 'custom_list', name: 'Custom List', description: 'Upload or select specific contacts' },
  { id: 'specific', name: 'Specific Contacts', description: 'Choose individual contacts' }
];

export default campaignApi;
