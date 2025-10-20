import api from './api';

export const debtApi = {
  getDebts: async (params = {}) => {
    try {
      const { propertyId, ...rest } = params;
      const queryString = new URLSearchParams(rest).toString();
      const base = propertyId ? `/properties/${propertyId}/debt` : '/debt';
      const url = `${base}${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching debt records:', error);
      throw error;
    }
  },

  getDebt: async (id) => {
    try {
      const response = await api.get(`/debt/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching debt record:', error);
      throw error;
    }
  },

  createDebt: async (debtData) => {
    try {
      const base = debtData?.propertyId ? `/properties/${debtData.propertyId}/debt` : '/debt';
      const response = await api.post(base, debtData);
      return response.data;
    } catch (error) {
      console.error('Error creating debt record:', error);
      throw error;
    }
  },

  updateDebt: async (id, debtData) => {
    try {
      const response = await api.put(`/debt/${id}`, debtData);
      return response.data;
    } catch (error) {
      console.error('Error updating debt record:', error);
      throw error;
    }
  },

  deleteDebt: async (id) => {
    try {
      const response = await api.delete(`/debt/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting debt record:', error);
      throw error;
    }
  },

  getMaturingDebts: async (days = 180) => {
    try {
      const response = await api.get(`/debt/maturing/soon?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching maturing debts:', error);
      throw error;
    }
  }
};

export default debtApi;
