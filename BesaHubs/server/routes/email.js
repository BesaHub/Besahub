const express = require('express');
const { Op } = require('sequelize');
const { EmailEvent, Campaign, Contact, User, TeamMembership } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { appLogger } = require('../config/logger');
const { securityLogger } = require('../config/logger');

const router = express.Router();

router.use(authMiddleware);

// GET /api/email/events - Get email events with filters
router.get('/events', async (req, res, next) => {
  try {
    const {
      contactId,
      campaignId,
      eventType,
      page = 1,
      limit = 50,
      sortBy = 'eventTimestamp',
      sortOrder = 'DESC'
    } = req.query;

    const where = {};
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const include = [];

    if (contactId) {
      where.contactId = contactId;
    }

    if (campaignId) {
      where.campaignId = campaignId;
    }

    if (eventType) {
      where.eventType = eventType;
    }

    if (req.user.role === 'agent') {
      include.push(
        {
          model: Campaign,
          as: 'campaign',
          where: { createdById: req.user.id },
          required: false
        },
        {
          model: Contact,
          as: 'contact',
          where: { assignedAgentId: req.user.id },
          required: false
        }
      );

      where[Op.or] = [
        { '$campaign.id$': { [Op.ne]: null } },
        { '$contact.id$': { [Op.ne]: null } }
      ];

      securityLogger.info('RBAC: Agent accessing email events', {
        userId: req.user.id,
        userRole: req.user.role,
        filters: { contactId, campaignId, eventType }
      });

    } else if (req.user.role === 'manager') {
      const teamMemberships = await TeamMembership.findAll({
        where: { userId: req.user.id, isLead: true },
        attributes: ['teamId']
      });

      const teamIds = teamMemberships.map(tm => tm.teamId);

      if (teamIds.length > 0) {
        const teamMemberUsers = await TeamMembership.findAll({
          where: { teamId: { [Op.in]: teamIds } },
          attributes: ['userId']
        });

        const teamMemberUserIds = [...new Set(teamMemberUsers.map(tm => tm.userId))];
        teamMemberUserIds.push(req.user.id);

        include.push(
          {
            model: Campaign,
            as: 'campaign',
            where: { createdById: { [Op.in]: teamMemberUserIds } },
            required: false
          },
          {
            model: Contact,
            as: 'contact',
            where: { assignedAgentId: { [Op.in]: teamMemberUserIds } },
            required: false
          }
        );

        where[Op.or] = [
          { '$campaign.id$': { [Op.ne]: null } },
          { '$contact.id$': { [Op.ne]: null } }
        ];

        securityLogger.info('RBAC: Manager accessing email events', {
          userId: req.user.id,
          userRole: req.user.role,
          teamMemberCount: teamMemberUserIds.length,
          filters: { contactId, campaignId, eventType }
        });
      } else {
        include.push(
          {
            model: Campaign,
            as: 'campaign',
            where: { createdById: req.user.id },
            required: false
          },
          {
            model: Contact,
            as: 'contact',
            where: { assignedAgentId: req.user.id },
            required: false
          }
        );

        where[Op.or] = [
          { '$campaign.id$': { [Op.ne]: null } },
          { '$contact.id$': { [Op.ne]: null } }
        ];

        securityLogger.info('RBAC: Manager (no team) accessing email events', {
          userId: req.user.id,
          userRole: req.user.role,
          filters: { contactId, campaignId, eventType }
        });
      }

    } else if (req.user.role === 'admin') {
      securityLogger.info('RBAC: Admin accessing all email events', {
        userId: req.user.id,
        userRole: req.user.role,
        filters: { contactId, campaignId, eventType }
      });
    } else {
      securityLogger.warn('RBAC: Unauthorized role attempting email events access', {
        userId: req.user.id,
        userRole: req.user.role,
        filters: { contactId, campaignId, eventType }
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions to access email events'
      });
    }

    const { rows: events, count } = await EmailEvent.findAndCountAll({
      where,
      include,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      subQuery: false
    });

    appLogger.info('Email events retrieved', {
      userId: req.user.id,
      userRole: req.user.role,
      filters: { contactId, campaignId, eventType },
      resultCount: events.length
    });

    res.json({
      events,
      total: count,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    appLogger.error('Get email events error:', error);
    securityLogger.error('Email events access error', {
      userId: req.user?.id,
      userRole: req.user?.role,
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
});

module.exports = router;
