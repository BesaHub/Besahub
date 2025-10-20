import api from './api';

export const leaseApi = {
  getLeases: async (params = {}) => {
    try {
      const { propertyId, ...rest } = params;
      const queryString = new URLSearchParams(rest).toString();
      const base = propertyId ? `/properties/${propertyId}/leases` : '/leases';
      const url = `${base}${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching leases:', error);
      throw error;
    }
  },

  getLease: async (id) => {
    try {
      const response = await api.get(`/leases/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching lease:', error);
      throw error;
    }
  },

  createLease: async (leaseData) => {
    try {
      const base = leaseData?.propertyId ? `/properties/${leaseData.propertyId}/leases` : '/leases';
      const response = await api.post(base, leaseData);
      return response.data;
    } catch (error) {
      console.error('Error creating lease:', error);
      throw error;
    }
  },

  updateLease: async (id, leaseData) => {
    try {
      const response = await api.put(`/leases/${id}`, leaseData);
      return response.data;
    } catch (error) {
      console.error('Error updating lease:', error);
      throw error;
    }
  },

  deleteLease: async (id) => {
    try {
      const response = await api.delete(`/leases/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting lease:', error);
      throw error;
    }
  },

  getExpiringLeases: async (days = 90) => {
    try {
      const response = await api.get(`/leases/expiring/soon?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching expiring leases:', error);
      throw error;
    }
  }
};

export default leaseApi;
