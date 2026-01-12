import { api } from './api';

export const emailApi = {
  getEmailEvents: async (filters = {}) => {
    try {
      const { contactId, campaignId, eventType, page = 1, limit = 50 } = filters;
      
      const params = {
        page,
        limit
      };

      if (contactId) params.contactId = contactId;
      if (campaignId) params.campaignId = campaignId;
      if (eventType) params.eventType = eventType;

      const response = await api.get('/email/events', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching email events:', error);
      throw error;
    }
  },

  getSendGridStatus: async () => {
    try {
      const response = await api.get('/integrations/sendgrid/status');
      return response.data;
    } catch (error) {
      console.error('Error fetching SendGrid status:', error);
      throw error;
    }
  },

  exportEmailEventsCSV: (events) => {
    try {
      const headers = ['Event Type', 'Email', 'Timestamp', 'Campaign ID', 'Contact ID', 'Message ID'];
      const rows = events.map(event => [
        event.eventType || 'N/A',
        event.metadata?.email || 'N/A',
        event.eventTimestamp ? new Date(event.eventTimestamp).toLocaleString() : 'N/A',
        event.campaignId || 'N/A',
        event.contactId || 'N/A',
        event.messageId || 'N/A'
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `email-events-${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true };
    } catch (error) {
      console.error('Error exporting email events:', error);
      throw error;
    }
  }
};

export default emailApi;
