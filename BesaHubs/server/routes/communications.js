const express = require('express');
const router = express.Router();

// Mock communication data
let communications = [
  {
    id: 'comm_1',
    contactId: 'contact_1',
    type: 'email',
    direction: 'outbound',
    subject: 'Property Inquiry - Downtown Office Space',
    content: 'Hi John, I wanted to follow up on your interest in the downtown office space. The property is still available and I can schedule a viewing for you this week.',
    status: 'sent',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    metadata: {
      emailId: 'email_123',
      opened: true,
      clicked: false,
      replied: false
    }
  },
  {
    id: 'comm_2',
    contactId: 'contact_1',
    type: 'call',
    direction: 'inbound',
    subject: 'Phone Call',
    content: 'Client called to discuss property requirements. Interested in 2000+ sq ft office space in downtown area. Budget: $50-75/sq ft.',
    status: 'completed',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    metadata: {
      duration: 15, // minutes
      recordingUrl: '/recordings/call_123.mp3',
      transcription: 'Client interested in downtown office space, 2000+ sq ft, budget $50-75/sq ft. Wants to schedule viewing.',
      outcome: 'positive'
    }
  },
  {
    id: 'comm_3',
    contactId: 'contact_2',
    type: 'sms',
    direction: 'outbound',
    subject: 'SMS',
    content: 'Hi Sarah, your property viewing is confirmed for tomorrow at 2 PM. Address: 123 Business Ave. See you there!',
    status: 'delivered',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    metadata: {
      messageId: 'sms_456',
      delivered: true,
      read: true
    }
  },
  {
    id: 'comm_4',
    contactId: 'contact_3',
    type: 'whatsapp',
    direction: 'inbound',
    subject: 'WhatsApp Message',
    content: 'Hi! I saw your listing for the retail space on Main St. Is it still available? What are the lease terms?',
    status: 'received',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    metadata: {
      messageId: 'wa_789',
      read: true,
      replied: false
    }
  }
];

let emailTemplates = [
  {
    id: 'template_1',
    name: 'Property Inquiry Follow-up',
    subject: 'Following up on your property inquiry',
    content: `Hi {{contactName}},

Thank you for your interest in {{propertyName}}. I wanted to follow up and see if you have any questions about the property.

Key details:
- Size: {{propertySize}}
- Price: {{propertyPrice}}
- Location: {{propertyLocation}}

I'm available to schedule a viewing at your convenience. Please let me know your preferred time.

Best regards,
{{agentName}}`,
    category: 'follow-up',
    variables: ['contactName', 'propertyName', 'propertySize', 'propertyPrice', 'propertyLocation', 'agentName']
  },
  {
    id: 'template_2',
    name: 'Meeting Confirmation',
    subject: 'Meeting Confirmation - {{propertyName}}',
    content: `Hi {{contactName}},

This is to confirm our meeting for {{propertyName}} on {{meetingDate}} at {{meetingTime}}.

Meeting Details:
- Property: {{propertyName}}
- Address: {{propertyAddress}}
- Date: {{meetingDate}}
- Time: {{meetingTime}}
- Duration: {{meetingDuration}}

Please let me know if you need to reschedule.

Best regards,
{{agentName}}`,
    category: 'scheduling',
    variables: ['contactName', 'propertyName', 'propertyAddress', 'meetingDate', 'meetingTime', 'meetingDuration', 'agentName']
  }
];

let smsTemplates = [
  {
    id: 'sms_1',
    name: 'Quick Follow-up',
    content: 'Hi {{contactName}}, following up on your interest in {{propertyName}}. Available for questions! - {{agentName}}',
    category: 'follow-up'
  },
  {
    id: 'sms_2',
    name: 'Meeting Reminder',
    content: 'Reminder: Property viewing tomorrow at {{meetingTime}} for {{propertyName}}. Address: {{propertyAddress}} - {{agentName}}',
    category: 'reminder'
  }
];

// GET /communications - Get all communications
router.get('/', async (req, res) => {
  try {
    const { contactId, type, status, limit = 50, offset = 0 } = req.query;
    
    let filteredCommunications = communications;
    
    if (contactId) {
      filteredCommunications = filteredCommunications.filter(comm => comm.contactId === contactId);
    }
    
    if (type) {
      filteredCommunications = filteredCommunications.filter(comm => comm.type === type);
    }
    
    if (status) {
      filteredCommunications = filteredCommunications.filter(comm => comm.status === status);
    }
    
    // Sort by timestamp (newest first)
    filteredCommunications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Pagination
    const paginatedCommunications = filteredCommunications.slice(
      parseInt(offset), 
      parseInt(offset) + parseInt(limit)
    );
    
    res.json({
      success: true,
      data: paginatedCommunications,
      pagination: {
        total: filteredCommunications.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < filteredCommunications.length
      }
    });
  } catch (error) {
    console.error('Error fetching communications:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// GET /communications/:id - Get specific communication
router.get('/:id', async (req, res) => {
  try {
    const communication = communications.find(comm => comm.id === req.params.id);
    
    if (!communication) {
      return res.status(404).json({ error: 'Communication not found' });
    }
    
    res.json({
      success: true,
      data: communication
    });
  } catch (error) {
    console.error('Error fetching communication:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// POST /communications - Create new communication
router.post('/', async (req, res) => {
  try {
    const { contactId, type, direction, subject, content, metadata = {} } = req.body;
    
    const newCommunication = {
      id: `comm_${Date.now()}`,
      contactId,
      type,
      direction,
      subject,
      content,
      status: 'pending',
      timestamp: new Date().toISOString(),
      metadata
    };
    
    communications.unshift(newCommunication);
    
    res.status(201).json({
      success: true,
      data: newCommunication
    });
  } catch (error) {
    console.error('Error creating communication:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// PUT /communications/:id - Update communication
router.put('/:id', async (req, res) => {
  try {
    const communicationIndex = communications.findIndex(comm => comm.id === req.params.id);
    
    if (communicationIndex === -1) {
      return res.status(404).json({ error: 'Communication not found' });
    }
    
    communications[communicationIndex] = {
      ...communications[communicationIndex],
      ...req.body,
      id: req.params.id // Ensure ID doesn't change
    };
    
    res.json({
      success: true,
      data: communications[communicationIndex]
    });
  } catch (error) {
    console.error('Error updating communication:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// DELETE /communications/:id - Delete communication
router.delete('/:id', async (req, res) => {
  try {
    const communicationIndex = communications.findIndex(comm => comm.id === req.params.id);
    
    if (communicationIndex === -1) {
      return res.status(404).json({ error: 'Communication not found' });
    }
    
    communications.splice(communicationIndex, 1);
    
    res.json({
      success: true,
      message: 'Communication deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting communication:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// GET /communications/templates/email - Get email templates
router.get('/templates/email', async (req, res) => {
  try {
    const { category } = req.query;
    
    let filteredTemplates = emailTemplates;
    
    if (category) {
      filteredTemplates = filteredTemplates.filter(template => template.category === category);
    }
    
    res.json({
      success: true,
      data: filteredTemplates
    });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// POST /communications/templates/email - Create email template
router.post('/templates/email', async (req, res) => {
  try {
    const { name, subject, content, category, variables = [] } = req.body;
    
    const newTemplate = {
      id: `template_${Date.now()}`,
      name,
      subject,
      content,
      category,
      variables,
      createdAt: new Date().toISOString()
    };
    
    emailTemplates.push(newTemplate);
    
    res.status(201).json({
      success: true,
      data: newTemplate
    });
  } catch (error) {
    console.error('Error creating email template:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// GET /communications/templates/sms - Get SMS templates
router.get('/templates/sms', async (req, res) => {
  try {
    const { category } = req.query;
    
    let filteredTemplates = smsTemplates;
    
    if (category) {
      filteredTemplates = filteredTemplates.filter(template => template.category === category);
    }
    
    res.json({
      success: true,
      data: filteredTemplates
    });
  } catch (error) {
    console.error('Error fetching SMS templates:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// POST /communications/send/email - Send email
router.post('/send/email', async (req, res) => {
  try {
    const { to, subject, content, templateId, variables = {} } = req.body;
    
    // Simulate email sending
    const emailId = `email_${Date.now()}`;
    
    const newCommunication = {
      id: `comm_${Date.now()}`,
      contactId: req.body.contactId,
      type: 'email',
      direction: 'outbound',
      subject,
      content,
      status: 'sent',
      timestamp: new Date().toISOString(),
      metadata: {
        emailId,
        to,
        templateId,
        variables,
        opened: false,
        clicked: false,
        replied: false
      }
    };
    
    communications.unshift(newCommunication);
    
    res.json({
      success: true,
      data: {
        messageId: emailId,
        status: 'sent',
        communication: newCommunication
      }
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// POST /communications/send/sms - Send SMS
router.post('/send/sms', async (req, res) => {
  try {
    const { to, content, templateId, variables = {} } = req.body;
    
    // Simulate SMS sending
    const messageId = `sms_${Date.now()}`;
    
    const newCommunication = {
      id: `comm_${Date.now()}`,
      contactId: req.body.contactId,
      type: 'sms',
      direction: 'outbound',
      subject: 'SMS',
      content,
      status: 'sent',
      timestamp: new Date().toISOString(),
      metadata: {
        messageId,
        to,
        templateId,
        variables,
        delivered: true,
        read: false
      }
    };
    
    communications.unshift(newCommunication);
    
    res.json({
      success: true,
      data: {
        messageId,
        status: 'sent',
        communication: newCommunication
      }
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// POST /communications/send/whatsapp - Send WhatsApp message
router.post('/send/whatsapp', async (req, res) => {
  try {
    const { to, content, templateId, variables = {} } = req.body;
    
    // Simulate WhatsApp sending
    const messageId = `wa_${Date.now()}`;
    
    const newCommunication = {
      id: `comm_${Date.now()}`,
      contactId: req.body.contactId,
      type: 'whatsapp',
      direction: 'outbound',
      subject: 'WhatsApp Message',
      content,
      status: 'sent',
      timestamp: new Date().toISOString(),
      metadata: {
        messageId,
        to,
        templateId,
        variables,
        delivered: true,
        read: false
      }
    };
    
    communications.unshift(newCommunication);
    
    res.json({
      success: true,
      data: {
        messageId,
        status: 'sent',
        communication: newCommunication
      }
    });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// GET /communications/analytics - Get communication analytics
router.get('/analytics/overview', async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const recentCommunications = communications.filter(comm => 
      new Date(comm.timestamp) >= startDate
    );
    
    const analytics = {
      totalCommunications: recentCommunications.length,
      byType: {
        email: recentCommunications.filter(comm => comm.type === 'email').length,
        call: recentCommunications.filter(comm => comm.type === 'call').length,
        sms: recentCommunications.filter(comm => comm.type === 'sms').length,
        whatsapp: recentCommunications.filter(comm => comm.type === 'whatsapp').length
      },
      byDirection: {
        inbound: recentCommunications.filter(comm => comm.direction === 'inbound').length,
        outbound: recentCommunications.filter(comm => comm.direction === 'outbound').length
      },
      responseRate: {
        email: {
          sent: recentCommunications.filter(comm => comm.type === 'email' && comm.direction === 'outbound').length,
          replied: recentCommunications.filter(comm => comm.type === 'email' && comm.direction === 'inbound').length
        }
      },
      dailyActivity: generateDailyActivity(recentCommunications, days)
    };
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching communication analytics:', error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// Helper function to generate daily activity
function generateDailyActivity(communications, days) {
  const activity = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayCommunications = communications.filter(comm => 
      comm.timestamp.startsWith(dateStr)
    );
    
    activity.push({
      date: dateStr,
      total: dayCommunications.length,
      email: dayCommunications.filter(comm => comm.type === 'email').length,
      call: dayCommunications.filter(comm => comm.type === 'call').length,
      sms: dayCommunications.filter(comm => comm.type === 'sms').length,
      whatsapp: dayCommunications.filter(comm => comm.type === 'whatsapp').length
    });
  }
  
  return activity;
}

module.exports = router;