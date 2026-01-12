// Notifications API service
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class NotificationsApi {
  // Get all notifications
  async getNotifications(params = {}) {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/notifications?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Get unread notifications count
  async getUnreadCount() {
    const response = await fetch(`${API_BASE_URL}/notifications/unread`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Mark all notifications as read
  async markAllAsRead() {
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'PUT',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Delete notification
  async deleteNotification(notificationId) {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Create new notification
  async createNotification(notificationData) {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Get notification settings
  async getSettings() {
    const response = await fetch(`${API_BASE_URL}/notifications/settings`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Update notification settings
  async updateSettings(settings) {
    const response = await fetch(`${API_BASE_URL}/notifications/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Send test notification
  async sendTestNotification(type = 'info', category = 'system') {
    const response = await fetch(`${API_BASE_URL}/notifications/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, category }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Get notification analytics
  async getAnalytics(timeframe = '7d') {
    const response = await fetch(`${API_BASE_URL}/notifications/analytics?timeframe=${timeframe}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Get notifications by category
  async getNotificationsByCategory(category, limit = 20) {
    return this.getNotifications({ category, limit });
  }

  // Get urgent notifications
  async getUrgentNotifications() {
    return this.getNotifications({ priority: 'high', limit: 10 });
  }

  // Get action required notifications
  async getActionRequiredNotifications() {
    const response = await this.getNotifications({ limit: 50 });
    return {
      ...response,
      data: response.data.filter(notif => notif.actionRequired)
    };
  }

  // Subscribe to real-time notifications (WebSocket)
  subscribeToNotifications(callback) {
    // In a real implementation, this would use WebSocket
    // For now, we'll simulate with polling
    const interval = setInterval(async () => {
      try {
        const unreadResponse = await this.getUnreadCount();
        callback(unreadResponse.data);
      } catch (error) {
        console.error('Error polling notifications:', error);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }

  // Create notification for specific events
  async createLeadNotification(contactId, contactName, message) {
    return this.createNotification({
      type: 'info',
      title: 'New Lead Activity',
      message: `${contactName}: ${message}`,
      category: 'lead',
      priority: 'medium',
      relatedEntity: {
        type: 'contact',
        id: contactId,
        name: contactName,
        url: `/contacts/${contactId}`
      },
      actions: [
        { label: 'View Contact', action: 'view_contact', url: `/contacts/${contactId}` },
        { label: 'Send Email', action: 'send_email', url: `/communications?contact=${contactId}` }
      ]
    });
  }

  async createTaskNotification(taskId, taskTitle, message, priority = 'medium') {
    return this.createNotification({
      type: priority === 'high' ? 'warning' : 'info',
      title: 'Task Update',
      message: `${taskTitle}: ${message}`,
      category: 'task',
      priority,
      relatedEntity: {
        type: 'task',
        id: taskId,
        name: taskTitle,
        url: `/tasks/${taskId}`
      },
      actions: [
        { label: 'View Task', action: 'view_task', url: `/tasks/${taskId}` },
        { label: 'Complete', action: 'complete_task', url: `/tasks/${taskId}/complete` }
      ]
    });
  }

  async createDealNotification(dealId, dealName, message, type = 'info') {
    return this.createNotification({
      type,
      title: 'Deal Update',
      message: `${dealName}: ${message}`,
      category: 'deal',
      priority: type === 'success' ? 'high' : 'medium',
      relatedEntity: {
        type: 'deal',
        id: dealId,
        name: dealName,
        url: `/deals/${dealId}`
      },
      actions: [
        { label: 'View Deal', action: 'view_deal', url: `/deals/${dealId}` },
        { label: 'Update Stage', action: 'update_stage', url: `/deals/${dealId}/update` }
      ]
    });
  }

  async createCalendarNotification(eventId, eventTitle, message) {
    return this.createNotification({
      type: 'info',
      title: 'Calendar Event',
      message: `${eventTitle}: ${message}`,
      category: 'calendar',
      priority: 'medium',
      relatedEntity: {
        type: 'event',
        id: eventId,
        name: eventTitle,
        url: `/calendar/event/${eventId}`
      },
      actions: [
        { label: 'View Event', action: 'view_event', url: `/calendar/event/${eventId}` },
        { label: 'Join Meeting', action: 'join_meeting', url: `/calendar/event/${eventId}/join` }
      ]
    });
  }

  async createMarketNotification(propertyId, propertyName, message) {
    return this.createNotification({
      type: 'info',
      title: 'Market Update',
      message: `${propertyName}: ${message}`,
      category: 'market',
      priority: 'medium',
      relatedEntity: {
        type: 'property',
        id: propertyId,
        name: propertyName,
        url: `/properties/${propertyId}`
      },
      actions: [
        { label: 'View Property', action: 'view_property', url: `/properties/${propertyId}` },
        { label: 'Market Analysis', action: 'market_analysis', url: `/analytics/market/${propertyId}` }
      ]
    });
  }

  // Bulk operations
  async markMultipleAsRead(notificationIds) {
    const promises = notificationIds.map(id => this.markAsRead(id));
    return Promise.all(promises);
  }

  async deleteMultiple(notificationIds) {
    const promises = notificationIds.map(id => this.deleteNotification(id));
    return Promise.all(promises);
  }

  // Get notification preferences for user
  async getUserPreferences() {
    const settings = await this.getSettings();
    return {
      email: settings.email.enabled,
      push: settings.push.enabled,
      sms: settings.sms.enabled,
      categories: settings.push.categories,
      quietHours: settings.push.quietHours
    };
  }

  // Update user preferences
  async updateUserPreferences(preferences) {
    const currentSettings = await this.getSettings();
    const updatedSettings = {
      ...currentSettings,
      email: { ...currentSettings.email, enabled: preferences.email },
      push: { 
        ...currentSettings.push, 
        enabled: preferences.push,
        categories: preferences.categories || currentSettings.push.categories
      },
      sms: { ...currentSettings.sms, enabled: preferences.sms }
    };
    
    return this.updateSettings(updatedSettings);
  }
}

// Create and export singleton instance
const notificationsApi = new NotificationsApi();
export default notificationsApi;
