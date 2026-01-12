const express = require('express');
const { Op } = require('sequelize');

const { Campaign, User, Property, Deal, Contact } = require('../models');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { cacheMiddleware, invalidateCache } = require('../middleware/cache');
const { appLogger } = require('../config/logger');
const DatabaseWrapper = require('../utils/dbWrapper');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/campaigns - List all campaigns with filters
router.get('/', 
  permissionMiddleware('campaigns', 'read'),
  cacheMiddleware((req) => `crm:campaigns:${req.query.page || 1}:${req.query.limit || 20}:${JSON.stringify(req.query)}`, 300),
  async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      type,
      createdBy,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { isActive: true };

    // Apply filters
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { subject: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (createdBy) {
      where.createdById = createdBy;
    }

    // Non-admin users only see their campaigns
    if (!['admin', 'manager'].includes(req.user.role)) {
      where.createdById = req.user.id;
    }

    const result = await DatabaseWrapper.query(
      async () => {
        const { rows, count } = await Campaign.findAndCountAll({
          where,
          include: [
            {
              model: User,
              as: 'createdBy',
              attributes: ['id', 'firstName', 'lastName', 'email']
            },
            {
              model: Property,
              as: 'property',
              attributes: ['id', 'name', 'address', 'city', 'state'],
              required: false
            },
            {
              model: Deal,
              as: 'deal',
              attributes: ['id', 'name', 'dealType', 'stage'],
              required: false
            }
          ],
          order: [[sortBy, sortOrder.toUpperCase()]],
          limit: parseInt(limit),
          offset: parseInt(offset)
        });
        return { campaigns: rows, count };
      },
      {
        timeout: 5000,
        operation: 'fetch campaigns',
        fallback: { campaigns: [], count: 0 }
      }
    );

    // Log audit event
    appLogger.info('Campaigns list retrieved', {
      userId: req.user.id,
      filters: { status, type, createdBy },
      resultCount: result.data.campaigns.length
    });

    res.json({
      campaigns: result.data.campaigns,
      total: result.data.count,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(result.data.count / limit),
        totalItems: result.data.count,
        itemsPerPage: parseInt(limit)
      },
      usingFallback: result.usingFallback
    });
  } catch (error) {
    appLogger.error('Get campaigns error:', error);
    next(error);
  }
});

// GET /api/campaigns/:id - Get single campaign details
router.get('/:id', 
  permissionMiddleware('campaigns', 'read'),
  async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      where: { 
        id: req.params.id,
        isActive: true
      },
      include: [
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'name', 'address', 'city', 'state'],
          required: false
        },
        {
          model: Deal,
          as: 'deal',
          attributes: ['id', 'name', 'dealType', 'stage'],
          required: false
        }
      ]
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Non-admin users can only see their own campaigns
    if (!['admin', 'manager'].includes(req.user.role) && campaign.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    appLogger.info('Campaign details retrieved', {
      userId: req.user.id,
      campaignId: campaign.id
    });

    res.json({ campaign });
  } catch (error) {
    appLogger.error('Get campaign error:', error);
    next(error);
  }
});

// POST /api/campaigns - Create new campaign
router.post('/', 
  permissionMiddleware('campaigns', 'create'),
  async (req, res, next) => {
  try {
    const {
      name,
      description,
      type,
      subject,
      emailBody,
      plainTextBody,
      templateId,
      recipientType,
      recipientFilters,
      recipientList,
      propertyId,
      dealId,
      tags,
      attachments
    } = req.body;

    // Validation
    if (!name || !type) {
      return res.status(400).json({ 
        error: 'Name and type are required' 
      });
    }

    if (type === 'email' && !subject) {
      return res.status(400).json({ 
        error: 'Subject is required for email campaigns' 
      });
    }

    const campaign = await Campaign.create({
      name,
      description,
      type,
      status: 'draft',
      subject,
      emailBody,
      plainTextBody,
      templateId,
      recipientType: recipientType || 'all_contacts',
      recipientFilters: recipientFilters || {},
      recipientList: recipientList || [],
      propertyId,
      dealId,
      tags: tags || [],
      attachments: attachments || [],
      createdById: req.user.id
    });

    // Invalidate cache
    await invalidateCache('crm:campaigns:*');

    appLogger.info('Campaign created', {
      userId: req.user.id,
      campaignId: campaign.id,
      campaignName: campaign.name,
      campaignType: campaign.type
    });

    // Fetch full campaign with associations
    const fullCampaign = await Campaign.findByPk(campaign.id, {
      include: [
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'name', 'address'],
          required: false
        },
        {
          model: Deal,
          as: 'deal',
          attributes: ['id', 'name', 'dealType'],
          required: false
        }
      ]
    });

    res.status(201).json({ campaign: fullCampaign });
  } catch (error) {
    appLogger.error('Create campaign error:', error);
    next(error);
  }
});

// PUT /api/campaigns/:id - Update campaign
router.put('/:id', 
  permissionMiddleware('campaigns', 'update'),
  async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      where: { 
        id: req.params.id,
        isActive: true
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Non-admin users can only update their own campaigns
    if (!['admin', 'manager'].includes(req.user.role) && campaign.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Cannot update sent campaigns
    if (campaign.status === 'sent') {
      return res.status(400).json({ 
        error: 'Cannot update sent campaigns' 
      });
    }

    const {
      name,
      description,
      type,
      subject,
      emailBody,
      plainTextBody,
      templateId,
      recipientType,
      recipientFilters,
      recipientList,
      propertyId,
      dealId,
      tags,
      attachments
    } = req.body;

    await campaign.update({
      name: name !== undefined ? name : campaign.name,
      description: description !== undefined ? description : campaign.description,
      type: type !== undefined ? type : campaign.type,
      subject: subject !== undefined ? subject : campaign.subject,
      emailBody: emailBody !== undefined ? emailBody : campaign.emailBody,
      plainTextBody: plainTextBody !== undefined ? plainTextBody : campaign.plainTextBody,
      templateId: templateId !== undefined ? templateId : campaign.templateId,
      recipientType: recipientType !== undefined ? recipientType : campaign.recipientType,
      recipientFilters: recipientFilters !== undefined ? recipientFilters : campaign.recipientFilters,
      recipientList: recipientList !== undefined ? recipientList : campaign.recipientList,
      propertyId: propertyId !== undefined ? propertyId : campaign.propertyId,
      dealId: dealId !== undefined ? dealId : campaign.dealId,
      tags: tags !== undefined ? tags : campaign.tags,
      attachments: attachments !== undefined ? attachments : campaign.attachments
    });

    // Invalidate cache
    await invalidateCache('crm:campaigns:*');

    appLogger.info('Campaign updated', {
      userId: req.user.id,
      campaignId: campaign.id,
      campaignName: campaign.name
    });

    // Fetch updated campaign with associations
    const updatedCampaign = await Campaign.findByPk(campaign.id, {
      include: [
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'name', 'address'],
          required: false
        },
        {
          model: Deal,
          as: 'deal',
          attributes: ['id', 'name', 'dealType'],
          required: false
        }
      ]
    });

    res.json({ campaign: updatedCampaign });
  } catch (error) {
    appLogger.error('Update campaign error:', error);
    next(error);
  }
});

// DELETE /api/campaigns/:id - Soft delete campaign
router.delete('/:id', 
  permissionMiddleware('campaigns', 'delete'),
  async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      where: { 
        id: req.params.id,
        isActive: true
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Non-admin users can only delete their own campaigns
    if (!['admin', 'manager'].includes(req.user.role) && campaign.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Cannot delete sent campaigns
    if (campaign.status === 'sent') {
      return res.status(400).json({ 
        error: 'Cannot delete sent campaigns. Please archive instead.' 
      });
    }

    await campaign.update({ isActive: false });

    // Invalidate cache
    await invalidateCache('crm:campaigns:*');

    appLogger.info('Campaign deleted', {
      userId: req.user.id,
      campaignId: campaign.id,
      campaignName: campaign.name
    });

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    appLogger.error('Delete campaign error:', error);
    next(error);
  }
});

// POST /api/campaigns/:id/schedule - Schedule campaign for sending
router.post('/:id/schedule', 
  permissionMiddleware('campaigns', 'update'),
  async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      where: { 
        id: req.params.id,
        isActive: true
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Non-admin users can only schedule their own campaigns
    if (!['admin', 'manager'].includes(req.user.role) && campaign.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { scheduledDate } = req.body;

    if (!scheduledDate) {
      return res.status(400).json({ 
        error: 'Scheduled date is required' 
      });
    }

    const scheduledDateObj = new Date(scheduledDate);
    
    if (scheduledDateObj < new Date()) {
      return res.status(400).json({ 
        error: 'Scheduled date must be in the future' 
      });
    }

    await campaign.schedule(scheduledDateObj);

    // Invalidate cache
    await invalidateCache('crm:campaigns:*');

    appLogger.info('Campaign scheduled', {
      userId: req.user.id,
      campaignId: campaign.id,
      scheduledDate: scheduledDateObj
    });

    res.json({ 
      message: 'Campaign scheduled successfully',
      campaign 
    });
  } catch (error) {
    appLogger.error('Schedule campaign error:', error);
    next(error);
  }
});

// POST /api/campaigns/:id/send - Send campaign immediately (stub)
router.post('/:id/send', 
  permissionMiddleware('campaigns', 'update'),
  async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      where: { 
        id: req.params.id,
        isActive: true
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Non-admin users can only send their own campaigns
    if (!['admin', 'manager'].includes(req.user.role) && campaign.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!campaign.canBeSent()) {
      return res.status(400).json({ 
        error: `Campaign cannot be sent with status: ${campaign.status}` 
      });
    }

    // Mark as sending
    await campaign.markAsSending();

    // TODO: Integrate with SendGrid/email service
    // For now, this is a stub that simulates sending
    appLogger.info('Campaign send initiated (STUB - SendGrid integration pending)', {
      userId: req.user.id,
      campaignId: campaign.id,
      campaignName: campaign.name
    });

    // Build recipient list
    let recipients = [];
    const { sendCampaign } = require('../services/email/send');
    
    if (campaign.recipientType === 'custom_list' && campaign.recipientList && campaign.recipientList.length > 0) {
      recipients = campaign.recipientList.map(r => ({
        email: r.email || r,
        contactId: r.contactId || null,
        firstName: r.firstName || '',
        lastName: r.lastName || '',
        dynamicData: r.dynamicData || {}
      }));
    } else if (campaign.recipientType === 'filtered' || campaign.recipientType === 'all_contacts') {
      const whereClause = { isActive: true };
      
      if (campaign.recipientFilters && Object.keys(campaign.recipientFilters).length > 0) {
        Object.entries(campaign.recipientFilters).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            whereClause[key] = value;
          }
        });
      }

      const contacts = await Contact.findAll({
        where: whereClause,
        attributes: ['id', 'primaryEmail', 'firstName', 'lastName']
      });

      recipients = contacts
        .filter(c => c.primaryEmail)
        .map(c => ({
          email: c.primaryEmail,
          contactId: c.id,
          firstName: c.firstName || '',
          lastName: c.lastName || '',
          dynamicData: {}
        }));
    }

    if (recipients.length === 0) {
      await campaign.update({ status: 'draft' });
      return res.status(400).json({ 
        error: 'No recipients found for campaign' 
      });
    }

    try {
      const result = await sendCampaign({
        campaignId: campaign.id,
        recipients,
        templateId: campaign.templateId,
        userId: req.user.id
      });

      await campaign.update({
        totalRecipients: recipients.length,
        status: 'sent',
        sentDate: new Date()
      });

      // Invalidate cache
      await invalidateCache('crm:campaigns:*');

      res.json({ 
        message: 'Campaign sent successfully',
        campaign,
        result: {
          totalRecipients: recipients.length,
          successCount: result.successCount,
          failedCount: result.failedCount
        }
      });

    } catch (sendError) {
      await campaign.update({ status: 'draft' });
      
      return res.status(500).json({ 
        error: 'Failed to send campaign',
        details: sendError.message
      });
    }
  } catch (error) {
    appLogger.error('Send campaign error:', error);
    next(error);
  }
});

// POST /api/campaigns/:id/pause - Pause campaign sending
router.post('/:id/pause', 
  permissionMiddleware('campaigns', 'update'),
  async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      where: { 
        id: req.params.id,
        isActive: true
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Non-admin users can only pause their own campaigns
    if (!['admin', 'manager'].includes(req.user.role) && campaign.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await campaign.pause();

    // Invalidate cache
    await invalidateCache('crm:campaigns:*');

    appLogger.info('Campaign paused', {
      userId: req.user.id,
      campaignId: campaign.id,
      campaignName: campaign.name
    });

    res.json({ 
      message: 'Campaign paused successfully',
      campaign 
    });
  } catch (error) {
    appLogger.error('Pause campaign error:', error);
    next(error);
  }
});

// POST /api/campaigns/:id/cancel - Cancel campaign
router.post('/:id/cancel', 
  permissionMiddleware('campaigns', 'update'),
  async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      where: { 
        id: req.params.id,
        isActive: true
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Non-admin users can only cancel their own campaigns
    if (!['admin', 'manager'].includes(req.user.role) && campaign.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await campaign.cancel();

    // Invalidate cache
    await invalidateCache('crm:campaigns:*');

    appLogger.info('Campaign cancelled', {
      userId: req.user.id,
      campaignId: campaign.id,
      campaignName: campaign.name
    });

    res.json({ 
      message: 'Campaign cancelled successfully',
      campaign 
    });
  } catch (error) {
    appLogger.error('Cancel campaign error:', error);
    next(error);
  }
});

// GET /api/campaigns/:id/recipients - Get recipient list with filters applied
router.get('/:id/recipients', 
  permissionMiddleware('campaigns', 'read'),
  async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      where: { 
        id: req.params.id,
        isActive: true
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Non-admin users can only view recipients for their own campaigns
    if (!['admin', 'manager'].includes(req.user.role) && campaign.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let recipients = [];
    let totalRecipients = 0;

    // TODO: Implement recipient filtering based on recipientType
    switch (campaign.recipientType) {
      case 'all_contacts':
        // Fetch all active contacts
        const allContacts = await Contact.findAll({
          where: { isActive: true },
          attributes: ['id', 'firstName', 'lastName', 'primaryEmail', 'companyName']
        });
        recipients = allContacts;
        totalRecipients = allContacts.length;
        break;
        
      case 'filtered':
        // Apply filters from recipientFilters
        const filters = campaign.recipientFilters || {};
        const where = { isActive: true };
        
        // Add filters based on recipientFilters object
        // This is a simplified version - expand based on actual filter requirements
        if (filters.companyName) {
          where.companyName = { [Op.iLike]: `%${filters.companyName}%` };
        }
        if (filters.city) {
          where.city = filters.city;
        }
        if (filters.state) {
          where.state = filters.state;
        }
        
        const filteredContacts = await Contact.findAll({
          where,
          attributes: ['id', 'firstName', 'lastName', 'primaryEmail', 'companyName']
        });
        recipients = filteredContacts;
        totalRecipients = filteredContacts.length;
        break;
        
      case 'custom_list':
        // Use predefined list from recipientList
        const listIds = campaign.recipientList || [];
        if (listIds.length > 0) {
          const customContacts = await Contact.findAll({
            where: { 
              id: { [Op.in]: listIds },
              isActive: true
            },
            attributes: ['id', 'firstName', 'lastName', 'primaryEmail', 'companyName']
          });
          recipients = customContacts;
          totalRecipients = customContacts.length;
        }
        break;
        
      case 'specific':
        // Specific recipients from recipientList
        const specificIds = campaign.recipientList || [];
        if (specificIds.length > 0) {
          const specificContacts = await Contact.findAll({
            where: { 
              id: { [Op.in]: specificIds },
              isActive: true
            },
            attributes: ['id', 'firstName', 'lastName', 'primaryEmail', 'companyName']
          });
          recipients = specificContacts;
          totalRecipients = specificContacts.length;
        }
        break;
        
      default:
        recipients = [];
        totalRecipients = 0;
    }

    appLogger.info('Campaign recipients retrieved', {
      userId: req.user.id,
      campaignId: campaign.id,
      recipientCount: totalRecipients
    });

    res.json({ 
      recipients,
      totalRecipients,
      recipientType: campaign.recipientType
    });
  } catch (error) {
    appLogger.error('Get campaign recipients error:', error);
    next(error);
  }
});

// GET /api/campaigns/:id/analytics - Get campaign performance analytics
router.get('/:id/analytics', 
  permissionMiddleware('campaigns', 'read'),
  async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      where: { 
        id: req.params.id,
        isActive: true
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Non-admin users can only view analytics for their own campaigns
    if (!['admin', 'manager'].includes(req.user.role) && campaign.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const analytics = {
      campaignId: campaign.id,
      campaignName: campaign.name,
      status: campaign.status,
      type: campaign.type,
      scheduledDate: campaign.scheduledDate,
      sentDate: campaign.sentDate,
      metrics: {
        totalRecipients: campaign.totalRecipients,
        sentCount: campaign.sentCount,
        openedCount: campaign.openedCount,
        clickedCount: campaign.clickedCount,
        bouncedCount: campaign.bouncedCount,
        unsubscribedCount: campaign.unsubscribedCount
      },
      rates: {
        openRate: campaign.getOpenRate(),
        clickRate: campaign.getClickRate(),
        bounceRate: campaign.getBounceRate(),
        unsubscribeRate: campaign.getUnsubscribeRate()
      },
      engagement: {
        clickThroughRate: campaign.sentCount > 0 
          ? ((campaign.clickedCount / campaign.sentCount) * 100).toFixed(2) 
          : 0,
        clickToOpenRate: campaign.openedCount > 0 
          ? ((campaign.clickedCount / campaign.openedCount) * 100).toFixed(2) 
          : 0
      }
    };

    appLogger.info('Campaign analytics retrieved', {
      userId: req.user.id,
      campaignId: campaign.id
    });

    res.json({ analytics });
  } catch (error) {
    appLogger.error('Get campaign analytics error:', error);
    next(error);
  }
});

// POST /api/campaigns/:id/test - Send test email (stub)
router.post('/:id/test', 
  permissionMiddleware('campaigns', 'update'),
  async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      where: { 
        id: req.params.id,
        isActive: true
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Non-admin users can only send test emails for their own campaigns
    if (!['admin', 'manager'].includes(req.user.role) && campaign.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { testEmail } = req.body;

    if (!testEmail) {
      return res.status(400).json({ 
        error: 'Test email address is required' 
      });
    }

    const { sendTransactional } = require('../services/email/send');

    try {
      const dynamicData = {
        html: campaign.emailBody || '<p>Test email content</p>',
        text: campaign.plainTextBody || 'Test email content'
      };

      const result = await sendTransactional({
        to: testEmail,
        subject: `[TEST] ${campaign.subject || 'Campaign Test'}`,
        templateId: campaign.templateId,
        dynamicData: campaign.templateId ? {
          campaignName: campaign.name,
          testMode: true
        } : dynamicData,
        userId: req.user.id
      });

      appLogger.info('Test email sent successfully', {
        userId: req.user.id,
        campaignId: campaign.id,
        testEmail,
        messageId: result.sendgridMessageId
      });

      res.json({ 
        message: 'Test email sent successfully',
        testEmail,
        campaignId: campaign.id,
        messageId: result.sendgridMessageId
      });

    } catch (sendError) {
      appLogger.error('Failed to send test email', {
        error: sendError.message,
        testEmail,
        campaignId: campaign.id
      });

      return res.status(500).json({
        error: 'Failed to send test email',
        details: sendError.message
      });
    }
  } catch (error) {
    appLogger.error('Send test email error:', error);
    next(error);
  }
});

module.exports = router;
