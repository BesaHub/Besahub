const { getSendGridClient, isSendGridEnabled, getDefaultFrom } = require('./sendgridClient');
const { EmailLog, Contact, Campaign } = require('../../models');
const { appLogger } = require('../../config/logger');
const config = require('../../config/environment');

const sendTransactional = async ({ to, templateId, dynamicData, subject, from, contactId, userId, cc, bcc, attachments }) => {
  if (!isSendGridEnabled()) {
    const error = new Error('SendGrid is not enabled. Please configure SENDGRID_ENABLED and SENDGRID_API_KEY.');
    appLogger.error('SendGrid disabled:', { to, subject });
    throw error;
  }

  const client = getSendGridClient();
  if (!client) {
    throw new Error('SendGrid client not initialized');
  }

  try {
    const defaultFrom = getDefaultFrom();
    const msg = {
      to: Array.isArray(to) ? to : [to],
      from: from || defaultFrom,
      subject: subject || 'Email from CRE CRM',
      cc: cc || undefined,
      bcc: bcc || undefined,
      attachments: attachments || undefined
    };

    if (templateId) {
      msg.templateId = templateId;
      msg.dynamicTemplateData = dynamicData || {};
    } else {
      msg.html = dynamicData?.html || '<p>No content provided</p>';
      msg.text = dynamicData?.text || 'No content provided';
    }

    if (contactId) {
      msg.customArgs = {
        contactId: String(contactId),
        userId: String(userId || '')
      };
    }

    appLogger.info('Sending transactional email via SendGrid', {
      to: msg.to,
      subject: msg.subject,
      templateId,
      contactId
    });

    const response = await client.send(msg);

    const messageIds = response.map(r => r.headers['x-message-id']).filter(Boolean);
    const sendgridMessageId = messageIds[0] || null;

    if (userId) {
      await EmailLog.create({
        userId,
        contactId: contactId || null,
        to: msg.to.join(', '),
        cc: cc ? cc.join(', ') : null,
        bcc: bcc ? bcc.join(', ') : null,
        subject: msg.subject,
        body: msg.html || msg.text || '',
        status: 'sent',
        sendgridMessageId,
        sentAt: new Date(),
        attachments: attachments || []
      });
    }

    appLogger.info('Transactional email sent successfully', {
      messageIds,
      to: msg.to
    });

    return {
      success: true,
      messageIds,
      sendgridMessageId,
      status: 'sent'
    };
  } catch (error) {
    appLogger.error('Failed to send transactional email', {
      error: error.message,
      to,
      subject,
      stack: error.stack
    });

    if (userId) {
      await EmailLog.create({
        userId,
        contactId: contactId || null,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subject || 'Email from CRE CRM',
        body: dynamicData?.html || dynamicData?.text || '',
        status: 'failed',
        sentAt: null
      });
    }

    throw error;
  }
};

const sendCampaign = async ({ campaignId, recipients, templateId, scheduledAt, userId }) => {
  if (!isSendGridEnabled()) {
    const error = new Error('SendGrid is not enabled. Please configure SENDGRID_ENABLED and SENDGRID_API_KEY.');
    appLogger.error('SendGrid disabled for campaign:', { campaignId });
    throw error;
  }

  const client = getSendGridClient();
  if (!client) {
    throw new Error('SendGrid client not initialized');
  }

  try {
    const campaign = await Campaign.findByPk(campaignId, {
      include: [
        { model: require('../../models').Property, as: 'property', required: false },
        { model: require('../../models').Deal, as: 'deal', required: false }
      ]
    });

    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    if (!recipients || recipients.length === 0) {
      throw new Error('No recipients provided for campaign');
    }

    const defaultFrom = getDefaultFrom();
    const messages = [];
    const messageIds = [];
    const errors = [];

    appLogger.info('Sending campaign emails via SendGrid', {
      campaignId,
      campaignName: campaign.name,
      recipientCount: recipients.length,
      templateId: templateId || campaign.templateId
    });

    for (const recipient of recipients) {
      try {
        const msg = {
          to: recipient.email,
          from: defaultFrom,
          subject: campaign.subject || 'Campaign Email',
          customArgs: {
            campaignId: String(campaignId),
            contactId: String(recipient.contactId || ''),
            userId: String(userId || campaign.createdById || '')
          }
        };

        const actualTemplateId = templateId || campaign.templateId;
        
        if (actualTemplateId) {
          msg.templateId = actualTemplateId;
          msg.dynamicTemplateData = {
            firstName: recipient.firstName || '',
            lastName: recipient.lastName || '',
            email: recipient.email,
            campaignName: campaign.name,
            ...recipient.dynamicData
          };
        } else {
          msg.html = campaign.emailBody || '<p>Campaign email</p>';
          msg.text = campaign.plainTextBody || 'Campaign email';
        }

        const response = await client.send(msg);
        const sendgridMessageId = response[0]?.headers['x-message-id'] || null;
        
        messageIds.push(sendgridMessageId);
        messages.push({
          email: recipient.email,
          messageId: sendgridMessageId,
          status: 'sent'
        });

        await EmailLog.create({
          userId: userId || campaign.createdById,
          contactId: recipient.contactId || null,
          to: recipient.email,
          subject: msg.subject,
          body: msg.html || msg.text || '',
          status: 'sent',
          sendgridMessageId,
          sentAt: new Date()
        });

      } catch (emailError) {
        appLogger.error('Failed to send campaign email to recipient', {
          campaignId,
          recipient: recipient.email,
          error: emailError.message
        });
        
        errors.push({
          email: recipient.email,
          error: emailError.message
        });

        messages.push({
          email: recipient.email,
          status: 'failed',
          error: emailError.message
        });
      }
    }

    const successCount = messageIds.length;
    const failedCount = errors.length;

    await campaign.update({
      sentCount: (campaign.sentCount || 0) + successCount,
      status: failedCount === recipients.length ? 'failed' : 'sent',
      sentDate: new Date()
    });

    appLogger.info('Campaign emails sent', {
      campaignId,
      totalRecipients: recipients.length,
      successCount,
      failedCount
    });

    return {
      success: successCount > 0,
      messageIds,
      totalRecipients: recipients.length,
      successCount,
      failedCount,
      errors: errors.length > 0 ? errors : undefined,
      messages
    };

  } catch (error) {
    appLogger.error('Failed to send campaign', {
      campaignId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

module.exports = {
  sendTransactional,
  sendCampaign
};
