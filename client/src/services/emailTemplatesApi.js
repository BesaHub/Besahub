import { apiService } from './api';

const EMAIL_TEMPLATES_ENDPOINTS = {
  GET_TEMPLATES: '/api/email-templates',
  GET_TEMPLATE: '/api/email-templates/:id',
  CREATE_TEMPLATE: '/api/email-templates',
  UPDATE_TEMPLATE: '/api/email-templates/:id',
  DELETE_TEMPLATE: '/api/email-templates/:id',
  SEND_TEMPLATE: '/api/email-templates/:id/send',
  PREVIEW_TEMPLATE: '/api/email-templates/:id/preview',
  GET_CATEGORIES: '/api/email-templates/categories',
  TRACK_EMAIL: '/api/email-templates/track/:trackingId'
};

// Default email templates for commercial real estate
const DEFAULT_TEMPLATES = [
  {
    id: 1,
    name: 'Initial Property Inquiry',
    category: 'inquiry',
    subject: 'Thank you for your interest in {{propertyName}}',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Thank you for your interest!</h2>
        <p>Dear {{firstName}},</p>
        <p>Thank you for your interest in <strong>{{propertyName}}</strong> located at {{propertyAddress}}.</p>
        <p>I'm excited to help you with your commercial real estate needs. Here are the key details:</p>
        <ul>
          <li><strong>Property Type:</strong> {{propertyType}}</li>
          <li><strong>Size:</strong> {{propertySize}} sq ft</li>
          <li><strong>Price:</strong> ${{propertyPrice}}</li>
          <li><strong>Status:</strong> {{propertyStatus}}</li>
        </ul>
        <p>I'll be in touch within 24 hours to discuss your requirements and schedule a property showing.</p>
        <p>Best regards,<br>{{agentName}}<br>{{agentPhone}}<br>{{agentEmail}}</p>
      </div>
    `,
    plainTextBody: `
      Thank you for your interest!
      
      Dear {{firstName}},
      
      Thank you for your interest in {{propertyName}} located at {{propertyAddress}}.
      
      I'm excited to help you with your commercial real estate needs. Here are the key details:
      - Property Type: {{propertyType}}
      - Size: {{propertySize}} sq ft
      - Price: ${{propertyPrice}}
      - Status: {{propertyStatus}}
      
      I'll be in touch within 24 hours to discuss your requirements and schedule a property showing.
      
      Best regards,
      {{agentName}}
      {{agentPhone}}
      {{agentEmail}}
    `,
    variables: ['firstName', 'propertyName', 'propertyAddress', 'propertyType', 'propertySize', 'propertyPrice', 'propertyStatus', 'agentName', 'agentPhone', 'agentEmail'],
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Follow-up After Showing',
    category: 'followup',
    subject: 'Follow-up: {{propertyName}} - Next Steps',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Thank you for the property showing</h2>
        <p>Dear {{firstName}},</p>
        <p>Thank you for taking the time to view <strong>{{propertyName}}</strong> yesterday. I hope you found the property interesting and it meets your requirements.</p>
        <p>As discussed, here are the next steps:</p>
        <ol>
          <li>Review the property details and financials</li>
          <li>Consider your budget and timeline</li>
          <li>Let me know if you have any additional questions</li>
        </ol>
        <p>I'm here to help with any questions you may have about the property, financing options, or the local market.</p>
        <p>Looking forward to hearing from you soon!</p>
        <p>Best regards,<br>{{agentName}}<br>{{agentPhone}}<br>{{agentEmail}}</p>
      </div>
    `,
    plainTextBody: `
      Thank you for the property showing
      
      Dear {{firstName}},
      
      Thank you for taking the time to view {{propertyName}} yesterday. I hope you found the property interesting and it meets your requirements.
      
      As discussed, here are the next steps:
      1. Review the property details and financials
      2. Consider your budget and timeline
      3. Let me know if you have any additional questions
      
      I'm here to help with any questions you may have about the property, financing options, or the local market.
      
      Looking forward to hearing from you soon!
      
      Best regards,
      {{agentName}}
      {{agentPhone}}
      {{agentEmail}}
    `,
    variables: ['firstName', 'propertyName', 'agentName', 'agentPhone', 'agentEmail'],
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    name: 'Market Update Newsletter',
    category: 'newsletter',
    subject: 'Commercial Real Estate Market Update - {{month}} {{year}}',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Market Update - {{month}} {{year}}</h2>
        <p>Dear {{firstName}},</p>
        <p>Here's your monthly commercial real estate market update:</p>
        
        <h3>Market Highlights</h3>
        <ul>
          <li>Average office lease rates: ${{officeRates}}/sq ft</li>
          <li>Industrial vacancy rate: {{industrialVacancy}}%</li>
          <li>Retail market trends: {{retailTrends}}</li>
        </ul>
        
        <h3>Featured Properties</h3>
        <p>Here are some properties that might interest you:</p>
        <ul>
          <li><strong>{{featuredProperty1}}</strong> - {{featuredProperty1Details}}</li>
          <li><strong>{{featuredProperty2}}</strong> - {{featuredProperty2Details}}</li>
        </ul>
        
        <p>If you're interested in any of these properties or have questions about the market, please don't hesitate to reach out.</p>
        <p>Best regards,<br>{{agentName}}<br>{{agentPhone}}<br>{{agentEmail}}</p>
      </div>
    `,
    plainTextBody: `
      Market Update - {{month}} {{year}}
      
      Dear {{firstName}},
      
      Here's your monthly commercial real estate market update:
      
      Market Highlights:
      - Average office lease rates: ${{officeRates}}/sq ft
      - Industrial vacancy rate: {{industrialVacancy}}%
      - Retail market trends: {{retailTrends}}
      
      Featured Properties:
      Here are some properties that might interest you:
      - {{featuredProperty1}} - {{featuredProperty1Details}}
      - {{featuredProperty2}} - {{featuredProperty2Details}}
      
      If you're interested in any of these properties or have questions about the market, please don't hesitate to reach out.
      
      Best regards,
      {{agentName}}
      {{agentPhone}}
      {{agentEmail}}
    `,
    variables: ['firstName', 'month', 'year', 'officeRates', 'industrialVacancy', 'retailTrends', 'featuredProperty1', 'featuredProperty1Details', 'featuredProperty2', 'featuredProperty2Details', 'agentName', 'agentPhone', 'agentEmail'],
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

class EmailTemplatesService {
  // Get all email templates
  async getTemplates(category = null) {
    try {
      const url = category 
        ? `${EMAIL_TEMPLATES_ENDPOINTS.GET_TEMPLATES}?category=${category}`
        : EMAIL_TEMPLATES_ENDPOINTS.GET_TEMPLATES;
      
      const response = await apiService.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching email templates:', error);
      // Return default templates if API fails
      return { templates: DEFAULT_TEMPLATES };
    }
  }

  // Get a specific template
  async getTemplate(templateId) {
    try {
      const response = await apiService.get(
        EMAIL_TEMPLATES_ENDPOINTS.GET_TEMPLATE.replace(':id', templateId)
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching email template:', error);
      // Return default template if API fails
      const template = DEFAULT_TEMPLATES.find(t => t.id === parseInt(templateId));
      return { template };
    }
  }

  // Create a new template
  async createTemplate(templateData) {
    try {
      const response = await apiService.post(
        EMAIL_TEMPLATES_ENDPOINTS.CREATE_TEMPLATE,
        templateData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating email template:', error);
      throw error;
    }
  }

  // Update a template
  async updateTemplate(templateId, templateData) {
    try {
      const response = await apiService.put(
        EMAIL_TEMPLATES_ENDPOINTS.UPDATE_TEMPLATE.replace(':id', templateId),
        templateData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating email template:', error);
      throw error;
    }
  }

  // Delete a template
  async deleteTemplate(templateId) {
    try {
      const response = await apiService.delete(
        EMAIL_TEMPLATES_ENDPOINTS.DELETE_TEMPLATE.replace(':id', templateId)
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting email template:', error);
      throw error;
    }
  }

  // Send a template
  async sendTemplate(templateId, recipients, variables = {}) {
    try {
      const response = await apiService.post(
        EMAIL_TEMPLATES_ENDPOINTS.SEND_TEMPLATE.replace(':id', templateId),
        { recipients, variables }
      );
      return response.data;
    } catch (error) {
      console.error('Error sending email template:', error);
      throw error;
    }
  }

  // Preview a template
  async previewTemplate(templateId, variables = {}) {
    try {
      const response = await apiService.post(
        EMAIL_TEMPLATES_ENDPOINTS.PREVIEW_TEMPLATE.replace(':id', templateId),
        { variables }
      );
      return response.data;
    } catch (error) {
      console.error('Error previewing email template:', error);
      throw error;
    }
  }

  // Get template categories
  async getCategories() {
    try {
      const response = await apiService.get(EMAIL_TEMPLATES_ENDPOINTS.GET_CATEGORIES);
      return response.data;
    } catch (error) {
      console.error('Error fetching template categories:', error);
      // Return default categories
      return { 
        categories: [
          { id: 'inquiry', name: 'Inquiry', description: 'Initial contact and inquiry templates' },
          { id: 'followup', name: 'Follow-up', description: 'Follow-up and nurturing templates' },
          { id: 'newsletter', name: 'Newsletter', description: 'Newsletter and market update templates' },
          { id: 'showing', name: 'Property Showing', description: 'Property showing related templates' },
          { id: 'closing', name: 'Closing', description: 'Deal closing and transaction templates' },
          { id: 'custom', name: 'Custom', description: 'Custom templates' }
        ]
      };
    }
  }

  // Track email opens/clicks
  async trackEmail(trackingId, event = 'open') {
    try {
      const response = await apiService.post(
        EMAIL_TEMPLATES_ENDPOINTS.TRACK_EMAIL.replace(':trackingId', trackingId),
        { event }
      );
      return response.data;
    } catch (error) {
      console.error('Error tracking email:', error);
      // Don't throw error for tracking failures
    }
  }

  // Replace variables in template content
  replaceVariables(content, variables) {
    let result = content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    });
    return result;
  }

  // Extract variables from template content
  extractVariables(content) {
    const regex = /{{(\w+)}}/g;
    const variables = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    return variables;
  }

  // Validate template data
  validateTemplate(templateData) {
    const errors = [];
    
    if (!templateData.name || templateData.name.trim() === '') {
      errors.push('Template name is required');
    }
    
    if (!templateData.subject || templateData.subject.trim() === '') {
      errors.push('Subject is required');
    }
    
    if (!templateData.htmlBody || templateData.htmlBody.trim() === '') {
      errors.push('HTML body is required');
    }
    
    if (!templateData.plainTextBody || templateData.plainTextBody.trim() === '') {
      errors.push('Plain text body is required');
    }
    
    return errors;
  }
}

export const emailTemplatesApi = new EmailTemplatesService();
export { DEFAULT_TEMPLATES };
