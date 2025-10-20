const express = require('express');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const crypto = require('crypto');

const { User, Contact, Property, Deal, Activity } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { appLogger } = require('../config/logger');

const router = express.Router();

// POST /api/integrations/twilio/call - Make a call via Twilio
router.post('/twilio/call', authMiddleware, [
  body('to').isMobilePhone().withMessage('Valid phone number is required'),
  body('contactId').optional().isUUID().withMessage('Invalid contact ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return res.status(503).json({ error: 'Twilio not configured' });
    }

    const { to, contactId } = req.body;
    const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    // Make the call
    const call = await twilio.calls.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
      twiml: `<Response><Say>Hello! This is a call from ${req.user.firstName} ${req.user.lastName} from the CRE CRM system. Please hold while we connect you.</Say><Dial>${req.user.phone || process.env.TWILIO_PHONE_NUMBER}</Dial></Response>`
    });

    // Log the call activity
    if (contactId) {
      await Activity.createCall({
        contactName: 'Contact',
        duration: null,
        outcome: 'initiated',
        direction: 'outbound',
        userId: req.user.id,
        contactId,
        followUpRequired: false
      });
    }

    res.json({
      success: true,
      callSid: call.sid,
      status: call.status
    });
  } catch (error) {
    appLogger.error('Twilio call error:', error);
    next(error);
  }
});

// POST /api/integrations/twilio/sms - Send SMS via Twilio
router.post('/twilio/sms', authMiddleware, [
  body('to').isMobilePhone().withMessage('Valid phone number is required'),
  body('message').trim().isLength({ min: 1, max: 1600 }).withMessage('Message is required and must be under 1600 characters'),
  body('contactId').optional().isUUID().withMessage('Invalid contact ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return res.status(503).json({ error: 'Twilio not configured' });
    }

    const { to, message, contactId } = req.body;
    const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    // Send SMS
    const sms = await twilio.messages.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
      body: message
    });

    // Log the SMS activity
    if (contactId) {
      await Activity.create({
        type: 'other',
        title: 'SMS Sent',
        description: message,
        direction: 'outbound',
        communicationMethod: 'text',
        userId: req.user.id,
        contactId
      });
    }

    res.json({
      success: true,
      messageSid: sms.sid,
      status: sms.status
    });
  } catch (error) {
    appLogger.error('Twilio SMS error:', error);
    next(error);
  }
});

// POST /api/integrations/mailchimp/sync-contact - Sync contact to Mailchimp
router.post('/mailchimp/sync-contact', authMiddleware, [
  body('contactId').isUUID().withMessage('Valid contact ID is required'),
  body('listId').optional().isString().withMessage('List ID must be string')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    if (!process.env.MAILCHIMP_API_KEY) {
      return res.status(503).json({ error: 'Mailchimp not configured' });
    }

    const { contactId, listId } = req.body;
    const contact = await Contact.findByPk(contactId);

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    if (!contact.primaryEmail) {
      return res.status(400).json({ error: 'Contact must have an email address' });
    }

    const mailchimpListId = listId || process.env.MAILCHIMP_LIST_ID;
    const apiKey = process.env.MAILCHIMP_API_KEY;
    const datacenter = apiKey.split('-')[1];

    const mailchimpData = {
      email_address: contact.primaryEmail,
      status: 'subscribed',
      merge_fields: {
        FNAME: contact.firstName || '',
        LNAME: contact.lastName || '',
        COMPANY: contact.companyName || '',
        PHONE: contact.primaryPhone || ''
      },
      tags: contact.tags || []
    };

    const response = await axios.post(
      `https://${datacenter}.api.mailchimp.com/3.0/lists/${mailchimpListId}/members`,
      mailchimpData,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      mailchimpId: response.data.id,
      status: response.data.status
    });
  } catch (error) {
    appLogger.error('Mailchimp sync error:', error);
    if (error.response?.data) {
      return res.status(400).json({ error: error.response.data.detail });
    }
    next(error);
  }
});

// POST /api/integrations/google-maps/geocode - Geocode address
router.post('/google-maps/geocode', authMiddleware, [
  body('address').trim().isLength({ min: 1 }).withMessage('Address is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return res.status(503).json({ error: 'Google Maps not configured' });
    }

    const { address } = req.body;
    
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      const location = result.geometry.location;
      
      res.json({
        success: true,
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: result.formatted_address,
        placeId: result.place_id
      });
    } else {
      res.status(400).json({ error: 'Address not found' });
    }
  } catch (error) {
    appLogger.error('Google Maps geocoding error:', error);
    next(error);
  }
});

// POST /api/integrations/slack/notify - Send Slack notification
router.post('/slack/notify', authMiddleware, adminMiddleware, [
  body('channel').optional().isString().withMessage('Channel must be string'),
  body('message').trim().isLength({ min: 1 }).withMessage('Message is required'),
  body('type').isIn(['deal_closed', 'new_lead', 'property_listed', 'task_overdue', 'custom']).withMessage('Invalid notification type')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    if (!process.env.SLACK_BOT_TOKEN) {
      return res.status(503).json({ error: 'Slack not configured' });
    }

    const { channel, message, type } = req.body;
    const slackChannel = channel || '#general';
    
    const slackMessage = {
      channel: slackChannel,
      text: message,
      username: 'CRE CRM Bot',
      icon_emoji: ':house:',
      attachments: [{
        color: type === 'deal_closed' ? 'good' : (type === 'task_overdue' ? 'danger' : 'warning'),
        footer: 'CRE CRM System',
        ts: Math.floor(Date.now() / 1000)
      }]
    };

    const response = await axios.post(
      'https://slack.com/api/chat.postMessage',
      slackMessage,
      {
        headers: {
          'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.ok) {
      res.json({ success: true, timestamp: response.data.ts });
    } else {
      res.status(400).json({ error: response.data.error });
    }
  } catch (error) {
    appLogger.error('Slack notification error:', error);
    next(error);
  }
});

// GET /api/integrations/mls/search - Search MLS listings
router.get('/mls/search', authMiddleware, [
  body('city').optional().isString().withMessage('City must be string'),
  body('state').optional().isString().withMessage('State must be string'),
  body('propertyType').optional().isString().withMessage('Property type must be string'),
  body('minPrice').optional().isNumeric().withMessage('Min price must be numeric'),
  body('maxPrice').optional().isNumeric().withMessage('Max price must be numeric')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    if (!process.env.MLS_API_KEY || !process.env.MLS_API_URL) {
      return res.status(503).json({ error: 'MLS integration not configured' });
    }

    const { city, state, propertyType, minPrice, maxPrice } = req.query;
    
    // This is a placeholder - actual MLS API integration would depend on the specific MLS provider
    const mlsParams = {
      city,
      state,
      property_type: propertyType,
      min_price: minPrice,
      max_price: maxPrice,
      api_key: process.env.MLS_API_KEY
    };

    try {
      const response = await axios.get(process.env.MLS_API_URL, {
        params: mlsParams,
        timeout: 10000
      });

      res.json({
        success: true,
        listings: response.data.listings || [],
        totalCount: response.data.total_count || 0
      });
    } catch (apiError) {
      appLogger.error('MLS API error:', apiError);
      res.status(502).json({ error: 'MLS service unavailable' });
    }
  } catch (error) {
    appLogger.error('MLS search error:', error);
    next(error);
  }
});

// POST /api/integrations/quickbooks/sync-contact - Sync contact to QuickBooks
router.post('/quickbooks/sync-contact', authMiddleware, adminMiddleware, [
  body('contactId').isUUID().withMessage('Valid contact ID is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    if (!process.env.QB_CLIENT_ID || !process.env.QB_CLIENT_SECRET) {
      return res.status(503).json({ error: 'QuickBooks not configured' });
    }

    const { contactId } = req.body;
    const contact = await Contact.findByPk(contactId);

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // This is a placeholder for QuickBooks integration
    // Actual implementation would require OAuth flow and QuickBooks API calls
    const customerData = {
      Name: contact.getDisplayName(),
      CompanyName: contact.companyName,
      PrimaryEmailAddr: contact.primaryEmail ? { Address: contact.primaryEmail } : null,
      PrimaryPhone: contact.primaryPhone ? { FreeFormNumber: contact.primaryPhone } : null,
      BillAddr: contact.getFullAddress() ? {
        Line1: contact.mailingAddress,
        City: contact.mailingCity,
        CountrySubDivisionCode: contact.mailingState,
        PostalCode: contact.mailingZipCode
      } : null
    };

    // Placeholder response - actual QB integration would create customer
    res.json({
      success: true,
      quickbooksId: `qb_${contact.id}`,
      message: 'Contact synced to QuickBooks (placeholder)'
    });
  } catch (error) {
    appLogger.error('QuickBooks sync error:', error);
    next(error);
  }
});

// POST /api/integrations/docusign/send-envelope - Send document for e-signature
router.post('/docusign/send-envelope', authMiddleware, [
  body('documentId').isUUID().withMessage('Valid document ID is required'),
  body('signers').isArray().withMessage('Signers must be an array'),
  body('signers.*.email').isEmail().withMessage('Each signer must have valid email'),
  body('signers.*.name').notEmpty().withMessage('Each signer must have a name')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    if (!process.env.DOCUSIGN_CLIENT_ID || !process.env.DOCUSIGN_CLIENT_SECRET) {
      return res.status(503).json({ error: 'DocuSign not configured' });
    }

    const { documentId, signers, subject } = req.body;
    
    // This is a placeholder for DocuSign integration
    // Actual implementation would require DocuSign API authentication and envelope creation
    const envelopeId = `env_${Date.now()}`;
    
    // Update document with e-signature info
    const document = await Document.findByPk(documentId);
    if (document) {
      await document.update({
        eSignatureStatus: 'pending',
        eSignatureEnvelopeId: envelopeId,
        signers: signers.map(signer => ({
          ...signer,
          status: 'pending',
          signedAt: null
        }))
      });
    }

    res.json({
      success: true,
      envelopeId,
      status: 'sent',
      message: 'Document sent for signature (placeholder)'
    });
  } catch (error) {
    appLogger.error('DocuSign send error:', error);
    next(error);
  }
});

// POST /api/integrations/sendgrid/webhook - Handle SendGrid webhook events
router.post('/sendgrid/webhook', async (req, res, next) => {
  try {
    const { normalizeEvent, extractCustomArgs } = require('../services/email/mapWebhook');
    const { EmailEvent, Campaign } = require('../models');
    const config = require('../config/environment');

    const events = Array.isArray(req.body) ? req.body : [req.body];
    
    if (config.sendgrid.webhookSigningKey) {
      const signature = req.headers['x-twilio-email-event-webhook-signature'];
      const timestamp = req.headers['x-twilio-email-event-webhook-timestamp'];
      
      if (signature && timestamp) {
        const payload = JSON.stringify(req.body);
        const expectedSignature = crypto
          .createHmac('sha256', config.sendgrid.webhookSigningKey)
          .update(timestamp + payload)
          .digest('base64');
        
        if (signature !== expectedSignature) {
          appLogger.warn('SendGrid webhook signature verification failed');
          return res.status(403).json({ error: 'Invalid webhook signature' });
        }
      }
    }

    appLogger.info('Received SendGrid webhook events', { 
      count: events.length,
      eventTypes: events.map(e => e.event)
    });

    const processedEvents = [];
    const io = req.app.get('io');

    for (const sendgridEvent of events) {
      try {
        const customArgs = extractCustomArgs(sendgridEvent);
        const mergedEvent = { ...sendgridEvent, ...customArgs };
        
        const normalizedEvent = await normalizeEvent(mergedEvent);

        const [emailEvent, created] = await EmailEvent.upsert({
          ...normalizedEvent,
          id: undefined
        }, {
          returning: true
        });

        processedEvents.push({
          messageId: normalizedEvent.messageId,
          eventType: normalizedEvent.eventType,
          created
        });

        if (normalizedEvent.campaignId) {
          const campaign = await Campaign.findByPk(normalizedEvent.campaignId);
          
          if (campaign) {
            const updateFields = {};
            if (normalizedEvent.eventType === 'open') {
              updateFields.openedCount = (campaign.openedCount || 0) + 1;
            } else if (normalizedEvent.eventType === 'click') {
              updateFields.clickedCount = (campaign.clickedCount || 0) + 1;
            } else if (normalizedEvent.eventType === 'bounce') {
              updateFields.bouncedCount = (campaign.bouncedCount || 0) + 1;
            } else if (normalizedEvent.eventType === 'unsubscribe') {
              updateFields.unsubscribedCount = (campaign.unsubscribedCount || 0) + 1;
            }

            if (Object.keys(updateFields).length > 0) {
              await campaign.update(updateFields);
            }

            if (io && campaign.createdById) {
              io.to(`user:${campaign.createdById}`).emit('email:event', {
                event: emailEvent.toJSON(),
                campaignId: normalizedEvent.campaignId,
                timestamp: new Date()
              });
            }
          }
        }

        if (io && normalizedEvent.contactId) {
          io.emit('email:event', {
            event: emailEvent.toJSON(),
            contactId: normalizedEvent.contactId,
            timestamp: new Date()
          });
        }

      } catch (eventError) {
        appLogger.error('Failed to process SendGrid webhook event', {
          error: eventError.message,
          event: sendgridEvent
        });
      }
    }

    appLogger.info('Processed SendGrid webhook events', {
      total: events.length,
      processed: processedEvents.length
    });

    res.status(200).json({ 
      success: true,
      processed: processedEvents.length 
    });

  } catch (error) {
    appLogger.error('SendGrid webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// GET /api/integrations/sendgrid/status - Get SendGrid integration status
router.get('/sendgrid/status', authMiddleware, async (req, res, next) => {
  try {
    const { isSendGridEnabled, getDefaultFrom } = require('../services/email/sendgridClient');
    const config = require('../config/environment');

    if (!isSendGridEnabled()) {
      return res.json({
        enabled: false,
        configured: false,
        message: 'SendGrid integration is not enabled'
      });
    }

    const defaultFrom = getDefaultFrom();
    const templates = config.sendgrid.templates || {};
    const webhookUrl = `${config.publicUrls.apiBaseUrl}/api/integrations/sendgrid/webhook`;

    res.json({
      enabled: true,
      configured: true,
      fromEmail: defaultFrom.email,
      fromName: defaultFrom.name,
      templates: {
        invite: templates.invite || null,
        passwordReset: templates.passwordReset || null,
        propertyPromo: templates.propertyPromo || null
      },
      webhookUrl,
      webhookSigningConfigured: !!config.sendgrid.webhookSigningKey
    });

  } catch (error) {
    appLogger.error('SendGrid status error:', error);
    next(error);
  }
});

// GET /api/integrations/status - Get integration status
router.get('/status', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { isSendGridEnabled } = require('../services/email/sendgridClient');
    
    const integrationStatus = {
      sendgrid: {
        configured: isSendGridEnabled(),
        services: ['email', 'campaigns', 'transactional']
      },
      twilio: {
        configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
        services: ['voice', 'sms']
      },
      mailchimp: {
        configured: !!process.env.MAILCHIMP_API_KEY,
        services: ['email_marketing', 'contact_sync']
      },
      googleMaps: {
        configured: !!process.env.GOOGLE_MAPS_API_KEY,
        services: ['geocoding', 'maps']
      },
      slack: {
        configured: !!process.env.SLACK_BOT_TOKEN,
        services: ['notifications']
      },
      quickbooks: {
        configured: !!(process.env.QB_CLIENT_ID && process.env.QB_CLIENT_SECRET),
        services: ['accounting', 'invoicing']
      },
      docusign: {
        configured: !!(process.env.DOCUSIGN_CLIENT_ID && process.env.DOCUSIGN_CLIENT_SECRET),
        services: ['e_signatures']
      },
      mls: {
        configured: !!(process.env.MLS_API_KEY && process.env.MLS_API_URL),
        services: ['property_search']
      }
    };

    res.json({ integrations: integrationStatus });
  } catch (error) {
    appLogger.error('Integration status error:', error);
    next(error);
  }
});

// Webhook endpoints for receiving data from external services
// POST /api/integrations/webhooks/twilio - Handle Twilio webhooks
router.post('/webhooks/twilio', async (req, res, next) => {
  try {
    const { CallSid, CallStatus, Duration } = req.body;
    
    // Log call completion
    if (CallStatus === 'completed' && Duration) {
      // Update activity with call duration
      appLogger.info(`Call ${CallSid} completed with duration ${Duration} seconds`);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    appLogger.error('Twilio webhook error:', error);
    res.status(500).send('Error');
  }
});

// POST /api/integrations/webhooks/mailchimp - Handle Mailchimp webhooks
router.post('/webhooks/mailchimp', async (req, res, next) => {
  try {
    const { type, data } = req.body;
    
    if (type === 'unsubscribe' && data.email) {
      // Update contact's email preferences
      await Contact.update(
        { doNotEmail: true },
        { where: { primaryEmail: data.email } }
      );
    }
    
    res.status(200).send('OK');
  } catch (error) {
    appLogger.error('Mailchimp webhook error:', error);
    res.status(500).send('Error');
  }
});

// POST /api/integrations/webhooks/docusign - Handle DocuSign webhooks
router.post('/webhooks/docusign', async (req, res, next) => {
  try {
    const { envelopeId, status } = req.body;
    
    if (status === 'completed') {
      // Update document signature status
      await Document.update(
        { eSignatureStatus: 'completed' },
        { where: { eSignatureEnvelopeId: envelopeId } }
      );
    }
    
    res.status(200).send('OK');
  } catch (error) {
    appLogger.error('DocuSign webhook error:', error);
    res.status(500).send('Error');
  }
});

// GET /api/integrations/feature-flags - Get feature flags status
router.get('/feature-flags', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { isFeatureEnabled } = require('../config/featureFlags');
    
    const featureFlags = {
      SENDGRID_ENABLED: isFeatureEnabled('SENDGRID_ENABLED'),
      CALENDAR_ENABLED: isFeatureEnabled('CALENDAR_ENABLED'),
      DASHBOARDS_ENABLED: isFeatureEnabled('DASHBOARDS_ENABLED')
    };

    res.json({
      success: true,
      data: featureFlags
    });
  } catch (error) {
    appLogger.error('Feature flags error:', error);
    next(error);
  }
});

// GET /api/integrations/system-health - Get system health status
router.get('/system-health', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { checkDBHealth } = require('../config/database');
    const { checkRedisHealth } = require('../config/redis');
    
    const dbHealth = await checkDBHealth();
    const redisHealth = await checkRedisHealth();
    
    const apiStatus = {
      status: 'operational',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: {
        api: apiStatus,
        database: dbHealth,
        redis: redisHealth
      }
    });
  } catch (error) {
    appLogger.error('System health check error:', error);
    next(error);
  }
});

// POST /api/integrations/sendgrid/test - Send test email
router.post('/sendgrid/test', authMiddleware, [
  body('to').isEmail().withMessage('Valid email address is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { sendTransactionalEmail, isSendGridEnabled } = require('../services/email/send');
    
    if (!isSendGridEnabled()) {
      return res.status(503).json({ 
        success: false,
        error: 'SendGrid is not enabled or configured' 
      });
    }

    const { to } = req.body;
    
    await sendTransactionalEmail({
      to,
      subject: 'Test Email from BesaHub CRM',
      text: `Hello! This is a test email from your BesaHub CRM system. If you received this, your SendGrid integration is working correctly.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Test Email from BesaHub CRM</h2>
          <p>Hello!</p>
          <p>This is a test email from your BesaHub CRM system.</p>
          <p>If you received this, your SendGrid integration is working correctly.</p>
          <hr style="border: 1px solid #e0e0e0; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">
            Sent at: ${new Date().toLocaleString()}<br/>
            From: ${req.user.firstName} ${req.user.lastName} (${req.user.email})
          </p>
        </div>
      `
    });

    appLogger.info('Test email sent successfully', { 
      from: req.user.email, 
      to 
    });

    res.json({
      success: true,
      message: 'Test email sent successfully',
      data: { sentTo: to }
    });
  } catch (error) {
    appLogger.error('Test email error:', error);
    next(error);
  }
});

module.exports = router;