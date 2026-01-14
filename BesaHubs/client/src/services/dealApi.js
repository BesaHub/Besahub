import api from './api';

// Deal API endpoints
export const dealApi = {
  // Get all deals with filtering and pagination
  getDeals: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/deals${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching deals:', error);
      throw error;
    }
  },

  // Get single deal by ID
  getDeal: async (id) => {
    try {
      const response = await api.get(`/deals/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching deal:', error);
      throw error;
    }
  },

  // Create new deal
  createDeal: async (dealData) => {
    try {
      const response = await api.post('/deals', dealData);
      return response.data;
    } catch (error) {
      console.error('Error creating deal:', error);
      throw error;
    }
  },

  // Update existing deal
  updateDeal: async (id, dealData) => {
    try {
      const response = await api.put(`/deals/${id}`, dealData);
      return response.data;
    } catch (error) {
      console.error('Error updating deal:', error);
      throw error;
    }
  },

  // Delete deal
  deleteDeal: async (id) => {
    try {
      const response = await api.delete(`/deals/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting deal:', error);
      throw error;
    }
  },

  // Update deal stage
  updateDealStage: async (id, stage, notes = '') => {
    try {
      const response = await api.put(`/deals/${id}/stage`, {
        stage,
        notes
      });
      return response.data;
    } catch (error) {
      console.error('Error updating deal stage:', error);
      throw error;
    }
  },

  // Add activity to deal
  addActivity: async (id, activityData) => {
    try {
      const response = await api.post(`/deals/${id}/activities`, activityData);
      return response.data;
    } catch (error) {
      console.error('Error adding deal activity:', error);
      throw error;
    }
  },

  // Get deal activities
  getDealActivities: async (id, params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/deals/${id}/activities${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching deal activities:', error);
      throw error;
    }
  },

  // Update deal probability
  updateProbability: async (id, probability) => {
    try {
      const response = await api.put(`/deals/${id}/probability`, {
        probability
      });
      return response.data;
    } catch (error) {
      console.error('Error updating deal probability:', error);
      throw error;
    }
  },

  // Get pipeline statistics
  getPipelineStats: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/deals/pipeline/stats${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching pipeline stats:', error);
      throw error;
    }
  },

  // Get deals by stage for pipeline view
  getDealsByStage: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/deals/pipeline${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching deals by stage:', error);
      throw error;
    }
  },

  // Bulk update deals (for multi-select actions)
  bulkUpdateDeals: async (dealIds, updates) => {
    try {
      const response = await api.post('/deals/bulk-update', { dealIds, updates });
      return response.data;
    } catch (error) {
      console.error('Error bulk updating deals:', error);
      throw error;
    }
  },

  // Duplicate deal
  duplicateDeal: async (id, newData = {}) => {
    try {
      const response = await api.post(`/deals/${id}/duplicate`, newData);
      return response.data;
    } catch (error) {
      console.error('Error duplicating deal:', error);
      throw error;
    }
  },

  // Export deals to CSV/Excel
  exportDeals: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/deals/export${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url, {
        responseType: 'blob', // Important for file download
      });
      
      return response.data;
    } catch (error) {
      console.error('Error exporting deals:', error);
      throw error;
    }
  },

  // Get deal forecast/projections
  getDealForecast: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/deals/forecast${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching deal forecast:', error);
      throw error;
    }
  },

  // Get deal conversion metrics
  getConversionMetrics: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/deals/metrics/conversion${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversion metrics:', error);
      throw error;
    }
  }
};

// Deal stage definitions for the CRM
export const DEAL_STAGES = [
  {
    id: 'prospecting',
    name: 'Prospecting',
    description: 'Initial contact and qualification',
    probability: 10,
    color: '#2196f3', // Blue - vibrant and readable
    bgColor: '#e3f2fd', // Light blue background
    textColor: '#ffffff' // White text for contrast
  },
  {
    id: 'qualification',
    name: 'Qualification',
    description: 'Assessing fit and requirements',
    probability: 25,
    color: '#9c27b0', // Purple - vibrant and readable
    bgColor: '#f3e5f5', // Light purple background
    textColor: '#ffffff' // White text for contrast
  },
  {
    id: 'proposal',
    name: 'Proposal',
    description: 'Preparing and presenting offer',
    probability: 50,
    color: '#ff9800', // Orange - vibrant and readable
    bgColor: '#fff3e0', // Light orange background
    textColor: '#ffffff' // White text for contrast
  },
  {
    id: 'negotiation',
    name: 'Negotiation',
    description: 'Terms and price negotiation',
    probability: 75,
    color: '#4caf50', // Green - vibrant and readable
    bgColor: '#e8f5e8', // Light green background
    textColor: '#ffffff' // White text for contrast
  },
  {
    id: 'due_diligence',
    name: 'Due Diligence',
    description: 'Reviewing property and documents',
    probability: 65,
    color: '#00bcd4', // Cyan - vibrant and readable
    bgColor: '#e0f7fa', // Light cyan background
    textColor: '#ffffff' // White text for contrast
  },
  {
    id: 'closing',
    name: 'Closing',
    description: 'Finalizing transaction',
    probability: 95,
    color: '#009688', // Teal - vibrant and readable
    bgColor: '#e0f2f1', // Light teal background
    textColor: '#ffffff' // White text for contrast
  },
  {
    id: 'contract',
    name: 'Contract',
    description: 'Finalizing legal agreements',
    probability: 90,
    color: '#00bcd4', // Cyan - vibrant and readable
    bgColor: '#e0f7fa', // Light cyan background
    textColor: '#ffffff' // White text for contrast
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Property listed for sale/lease',
    probability: 30,
    color: '#ff5722', // Deep orange - vibrant and readable
    bgColor: '#fbe9e7', // Light orange background
    textColor: '#ffffff' // White text for contrast
  },
  {
    id: 'closed_won',
    name: 'Closed Won',
    description: 'Deal successfully completed',
    probability: 100,
    color: '#4caf50', // Green - vibrant and readable
    bgColor: '#e8f5e8', // Light green background
    textColor: '#ffffff' // White text for contrast
  },
  {
    id: 'closed_lost',
    name: 'Closed Lost',
    description: 'Deal not successful',
    probability: 0,
    color: '#f44336', // Red - vibrant and readable
    bgColor: '#ffebee', // Light red background
    textColor: '#ffffff' // White text for contrast
  }
];

// Deal priority levels
export const DEAL_PRIORITIES = [
  { id: 'low', name: 'Low', color: '#9e9e9e' },
  { id: 'medium', name: 'Medium', color: '#ff9800' },
  { id: 'high', name: 'High', color: '#f44336' },
  { id: 'urgent', name: 'Urgent', color: '#d32f2f' }
];

// Deal types for commercial real estate
export const DEAL_TYPES = [
  { id: 'sale', name: 'Sale' },
  { id: 'lease', name: 'Lease' },
  { id: 'purchase', name: 'Purchase' },
  { id: 'sublease', name: 'Sublease' },
  { id: 'management', name: 'Property Management' },
  { id: 'development', name: 'Development' },
  { id: 'investment', name: 'Investment' }
];

export default dealApi;