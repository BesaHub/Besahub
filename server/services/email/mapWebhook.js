const { Contact, Campaign } = require('../../models');
const { appLogger } = require('../../config/logger');
const { eventTypes } = require('../../models/EmailEvent');

const sendgridToInternalEventMap = {
  'processed': 'processed',
  'delivered': 'delivered',
  'open': 'open',
  'click': 'click',
  'bounce': 'bounce',
  'dropped': 'dropped',
  'deferred': 'processed',
  'spamreport': 'spamreport',
  'unsubscribe': 'unsubscribe',
  'group_unsubscribe': 'unsubscribe',
  'group_resubscribe': 'processed'
};

const normalizeEvent = async (sendgridEvent) => {
  try {
    const eventType = sendgridToInternalEventMap[sendgridEvent.event] || 'processed';
    
    if (!eventTypes.includes(eventType)) {
      appLogger.warn('Unmapped SendGrid event type', {
        sendgridEvent: sendgridEvent.event,
        fallback: 'processed'
      });
    }

    const messageId = sendgridEvent.sg_message_id || sendgridEvent['smtp-id'] || 'unknown';
    const eventTimestamp = sendgridEvent.timestamp 
      ? new Date(sendgridEvent.timestamp * 1000) 
      : new Date();

    let contactId = null;
    let campaignId = null;

    if (sendgridEvent.contactId || sendgridEvent.contact_id) {
      contactId = sendgridEvent.contactId || sendgridEvent.contact_id;
    } else if (sendgridEvent.email) {
      try {
        const contact = await Contact.findOne({
          where: { primaryEmail: sendgridEvent.email },
          attributes: ['id']
        });
        if (contact) {
          contactId = contact.id;
        }
      } catch (lookupError) {
        appLogger.warn('Failed to lookup contact by email', {
          email: sendgridEvent.email,
          error: lookupError.message
        });
      }
    }

    if (sendgridEvent.campaignId || sendgridEvent.campaign_id) {
      campaignId = sendgridEvent.campaignId || sendgridEvent.campaign_id;
    }

    const metadata = {
      email: sendgridEvent.email,
      ip: sendgridEvent.ip,
      userAgent: sendgridEvent.useragent || sendgridEvent.user_agent,
      url: sendgridEvent.url,
      category: sendgridEvent.category,
      reason: sendgridEvent.reason,
      status: sendgridEvent.status,
      response: sendgridEvent.response,
      type: sendgridEvent.type,
      sendgridEvent: sendgridEvent.event,
      asmGroupId: sendgridEvent.asm_group_id,
      rawEvent: sendgridEvent
    };

    Object.keys(metadata).forEach(key => {
      if (metadata[key] === undefined || metadata[key] === null) {
        delete metadata[key];
      }
    });

    const normalizedEvent = {
      contactId,
      campaignId,
      messageId: messageId.substring(0, 255),
      eventType,
      eventTimestamp,
      metadata
    };

    appLogger.debug('Normalized SendGrid event', {
      originalEvent: sendgridEvent.event,
      normalizedType: eventType,
      messageId: normalizedEvent.messageId,
      contactId,
      campaignId
    });

    return normalizedEvent;

  } catch (error) {
    appLogger.error('Failed to normalize SendGrid event', {
      error: error.message,
      sendgridEvent,
      stack: error.stack
    });
    throw error;
  }
};

const extractCustomArgs = (sendgridEvent) => {
  try {
    const customArgs = sendgridEvent.custom_args || {};
    
    return {
      contactId: customArgs.contactId || customArgs.contact_id || null,
      campaignId: customArgs.campaignId || customArgs.campaign_id || null,
      userId: customArgs.userId || customArgs.user_id || null
    };
  } catch (error) {
    appLogger.warn('Failed to extract custom args from SendGrid event', {
      error: error.message
    });
    return { contactId: null, campaignId: null, userId: null };
  }
};

module.exports = {
  normalizeEvent,
  extractCustomArgs,
  sendgridToInternalEventMap
};
