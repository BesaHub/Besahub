// Calendar API service
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class CalendarApi {
  // Get all calendars
  async getCalendars() {
    const response = await fetch(`${API_BASE_URL}/calendar`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Get specific calendar
  async getCalendar(id) {
    const response = await fetch(`${API_BASE_URL}/calendar/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Create new calendar
  async createCalendar(calendarData) {
    const response = await fetch(`${API_BASE_URL}/calendar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendarData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Update calendar
  async updateCalendar(id, updateData) {
    const response = await fetch(`${API_BASE_URL}/calendar/${id}`, {
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

  // Delete calendar
  async deleteCalendar(id) {
    const response = await fetch(`${API_BASE_URL}/calendar/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Get events for a calendar
  async getCalendarEvents(calendarId, params = {}) {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/calendar/${calendarId}/events?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Get all events across all calendars
  async getAllEvents(params = {}) {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/calendar/events/all?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Create event in calendar
  async createEvent(calendarId, eventData) {
    const response = await fetch(`${API_BASE_URL}/calendar/${calendarId}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Get upcoming events and tasks
  async getUpcoming(days = 7, limit = 10) {
    const response = await fetch(`${API_BASE_URL}/calendar/upcoming?days=${days}&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Get calendar analytics
  async getCalendarAnalytics(timeframe = '30d') {
    const response = await fetch(`${API_BASE_URL}/calendar/analytics/overview?timeframe=${timeframe}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Sync calendar
  async syncCalendar(calendarId) {
    const response = await fetch(`${API_BASE_URL}/calendar/sync/${calendarId}`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Connect external calendar
  async connectCalendar(type, credentials) {
    const response = await fetch(`${API_BASE_URL}/calendar/connect/${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Get events for date range
  async getEventsForDateRange(startDate, endDate, calendarId = null) {
    const params = {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    };
    
    if (calendarId) {
      params.calendarId = calendarId;
    }
    
    return this.getAllEvents(params);
  }

  // Get today's events
  async getTodaysEvents() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    return this.getEventsForDateRange(startOfDay, endOfDay);
  }

  // Get this week's events
  async getThisWeeksEvents() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    return this.getEventsForDateRange(startOfWeek, endOfWeek);
  }

  // Get events by type
  async getEventsByType(type) {
    return this.getAllEvents({ type });
  }

  // Get connected calendars
  async getConnectedCalendars() {
    const response = await this.getCalendars();
    return {
      ...response,
      data: response.data.filter(cal => cal.isConnected)
    };
  }

  // Get primary calendar
  async getPrimaryCalendar() {
    const response = await this.getCalendars();
    const primaryCalendar = response.data.find(cal => cal.isPrimary);
    
    if (!primaryCalendar) {
      throw new Error('No primary calendar found');
    }
    
    return {
      success: true,
      data: primaryCalendar
    };
  }
}

// Create and export singleton instance
const calendarApi = new CalendarApi();
export default calendarApi;