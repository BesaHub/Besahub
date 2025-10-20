const express = require('express');
const router = express.Router();

// Mock email templates storage (in production, this would be in database)
let emailTemplates = [
  {
    id: 1,
    name: 'Initial Property Inquiry',
    category: 'inquiry',
    subject: 'Thank you for your interest in {{propertyName}}',
    htmlBody: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
      '<h2 style="color: #1976d2;">Thank you for your interest!</h2>' +
      '<p>Dear {{firstName}},</p>' +
      '<p>Thank you for your interest in <strong>{{propertyName}}</strong> located at {{propertyAddress}}.</p>' +
      '<p>I\'m excited to help you with your commercial real estate needs. Here are the key details:</p>' +
      '<ul>' +
      '<li><strong>Property Type:</strong> {{propertyType}}</li>' +
      '<li><strong>Size:</strong> {{propertySize}} sq ft</li>' +
      '<li><strong>Price:</strong> ${{propertyPrice}}</li>' +
      '<li><strong>Status:</strong> {{propertyStatus}}</li>' +
      '</ul>' +
      '<p>I\'ll be in touch within 24 hours to discuss your requirements and schedule a property showing.</p>' +
      '<p>Best regards,<br>{{agentName}}<br>{{agentPhone}}<br>{{agentEmail}}</p>' +
      '</div>',
    plainTextBody: 'Thank you for your interest!\n\n' +
      'Dear {{firstName}},\n\n' +
      'Thank you for your interest in {{propertyName}} located at {{propertyAddress}}.\n\n' +
      'I\'m excited to help you with your commercial real estate needs. Here are the key details:\n' +
      '- Property Type: {{propertyType}}\n' +
      '- Size: {{propertySize}} sq ft\n' +
      '- Price: ${{propertyPrice}}\n' +
      '- Status: {{propertyStatus}}\n\n' +
      'I\'ll be in touch within 24 hours to discuss your requirements and schedule a property showing.\n\n' +
      'Best regards,\n' +
      '{{agentName}}\n' +
      '{{agentPhone}}\n' +
      '{{agentEmail}}',
    variables: ['firstName', 'propertyName', 'propertyAddress', 'propertyType', 'propertySize', 'propertyPrice', 'propertyStatus', 'agentName', 'agentPhone', 'agentEmail'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Follow-up After Showing',
    category: 'followup',
    subject: 'Follow-up: {{propertyName}} - Next Steps',
    htmlBody: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
      '<h2 style="color: #1976d2;">Thank you for the property showing</h2>' +
      '<p>Dear {{firstName}},</p>' +
      '<p>Thank you for taking the time to view <strong>{{propertyName}}</strong> yesterday. I hope you found the property interesting and it meets your requirements.</p>' +
      '<p>As discussed, here are the next steps:</p>' +
      '<ol>' +
      '<li>Review the property details and financials</li>' +
      '<li>Consider your budget and timeline</li>' +
      '<li>Let me know if you have any additional questions</li>' +
      '</ol>' +
      '<p>I\'m here to help with any questions you may have about the property, financing options, or the local market.</p>' +
      '<p>Looking forward to hearing from you soon!</p>' +
      '<p>Best regards,<br>{{agentName}}<br>{{agentPhone}}<br>{{agentEmail}}</p>' +
      '</div>',
    plainTextBody: 'Thank you for the property showing\n\n' +
      'Dear {{firstName}},\n\n' +
      'Thank you for taking the time to view {{propertyName}} yesterday. I hope you found the property interesting and it meets your requirements.\n\n' +
      'As discussed, here are the next steps:\n' +
      '1. Review the property details and financials\n' +
      '2. Consider your budget and timeline\n' +
      '3. Let me know if you have any additional questions\n\n' +
      'I\'m here to help with any questions you may have about the property, financing options, or the local market.\n\n' +
      'Looking forward to hearing from you soon!\n\n' +
      'Best regards,\n' +
      '{{agentName}}\n' +
      '{{agentPhone}}\n' +
      '{{agentEmail}}',
    variables: ['firstName', 'propertyName', 'agentName', 'agentPhone', 'agentEmail'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Mock email tracking data
const emailTracking = {};

// Helper function to replace variables in content
const replaceVariables = (content, variables) => {
  let result = content;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
  });
  return result;
};

// Helper function to extract variables from content
const extractVariables = (content) => {
  const regex = /{{(\w+)}}/g;
  const variables = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  return variables;
};

// GET /api/email-templates - Get all email templates
router.get('/email-templates', async (req, res) => {
  try {
    const { category } = req.query;
    
    let filteredTemplates = emailTemplates;
    if (category) {
      filteredTemplates = emailTemplates.filter(template => template.category === category);
    }

    res.json({
      success: true,
      templates: filteredTemplates,
      total: filteredTemplates.length
    });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/email-templates/categories - Get template categories
router.get('/email-templates/categories', async (req, res) => {
  try {
    const categories = [
      { id: 'inquiry', name: 'Inquiry', description: 'Initial contact and inquiry templates' },
      { id: 'followup', name: 'Follow-up', description: 'Follow-up and nurturing templates' },
      { id: 'newsletter', name: 'Newsletter', description: 'Newsletter and market update templates' },
      { id: 'showing', name: 'Property Showing', description: 'Property showing related templates' },
      { id: 'closing', name: 'Closing', description: 'Deal closing and transaction templates' },
      { id: 'custom', name: 'Custom', description: 'Custom templates' }
    ];

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching template categories:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/email-templates/:id - Get a specific template
router.get('/email-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = emailTemplates.find(t => t.id === parseInt(id));

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Error fetching email template:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/email-templates - Create a new template
router.post('/email-templates', async (req, res) => {
  try {
    const templateData = req.body;
    
    // Validate required fields
    if (!templateData.name || !templateData.subject || !templateData.htmlBody) {
      return res.status(400).json({ error: 'Name, subject, and HTML body are required' });
    }

    // Extract variables from content
    const htmlVariables = extractVariables(templateData.htmlBody);
    const subjectVariables = extractVariables(templateData.subject);
    const plainTextVariables = templateData.plainTextBody ? extractVariables(templateData.plainTextBody) : [];
    
    // Combine all variables
    const allVariables = [...new Set([...htmlVariables, ...subjectVariables, ...plainTextVariables])];

    const newTemplate = {
      id: Date.now(), // Mock ID generation
      name: templateData.name,
      category: templateData.category || 'custom',
      subject: templateData.subject,
      htmlBody: templateData.htmlBody,
      plainTextBody: templateData.plainTextBody || '',
      variables: allVariables,
      isActive: templateData.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    emailTemplates.push(newTemplate);

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      template: newTemplate
    });
  } catch (error) {
    console.error('Error creating email template:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/email-templates/:id - Update a template
router.put('/email-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const templateData = req.body;
    
    const templateIndex = emailTemplates.findIndex(t => t.id === parseInt(id));
    
    if (templateIndex === -1) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Extract variables from content
    const htmlVariables = extractVariables(templateData.htmlBody);
    const subjectVariables = extractVariables(templateData.subject);
    const plainTextVariables = templateData.plainTextBody ? extractVariables(templateData.plainTextBody) : [];
    
    // Combine all variables
    const allVariables = [...new Set([...htmlVariables, ...subjectVariables, ...plainTextVariables])];

    const updatedTemplate = {
      ...emailTemplates[templateIndex],
      name: templateData.name,
      category: templateData.category,
      subject: templateData.subject,
      htmlBody: templateData.htmlBody,
      plainTextBody: templateData.plainTextBody,
      variables: allVariables,
      isActive: templateData.isActive,
      updatedAt: new Date().toISOString()
    };

    emailTemplates[templateIndex] = updatedTemplate;

    res.json({
      success: true,
      message: 'Template updated successfully',
      template: updatedTemplate
    });
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/email-templates/:id - Delete a template
router.delete('/email-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const templateIndex = emailTemplates.findIndex(t => t.id === parseInt(id));
    
    if (templateIndex === -1) {
      return res.status(404).json({ error: 'Template not found' });
    }

    emailTemplates.splice(templateIndex, 1);

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting email template:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/email-templates/:id/send - Send a template
router.post('/email-templates/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    const { recipients, variables = {} } = req.body;
    
    const template = emailTemplates.find(t => t.id === parseInt(id));
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (!recipients || recipients.length === 0) {
      return res.status(400).json({ error: 'Recipients are required' });
    }

    // Replace variables in template
    const processedSubject = replaceVariables(template.subject, variables);
    const processedHtmlBody = replaceVariables(template.htmlBody, variables);
    const processedPlainTextBody = replaceVariables(template.plainTextBody, variables);

    // Mock email sending
    const emailResults = recipients.map(recipient => {
      const trackingId = `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store tracking data
      emailTracking[trackingId] = {
        templateId: parseInt(id),
        recipient: recipient.email,
        subject: processedSubject,
        sentAt: new Date().toISOString(),
        opens: 0,
        clicks: 0,
        status: 'sent'
      };

      return {
        recipient: recipient.email,
        trackingId,
        status: 'sent'
      };
    });

    res.json({
      success: true,
      message: 'Emails sent successfully',
      results: emailResults,
      template: {
        subject: processedSubject,
        htmlBody: processedHtmlBody,
        plainTextBody: processedPlainTextBody
      }
    });
  } catch (error) {
    console.error('Error sending email template:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/email-templates/:id/preview - Preview a template
router.post('/email-templates/:id/preview', async (req, res) => {
  try {
    const { id } = req.params;
    const { variables = {} } = req.body;
    
    const template = emailTemplates.find(t => t.id === parseInt(id));
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Replace variables in template
    const processedSubject = replaceVariables(template.subject, variables);
    const processedHtmlBody = replaceVariables(template.htmlBody, variables);
    const processedPlainTextBody = replaceVariables(template.plainTextBody, variables);

    res.json({
      success: true,
      preview: {
        subject: processedSubject,
        htmlBody: processedHtmlBody,
        plainTextBody: processedPlainTextBody
      }
    });
  } catch (error) {
    console.error('Error previewing email template:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/email-templates/track/:trackingId - Track email events
router.post('/email-templates/track/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { event } = req.body;
    
    if (emailTracking[trackingId]) {
      if (event === 'open') {
        emailTracking[trackingId].opens += 1;
      } else if (event === 'click') {
        emailTracking[trackingId].clicks += 1;
      }
    }

    res.json({
      success: true,
      message: 'Event tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking email event:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
