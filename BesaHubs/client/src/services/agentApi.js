import api from './api';

export const agentApi = {
  getAgents: async (params = {}) => {
    try {
      const queryParams = {
        ...params,
        role: params.role || undefined,
        department: params.department || undefined,
        isActive: params.isActive !== undefined ? params.isActive : undefined
      };
      
      Object.keys(queryParams).forEach(key => 
        queryParams[key] === undefined && delete queryParams[key]
      );
      
      const queryString = new URLSearchParams(queryParams).toString();
      const url = `/users${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching agents:', error);
      throw error;
    }
  },

  getAgentById: async (id) => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching agent:', error);
      throw error;
    }
  },

  getAgentDashboard: async (id) => {
    try {
      const response = await api.get(`/users/${id}/dashboard`);
      return response.data;
    } catch (error) {
      console.error('Error fetching agent dashboard:', error);
      throw error;
    }
  },

  getAgentPerformance: async (id, params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/users/${id}/dashboard${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching agent performance:', error);
      throw error;
    }
  }
};

export default agentApi;
