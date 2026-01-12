import api from './api';

const notificationService = {
  getNotifications: async (params = {}) => {
    const { limit = 20, offset = 0, status, type } = params;
    const queryParams = new URLSearchParams({ limit, offset });
    if (status) queryParams.append('status', status);
    if (type) queryParams.append('type', type);
    
    const response = await api.get(`/notifications?${queryParams}`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data.count;
  },

  getNotification: async (id) => {
    const response = await api.get(`/notifications/${id}`);
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.patch(`/notifications/${id}`, { status: 'read' });
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.post('/notifications/mark-all-read');
    return response.data;
  },

  archiveNotification: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  }
};

export default notificationService;
