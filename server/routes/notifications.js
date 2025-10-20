const express = require('express');
const router = express.Router();

// Mock notification data
let notifications = [
  {
    id: 'notif_1',
    type: 'urgent',
    title: 'High-Priority Lead Response',
    message: 'John Smith responded to your property inquiry - immediate follow-up recommended',
    category: 'lead',
    priority: 'high',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    read: false,
    actionRequired: true,
    relatedEntity: {
      type: 'contact',
      id: 'contact_123',
      name: 'John Smith'
    },
    actions: [
      { label: 'View Contact', action: 'view_contact', url: '/contacts/contact_123' },
      { label: 'Send Follow-up', action: 'send_email', url: '/communications?contact=contact_123' }
    ],
    metadata: {
      leadScore: 85,
      lastActivity: '2 hours ago',
      responseTime: '15 minutes'
    }
  },
  {
    id: 'notif_2',
    type: 'info',
    title: 'Property Viewing Scheduled',
    message: 'Property viewing for Downtown Office Space scheduled for tomorrow at 2:00 PM',
    category: 'calendar',
    priority: 'medium',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    read: false,
    actionRequired: false,
    relatedEntity: {
      type: 'event',
      id: 'event_456',
      name: 'Property Viewing - Downtown Office'
    },
    actions: [
      { label: 'View Event', action: 'view_event', url: '/calendar/event_456' },
      { label: 'Prepare Materials', action: 'prepare', url: '/properties/property_789' }
    ],
    metadata: {
      eventType: 'property_viewing',
      attendees: 2,
      location: '123 Business Ave'
    }
  },
  {
    id: 'notif_3',
    type: 'warning',
    title: 'Task Overdue',
    message: 'Follow up with Michael Chen is now overdue - was due 2 hours ago',
    category: 'task',
    priority: 'high',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    read: false,
    actionRequired: true,
    relatedEntity: {
      type: 'task',
      id: 'task_789',
      name: 'Follow up with Michael Chen'
    },
    actions: [
      { label: 'Complete Task', action: 'complete_task', url: '/tasks/task_789' },
      { label: 'Reschedule', action: 'reschedule', url: '/tasks/task_789/edit' }
    ],
    metadata: {
      taskType: 'follow_up',
      dueDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      contactName: 'Michael Chen'
    }
  },
  {
    id: 'notif_4',
    type: 'success',
    title: 'Deal Progress Update',
    message: 'Investment proposal for Commercial Plaza has been accepted - next steps required',
    category: 'deal',
    priority: 'high',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    read: true,
    actionRequired: true,
    relatedEntity: {
      type: 'deal',
      id: 'deal_101',
      name: 'Commercial Plaza Investment'
    },
    actions: [
      { label: 'View Deal', action: 'view_deal', url: '/deals/deal_101' },
      { label: 'Next Steps', action: 'next_steps', url: '/deals/deal_101/next-steps' }
    ],
    metadata: {
      dealValue: 2500000,
      stage: 'proposal_accepted',
      probability: 0.85
    }
  },
  {
    id: 'notif_5',
    type: 'info',
    title: 'Market Alert',
    message: 'New comparable property listed in Downtown area - may affect your active deals',
    category: 'market',
    priority: 'medium',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    read: true,
    actionRequired: false,
    relatedEntity: {
      type: 'property',
      id: 'property_202',
      name: 'New Downtown Listing'
    },
    actions: [
      { label: 'View Property', action: 'view_property', url: '/properties/property_202' },
      { label: 'Compare', action: 'compare', url: '/analytics/comparison' }
    ],
    metadata: {
      listingPrice: 1800000,
      pricePerSqft: 1200,
      marketImpact: 'positive'
    }
  }
];

let notificationSettings = {
  email: {
    enabled: true,
    immediate: ['urgent', 'high_priority'],
    daily: ['info', 'medium_priority'],
    weekly: ['low_priority']
  },
  push: {
    enabled: true,
    categories: ['lead', 'task', 'deal'],
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00'
    }
  },
  sms: {
    enabled: false,
    categories: ['urgent'],
    phoneNumber: '+1234567890'
  },
  inApp: {
    enabled: true,
    sound: true,
    desktop: true
  }
};

// GET /notifications - Get all notifications
router.get('/', async (req, res) => {
  try {
    const { limit = 50, unreadOnly = false, category, priority } = req.query;
    
    let filteredNotifications = notifications;
    
    if (unreadOnly === 'true') {
      filteredNotifications = filteredNotifications.filter(notif => !notif.read);
    }
    
    if (category) {
      filteredNotifications = filteredNotifications.filter(notif => notif.category === category);
    }
    
    if (priority) {
      filteredNotifications = filteredNotifications.filter(notif => notif.priority === priority);
    }
    
    // Sort by timestamp (newest first)
    filteredNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply limit
    filteredNotifications = filteredNotifications.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: filteredNotifications,
      summary: {
        total: notifications.length,
        unread: notifications.filter(notif => !notif.read).length,
        urgent: notifications.filter(notif => notif.priority === 'high').length,
        actionRequired: notifications.filter(notif => notif.actionRequired).length
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// GET /notifications/unread - Get unread notifications count
router.get('/unread', async (req, res) => {
  try {
    const unreadCount = notifications.filter(notif => !notif.read).length;
    const urgentCount = notifications.filter(notif => !notif.read && notif.priority === 'high').length;
    const actionRequiredCount = notifications.filter(notif => !notif.read && notif.actionRequired).length;
    
    res.json({
      success: true,
      data: {
        unread: unreadCount,
        urgent: urgentCount,
        actionRequired: actionRequiredCount
      }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// PUT /notifications/:id/read - Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = notifications.find(notif => notif.id === req.params.id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    notification.read = true;
    notification.readAt = new Date().toISOString();
    
    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// PUT /notifications/read-all - Mark all notifications as read
router.put('/read-all', async (req, res) => {
  try {
    notifications.forEach(notif => {
      if (!notif.read) {
        notif.read = true;
        notif.readAt = new Date().toISOString();
      }
    });
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// DELETE /notifications/:id - Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const notificationIndex = notifications.findIndex(notif => notif.id === req.params.id);
    
    if (notificationIndex === -1) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    notifications.splice(notificationIndex, 1);
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// POST /notifications - Create new notification
router.post('/', async (req, res) => {
  try {
    const { type, title, message, category, priority, relatedEntity, actions, metadata } = req.body;
    
    const newNotification = {
      id: `notif_${Date.now()}`,
      type,
      title,
      message,
      category,
      priority: priority || 'medium',
      timestamp: new Date().toISOString(),
      read: false,
      actionRequired: false,
      relatedEntity,
      actions: actions || [],
      metadata: metadata || {}
    };
    
    notifications.unshift(newNotification); // Add to beginning
    
    res.status(201).json({
      success: true,
      data: newNotification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// GET /notifications/settings - Get notification settings
router.get('/settings', async (req, res) => {
  try {
    res.json({
      success: true,
      data: notificationSettings
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// PUT /notifications/settings - Update notification settings
router.put('/settings', async (req, res) => {
  try {
    notificationSettings = {
      ...notificationSettings,
      ...req.body
    };
    
    res.json({
      success: true,
      data: notificationSettings
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// POST /notifications/test - Send test notification
router.post('/test', async (req, res) => {
  try {
    const { type = 'info', category = 'system' } = req.body;
    
    const testNotification = {
      id: `notif_test_${Date.now()}`,
      type,
      title: 'Test Notification',
      message: 'This is a test notification to verify your notification settings',
      category,
      priority: 'medium',
      timestamp: new Date().toISOString(),
      read: false,
      actionRequired: false,
      relatedEntity: null,
      actions: [
        { label: 'Dismiss', action: 'dismiss', url: '#' }
      ],
      metadata: {
        test: true
      }
    };
    
    notifications.unshift(testNotification);
    
    res.json({
      success: true,
      data: testNotification,
      message: 'Test notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// GET /notifications/analytics - Get notification analytics
router.get('/analytics', async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    
    const now = new Date();
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const recentNotifications = notifications.filter(notif => 
      new Date(notif.timestamp) >= startDate
    );
    
    const analytics = {
      total: recentNotifications.length,
      byType: {
        urgent: recentNotifications.filter(notif => notif.type === 'urgent').length,
        info: recentNotifications.filter(notif => notif.type === 'info').length,
        warning: recentNotifications.filter(notif => notif.type === 'warning').length,
        success: recentNotifications.filter(notif => notif.type === 'success').length
      },
      byCategory: {
        lead: recentNotifications.filter(notif => notif.category === 'lead').length,
        task: recentNotifications.filter(notif => notif.category === 'task').length,
        deal: recentNotifications.filter(notif => notif.category === 'deal').length,
        calendar: recentNotifications.filter(notif => notif.category === 'calendar').length,
        market: recentNotifications.filter(notif => notif.category === 'market').length
      },
      byPriority: {
        high: recentNotifications.filter(notif => notif.priority === 'high').length,
        medium: recentNotifications.filter(notif => notif.priority === 'medium').length,
        low: recentNotifications.filter(notif => notif.priority === 'low').length
      },
      readRate: recentNotifications.length > 0 ? 
        (recentNotifications.filter(notif => notif.read).length / recentNotifications.length * 100).toFixed(1) : 0,
      actionRequired: recentNotifications.filter(notif => notif.actionRequired).length,
      responseTime: {
        average: '2.5 hours',
        median: '1.8 hours'
      }
    };
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching notification analytics:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

module.exports = router;