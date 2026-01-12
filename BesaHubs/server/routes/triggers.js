const express = require('express');
const { query, param, validationResult } = require('express-validator');
const { Op } = require('sequelize');

const { Trigger, Lease, Debt, Property, Contact, Company } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { appLogger } = require('../config/logger');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/triggers - List all triggers with filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['lease_expiration', 'debt_maturity', 'property_alert', 'deal_alert', 'custom']).withMessage('Invalid trigger type'),
  query('status').optional().isIn(['pending', 'active', 'dismissed', 'actioned']).withMessage('Invalid status'),
  query('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  query('entityType').optional().isLength({ max: 50 }).withMessage('Entity type too long'),
  query('entityId').optional().isUUID().withMessage('Invalid entity ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      type,
      status,
      priority,
      entityType,
      entityId,
      sortBy = 'triggerDate',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Apply filters
    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    const { rows: triggers, count } = await Trigger.findAndCountAll({
      where,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Enrich triggers with entity details
    const enrichedTriggers = await Promise.all(
      triggers.map(async (trigger) => {
        const triggerData = trigger.toJSON();

        try {
          // Fetch related entity details based on entityType
          if (trigger.entityType === 'lease') {
            const lease = await Lease.findByPk(trigger.entityId, {
              include: [
                {
                  model: Property,
                  as: 'property',
                  attributes: ['id', 'name', 'address', 'city', 'state']
                },
                {
                  model: Contact,
                  as: 'tenant',
                  attributes: ['id', 'firstName', 'lastName', 'companyName']
                }
              ]
            });

            if (lease) {
              triggerData.entity = lease;
            }
          } else if (trigger.entityType === 'debt') {
            const debt = await Debt.findByPk(trigger.entityId, {
              include: [
                {
                  model: Property,
                  as: 'property',
                  attributes: ['id', 'name', 'address', 'city', 'state']
                },
                {
                  model: Company,
                  as: 'lender',
                  attributes: ['id', 'name', 'type']
                }
              ]
            });

            if (debt) {
              triggerData.entity = debt;
            }
          }
        } catch (error) {
          appLogger.warn('Error enriching trigger with entity data', {
            service: 'trigger-routes',
            triggerId: trigger.id,
            error: error.message
          });
        }

        return triggerData;
      })
    );

    res.json({
      triggers: enrichedTriggers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    appLogger.error('Get triggers error:', {
      service: 'trigger-routes',
      error: error.message
    });
    next(error);
  }
});

// GET /api/triggers/:id - Get single trigger
router.get('/:id', [
  param('id').isUUID().withMessage('Invalid trigger ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;

    const trigger = await Trigger.findByPk(id);

    if (!trigger) {
      return res.status(404).json({ error: 'Trigger not found' });
    }

    const triggerData = trigger.toJSON();

    // Fetch related entity details
    try {
      if (trigger.entityType === 'lease') {
        const lease = await Lease.findByPk(trigger.entityId, {
          include: [
            {
              model: Property,
              as: 'property',
              include: [
                {
                  model: Contact,
                  as: 'owner',
                  attributes: ['id', 'firstName', 'lastName', 'companyName', 'primaryEmail', 'primaryPhone']
                }
              ]
            },
            {
              model: Contact,
              as: 'tenant',
              attributes: ['id', 'firstName', 'lastName', 'companyName', 'primaryEmail', 'primaryPhone']
            }
          ]
        });

        if (lease) {
          triggerData.entity = lease;
        }
      } else if (trigger.entityType === 'debt') {
        const debt = await Debt.findByPk(trigger.entityId, {
          include: [
            {
              model: Property,
              as: 'property',
              include: [
                {
                  model: Contact,
                  as: 'owner',
                  attributes: ['id', 'firstName', 'lastName', 'companyName', 'primaryEmail', 'primaryPhone']
                }
              ]
            },
            {
              model: Company,
              as: 'lender',
              attributes: ['id', 'name', 'type', 'website', 'primaryEmail', 'primaryPhone']
            }
          ]
        });

        if (debt) {
          triggerData.entity = debt;
        }
      }
    } catch (error) {
      appLogger.warn('Error fetching trigger entity details', {
        service: 'trigger-routes',
        triggerId: trigger.id,
        error: error.message
      });
    }

    res.json({ trigger: triggerData });
  } catch (error) {
    appLogger.error('Get trigger error:', {
      service: 'trigger-routes',
      error: error.message
    });
    next(error);
  }
});

// PUT /api/triggers/:id/dismiss - Dismiss a trigger
router.put('/:id/dismiss', [
  param('id').isUUID().withMessage('Invalid trigger ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;

    const trigger = await Trigger.findByPk(id);

    if (!trigger) {
      return res.status(404).json({ error: 'Trigger not found' });
    }

    // Update status to dismissed
    await trigger.update({
      status: 'dismissed'
    });

    appLogger.info('Trigger dismissed', {
      service: 'trigger-routes',
      triggerId: trigger.id,
      userId: req.user.id
    });

    res.json({
      message: 'Trigger dismissed successfully',
      trigger
    });
  } catch (error) {
    appLogger.error('Dismiss trigger error:', {
      service: 'trigger-routes',
      error: error.message
    });
    next(error);
  }
});

// PUT /api/triggers/:id/action - Mark trigger as actioned
router.put('/:id/action', [
  param('id').isUUID().withMessage('Invalid trigger ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;

    const trigger = await Trigger.findByPk(id);

    if (!trigger) {
      return res.status(404).json({ error: 'Trigger not found' });
    }

    // Update status to actioned
    await trigger.update({
      status: 'actioned'
    });

    appLogger.info('Trigger marked as actioned', {
      service: 'trigger-routes',
      triggerId: trigger.id,
      userId: req.user.id
    });

    res.json({
      message: 'Trigger marked as actioned successfully',
      trigger
    });
  } catch (error) {
    appLogger.error('Action trigger error:', {
      service: 'trigger-routes',
      error: error.message
    });
    next(error);
  }
});

// DELETE /api/triggers/:id - Delete a trigger
router.delete('/:id', [
  param('id').isUUID().withMessage('Invalid trigger ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;

    const trigger = await Trigger.findByPk(id);

    if (!trigger) {
      return res.status(404).json({ error: 'Trigger not found' });
    }

    // Delete the trigger
    await trigger.destroy();

    appLogger.info('Trigger deleted', {
      service: 'trigger-routes',
      triggerId: id,
      userId: req.user.id
    });

    res.json({
      message: 'Trigger deleted successfully'
    });
  } catch (error) {
    appLogger.error('Delete trigger error:', {
      service: 'trigger-routes',
      error: error.message
    });
    next(error);
  }
});

module.exports = router;
