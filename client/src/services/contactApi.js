import api from './api';

// Contact API endpoints
export const contactApi = {
  // Get all contacts with filtering and pagination
  getContacts: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/contacts${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  },

  // Get single contact by ID
  getContact: async (id) => {
    try {
      const response = await api.get(`/contacts/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching contact:', error);
      throw error;
    }
  },

  // Create new contact
  createContact: async (contactData) => {
    try {
      const response = await api.post('/contacts', contactData);
      return response.data;
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  },

  // Update existing contact
  updateContact: async (id, contactData) => {
    try {
      const response = await api.put(`/contacts/${id}`, contactData);
      return response.data;
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  },

  // Delete contact
  deleteContact: async (id) => {
    try {
      const response = await api.delete(`/contacts/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }
};

// Investor-specific API endpoints
export const investorApi = {
  // Get investor database
  getInvestors: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/investors${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching investors:', error);
      throw error;
    }
  },

  // Find matching properties/investors
  findMatches: async (matchData) => {
    try {
      const response = await api.post('/investors/match', matchData);
      return response.data;
    } catch (error) {
      console.error('Error finding matches:', error);
      throw error;
    }
  },

  // Distribute offering to investors
  distributeOffering: async (distributionData) => {
    try {
      const response = await api.post('/investors/distribute', distributionData);
      return response.data;
    } catch (error) {
      console.error('Error distributing offering:', error);
      throw error;
    }
  },

  // Get engagement metrics
  getEngagement: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/investors/engagement${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching engagement data:', error);
      throw error;
    }
  },

  // Update investor criteria
  updateCriteria: async (id, criteria) => {
    try {
      const response = await api.put(`/investors/${id}/criteria`, criteria);
      return response.data;
    } catch (error) {
      console.error('Error updating investor criteria:', error);
      throw error;
    }
  },

  // Upload contact avatar
  uploadAvatar: async (id, formData) => {
    try {
      const response = await api.post(`/contacts/${id}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  },

  // Remove contact avatar
  removeAvatar: async (id) => {
    try {
      const response = await api.delete(`/contacts/${id}/avatar`);
      return response.data;
    } catch (error) {
      console.error('Error removing avatar:', error);
      throw error;
    }
  }
};

export default contactApi;