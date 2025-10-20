// Communications API service
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class CommunicationsApi {
  // Get all communications
  async getCommunications(params = {}) {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/communications?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Get specific communication
  async getCommunication(id) {
    const response = await fetch(`${API_BASE_URL}/communications/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Create new communication
  async createCommunication(communicationData) {
    const response = await fetch(`${API_BASE_URL}/communications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(communicationData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Update communication
  async updateCommunication(id, updateData) {
    const response = await fetch(`${API_BASE_URL}/communications/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Delete communication
  async deleteCommunication(id) {
    const response = await fetch(`${API_BASE_URL}/communications/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Email Templates
  async getEmailTemplates(category = null) {
    const params = category ? `?category=${category}` : '';
    const response = await fetch(`${API_BASE_URL}/communications/templates/email${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  async createEmailTemplate(templateData) {
    const response = await fetch(`${API_BASE_URL}/communications/templates/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // SMS Templates
  async getSmsTemplates(category = null) {
    const params = category ? `?category=${category}` : '';
    const response = await fetch(`${API_BASE_URL}/communications/templates/sms${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Send Email
  async sendEmail(emailData) {
    const response = await fetch(`${API_BASE_URL}/communications/send/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Send SMS
  async sendSms(smsData) {
    const response = await fetch(`${API_BASE_URL}/communications/send/sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(smsData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Send WhatsApp Message
  async sendWhatsApp(whatsappData) {
    const response = await fetch(`${API_BASE_URL}/communications/send/whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(whatsappData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Get Communication Analytics
  async getCommunicationAnalytics(timeframe = '7d') {
    const response = await fetch(`${API_BASE_URL}/communications/analytics/overview?timeframe=${timeframe}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Get communications by contact
  async getCommunicationsByContact(contactId, params = {}) {
    return this.getCommunications({ contactId, ...params });
  }

  // Get communications by type
  async getCommunicationsByType(type, params = {}) {
    return this.getCommunications({ type, ...params });
  }

  // Get recent communications
  async getRecentCommunications(limit = 10) {
    return this.getCommunications({ limit, offset: 0 });
  }
}

// Create and export singleton instance
const communicationsApi = new CommunicationsApi();
export default communicationsApi;
