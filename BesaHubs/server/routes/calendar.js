const express = require('express');
const router = express.Router();

// Mock calendar data
let calendars = [
  {
    id: 'cal_1',
    name: 'Primary Calendar',
    type: 'google',
    color: '#4285f4',
    isPrimary: true,
    isConnected: true,
    lastSync: new Date().toISOString(),
    events: []
  },
  {
    id: 'cal_2',
    name: 'Work Calendar',
    type: 'outlook',
    color: '#0078d4',
    isPrimary: false,
    isConnected: true,
    lastSync: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    events: []
  },
  {
    id: 'cal_3',
    name: 'Personal Calendar',
    type: 'apple',
    color: '#34c759',
    isPrimary: false,
    isConnected: false,
    lastSync: null,
    events: []
  }
];

let events = [
  {
    id: 'event_1',
    calendarId: 'cal_1',
    title: 'Property Viewing - Downtown Office',
    description: 'Showing 123 Business Ave to potential client',
    start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    end: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
    allDay: false,
    location: '123 Business Ave, Downtown',
    attendees: [
      { email: 'client@example.com', name: 'John Smith', status: 'accepted' },
      { email: 'agent@besahub.com', name: 'Sarah Johnson', status: 'accepted' }
    ],
    type: 'property_viewing',
    status: 'confirmed',
    reminder: 15, // minutes
    isRecurring: false,
    metadata: {
      propertyId: 'prop_123',
      contactId: 'contact_456',
      dealId: 'deal_789'
    }
  },
  {
    id: 'event_2',
    calendarId: 'cal_1',
    title: 'Client Meeting - Investment Discussion',
    description: 'Discussing investment opportunities with high-value client',
    start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
    end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // tomorrow + 1 hour
    allDay: false,
    location: 'BesaHub Office - Conference Room A',
    attendees: [
      { email: 'investor@example.com', name: 'Michael Chen', status: 'tentative' },
      { email: 'agent@besahub.com', name: 'Sarah Johnson', status: 'accepted' }
    ],
    type: 'client_meeting',
    status: 'tentative',
    reminder: 30,
    isRecurring: false,
    metadata: {
      contactId: 'contact_789',
      dealId: 'deal_456',
      priority: 'high'
    }
  },
  {
    id: 'event_3',
    calendarId: 'cal_2',
    title: 'Team Standup',
    description: 'Daily team standup meeting',
    start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // next week
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), // next week + 30 min
    allDay: false,
    location: 'Virtual - Zoom',
    attendees: [
      { email: 'team@besahub.com', name: 'BesaHub Team', status: 'accepted' }
    ],
    type: 'team_meeting',
    status: 'confirmed',
    reminder: 10,
    isRecurring: true,
    recurrence: {
      frequency: 'weekly',
      days: ['monday', 'wednesday', 'friday']
    },
    metadata: {
      teamId: 'team_123'
    }
  },
  {
    id: 'event_4',
    calendarId: 'cal_1',
    title: 'Property Inspection',
    description: 'Annual property inspection for 456 Commercial Blvd',
    start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // 3 days + 2 hours
    allDay: false,
    location: '456 Commercial Blvd, Business District',
    attendees: [
      { email: 'inspector@example.com', name: 'David Wilson', status: 'accepted' },
      { email: 'agent@besahub.com', name: 'Sarah Johnson', status: 'accepted' }
    ],
    type: 'property_inspection',
    status: 'confirmed',
    reminder: 60,
    isRecurring: false,
    metadata: {
      propertyId: 'prop_456',
      inspectionType: 'annual'
    }
  }
];

let upcomingTasks = [
  {
    id: 'task_1',
    title: 'Follow up with John Smith',
    description: 'Call client about downtown office space interest',
    dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
    priority: 'high',
    type: 'follow_up',
    status: 'pending',
    contactId: 'contact_456',
    propertyId: 'prop_123',
    assignedTo: 'agent_1',
    metadata: {
      reminderSent: false,
      lastContact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  },
  {
    id: 'task_2',
    title: 'Prepare investment proposal',
    description: 'Create investment proposal for Michael Chen',
    dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
    priority: 'high',
    type: 'proposal',
    status: 'in_progress',
    contactId: 'contact_789',
    dealId: 'deal_456',
    assignedTo: 'agent_1',
    metadata: {
      progress: 60,
      template: 'investment_proposal_v2'
    }
  },
  {
    id: 'task_3',
    title: 'Schedule property photos',
    description: 'Arrange professional photography for new listing',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    priority: 'medium',
    type: 'marketing',
    status: 'pending',
    propertyId: 'prop_789',
    assignedTo: 'agent_1',
    metadata: {
      photographer: 'photographer_123',
      estimatedDuration: 120
    }
  },
  {
    id: 'task_4',
    title: 'Review lease agreement',
    description: 'Review lease terms for 789 Industrial Way',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    priority: 'medium',
    type: 'legal',
    status: 'pending',
    propertyId: 'prop_789',
    dealId: 'deal_123',
    assignedTo: 'agent_1',
    metadata: {
      legalReview: true,
      clientApproval: false
    }
  }
];

// GET /calendars - Get all calendars
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      data: calendars
    });
  } catch (error) {
    console.error('Error fetching calendars:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// GET /upcoming - Get upcoming events and tasks
router.get('/upcoming', async (req, res) => {
  try {
    const { days = 7, limit = 10 } = req.query;
    
    const now = new Date();
    const futureDate = new Date(now.getTime() + parseInt(days) * 24 * 60 * 60 * 1000);
    
    // Get upcoming events
    const upcomingEvents = events
      .filter(event => {
        const eventStart = new Date(event.start);
        return eventStart >= now && eventStart <= futureDate;
      })
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, parseInt(limit));
    
    // Get upcoming tasks
    const upcomingTasksFiltered = upcomingTasks
      .filter(task => {
        const taskDue = new Date(task.dueDate);
        return taskDue >= now && taskDue <= futureDate;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        events: upcomingEvents,
        tasks: upcomingTasksFiltered,
        summary: {
          totalEvents: upcomingEvents.length,
          totalTasks: upcomingTasksFiltered.length,
          highPriorityTasks: upcomingTasksFiltered.filter(task => task.priority === 'high').length,
          confirmedEvents: upcomingEvents.filter(event => event.status === 'confirmed').length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching upcoming items:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// GET /calendars/:id - Get specific calendar
router.get('/:id', async (req, res) => {
  try {
    const calendar = calendars.find(cal => cal.id === req.params.id);
    
    if (!calendar) {
      return res.status(404).json({ error: 'Calendar not found' });
    }
    
    res.json({
      success: true,
      data: calendar
    });
  } catch (error) {
    console.error('Error fetching calendar:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// POST /calendars - Create new calendar
router.post('/', async (req, res) => {
  try {
    const { name, type, color, isPrimary } = req.body;
    
    const newCalendar = {
      id: `cal_${Date.now()}`,
      name,
      type,
      color: color || '#4285f4',
      isPrimary: isPrimary || false,
      isConnected: false,
      lastSync: null,
      events: []
    };
    
    calendars.push(newCalendar);
    
    res.status(201).json({
      success: true,
      data: newCalendar
    });
  } catch (error) {
    console.error('Error creating calendar:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// PUT /calendars/:id - Update calendar
router.put('/:id', async (req, res) => {
  try {
    const calendarIndex = calendars.findIndex(cal => cal.id === req.params.id);
    
    if (calendarIndex === -1) {
      return res.status(404).json({ error: 'Calendar not found' });
    }
    
    calendars[calendarIndex] = {
      ...calendars[calendarIndex],
      ...req.body,
      id: req.params.id
    };
    
    res.json({
      success: true,
      data: calendars[calendarIndex]
    });
  } catch (error) {
    console.error('Error updating calendar:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// DELETE /calendars/:id - Delete calendar
router.delete('/:id', async (req, res) => {
  try {
    const calendarIndex = calendars.findIndex(cal => cal.id === req.params.id);
    
    if (calendarIndex === -1) {
      return res.status(404).json({ error: 'Calendar not found' });
    }
    
    calendars.splice(calendarIndex, 1);
    
    res.json({
      success: true,
      message: 'Calendar deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting calendar:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// GET /calendars/:id/events - Get events for a calendar
router.get('/:id/events', async (req, res) => {
  try {
    const { start, end, type } = req.query;
    
    let calendarEvents = events.filter(event => event.calendarId === req.params.id);
    
    if (start) {
      calendarEvents = calendarEvents.filter(event => new Date(event.start) >= new Date(start));
    }
    
    if (end) {
      calendarEvents = calendarEvents.filter(event => new Date(event.end) <= new Date(end));
    }
    
    if (type) {
      calendarEvents = calendarEvents.filter(event => event.type === type);
    }
    
    res.json({
      success: true,
      data: calendarEvents
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// POST /calendars/:id/events - Create event in calendar
router.post('/:id/events', async (req, res) => {
  try {
    const { title, description, start, end, allDay, location, attendees, type, reminder, metadata } = req.body;
    
    const newEvent = {
      id: `event_${Date.now()}`,
      calendarId: req.params.id,
      title,
      description,
      start,
      end,
      allDay: allDay || false,
      location,
      attendees: attendees || [],
      type: type || 'meeting',
      status: 'confirmed',
      reminder: reminder || 15,
      isRecurring: false,
      metadata: metadata || {}
    };
    
    events.push(newEvent);
    
    res.status(201).json({
      success: true,
      data: newEvent
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// GET /events - Get all events across all calendars
router.get('/events/all', async (req, res) => {
  try {
    const { start, end, type, calendarId } = req.query;
    
    let filteredEvents = events;
    
    if (start) {
      filteredEvents = filteredEvents.filter(event => new Date(event.start) >= new Date(start));
    }
    
    if (end) {
      filteredEvents = filteredEvents.filter(event => new Date(event.end) <= new Date(end));
    }
    
    if (type) {
      filteredEvents = filteredEvents.filter(event => event.type === type);
    }
    
    if (calendarId) {
      filteredEvents = filteredEvents.filter(event => event.calendarId === calendarId);
    }
    
    // Sort by start time
    filteredEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
    
    res.json({
      success: true,
      data: filteredEvents
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// GET /analytics - Get calendar analytics
router.get('/analytics/overview', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    const now = new Date();
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const recentEvents = events.filter(event => 
      new Date(event.start) >= startDate
    );
    
    const analytics = {
      totalEvents: recentEvents.length,
      byType: {
        property_viewing: recentEvents.filter(event => event.type === 'property_viewing').length,
        client_meeting: recentEvents.filter(event => event.type === 'client_meeting').length,
        team_meeting: recentEvents.filter(event => event.type === 'team_meeting').length,
        property_inspection: recentEvents.filter(event => event.type === 'property_inspection').length
      },
      byStatus: {
        confirmed: recentEvents.filter(event => event.status === 'confirmed').length,
        tentative: recentEvents.filter(event => event.status === 'tentative').length,
        cancelled: recentEvents.filter(event => event.status === 'cancelled').length
      },
      byCalendar: calendars.map(cal => ({
        id: cal.id,
        name: cal.name,
        eventCount: recentEvents.filter(event => event.calendarId === cal.id).length
      })),
      upcomingThisWeek: events.filter(event => {
        const eventStart = new Date(event.start);
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return eventStart >= now && eventStart <= weekFromNow;
      }).length,
      taskCompletion: {
        total: upcomingTasks.length,
        completed: upcomingTasks.filter(task => task.status === 'completed').length,
        pending: upcomingTasks.filter(task => task.status === 'pending').length,
        inProgress: upcomingTasks.filter(task => task.status === 'in_progress').length
      }
    };
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching calendar analytics:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// POST /sync/:id - Sync calendar
router.post('/sync/:id', async (req, res) => {
  try {
    const calendar = calendars.find(cal => cal.id === req.params.id);
    
    if (!calendar) {
      return res.status(404).json({ error: 'Calendar not found' });
    }
    
    // Simulate sync process
    calendar.lastSync = new Date().toISOString();
    calendar.isConnected = true;
    
    res.json({
      success: true,
      data: {
        message: 'Calendar synced successfully',
        lastSync: calendar.lastSync,
        eventsSynced: Math.floor(Math.random() * 20) + 5
      }
    });
  } catch (error) {
    console.error('Error syncing calendar:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// POST /connect/:type - Connect external calendar
router.post('/connect/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { name, credentials } = req.body;
    
    // Simulate connection process
    const newCalendar = {
      id: `cal_${Date.now()}`,
      name: name || `${type.charAt(0).toUpperCase() + type.slice(1)} Calendar`,
      type,
      color: type === 'google' ? '#4285f4' : type === 'outlook' ? '#0078d4' : '#34c759',
      isPrimary: false,
      isConnected: true,
      lastSync: new Date().toISOString(),
      events: []
    };
    
    calendars.push(newCalendar);
    
    res.json({
      success: true,
      data: {
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} calendar connected successfully`,
        calendar: newCalendar
      }
    });
  } catch (error) {
    console.error('Error connecting calendar:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

module.exports = router;