const sgMail = require('@sendgrid/mail');
const config = require('../../config/environment');
const { appLogger } = require('../../config/logger');

let sendgridClient = null;

const initializeSendGridClient = () => {
  if (!config.sendgrid.enabled) {
    appLogger.warn('SendGrid integration is disabled via feature flag');
    return null;
  }

  if (!config.sendgrid.apiKey) {
    appLogger.error('SendGrid API key not configured');
    return null;
  }

  try {
    sgMail.setApiKey(config.sendgrid.apiKey);
    sendgridClient = sgMail;
    appLogger.info('SendGrid client initialized successfully', {
      fromEmail: config.sendgrid.fromEmail,
      fromName: config.sendgrid.fromName
    });
    return sgMail;
  } catch (error) {
    appLogger.error('Failed to initialize SendGrid client', { error: error.message });
    return null;
  }
};

const getSendGridClient = () => {
  if (!sendgridClient) {
    return initializeSendGridClient();
  }
  return sendgridClient;
};

const isSendGridEnabled = () => {
  return config.sendgrid.enabled && !!config.sendgrid.apiKey;
};

const getDefaultFrom = () => {
  return {
    email: config.sendgrid.fromEmail,
    name: config.sendgrid.fromName
  };
};

module.exports = {
  getSendGridClient,
  isSendGridEnabled,
  getDefaultFrom,
  initializeSendGridClient
};
