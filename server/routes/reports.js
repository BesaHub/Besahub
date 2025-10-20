const express = require('express');
const { query, validationResult } = require('express-validator');
const { Op, fn, col, literal } = require('sequelize');

const { User, Property, Contact, Deal, Activity, Company } = require('../models');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { appLogger } = require('../config/logger');

const router = express.Router();

// All routes require authentication and read permissions
router.use(authMiddleware);
router.use(permissionMiddleware('reports', 'read'));

// GET /api/reports/dashboard - Get dashboard overview
router.get('/dashboard', async (req, res, next) => {
  try {
    const whereClause = {};
    
    // Non-admin users only see their data
    if (!['admin', 'manager'].includes(req.user.role)) {
      whereClause.listingAgentId = req.user.id;
    }

    const [
      totalProperties,
      totalContacts,
      totalDeals,
      pipelineValue,
      closedDealsThisMonth,
      activitiesThisWeek
    ] = await Promise.all([
      Property.count({ 
        where: { 
          isActive: true,
          ...(!['admin', 'manager'].includes(req.user.role) ? { listingAgentId: req.user.id } : {})
        }
      }),
      Contact.count({ 
        where: { 
          isActive: true,
          ...(!['admin', 'manager'].includes(req.user.role) ? { assignedAgentId: req.user.id } : {})
        }
      }),
      Deal.count({ 
        where: { 
          isActive: true,
          stage: { [Op.notIn]: ['won', 'lost'] },
          ...whereClause
        }
      }),
      Deal.sum('value', { 
        where: { 
          isActive: true,
          stage: { [Op.notIn]: ['won', 'lost'] },
          ...whereClause
        }
      }),
      Deal.count({
        where: {
          stage: 'won',
          actualCloseDate: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          },
          ...whereClause
        }
      }),
      Activity.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          },
          ...(!['admin', 'manager'].includes(req.user.role) ? { userId: req.user.id } : {})
        }
      })
    ]);

    res.json({
      dashboard: {
        totalProperties,
        totalContacts,
        totalDeals,
        pipelineValue: pipelineValue || 0,
        closedDealsThisMonth,
        activitiesThisWeek
      }
    });
  } catch (error) {
    appLogger.error('Get dashboard error:', error);
    next(error);
  }
});

// GET /api/reports/sales-pipeline - Get sales pipeline analysis
router.get('/sales-pipeline', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('agentId').optional().isUUID().withMessage('Invalid agent ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { startDate, endDate, agentId } = req.query;
    const where = { isActive: true };

    // Apply date filters
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    // Apply agent filter (admins/managers only)
    if (agentId && ['admin', 'manager'].includes(req.user.role)) {
      where[Op.or] = [
        { listingAgentId: agentId },
        { buyerAgentId: agentId }
      ];
    } else if (!['admin', 'manager'].includes(req.user.role)) {
      where[Op.or] = [
        { listingAgentId: req.user.id },
        { buyerAgentId: req.user.id }
      ];
    }

    const [stageBreakdown, dealsByType, pipelineByAgent, monthlyTrend] = await Promise.all([
      // Stage breakdown
      Deal.findAll({
        where: { 
          ...where,
          stage: { [Op.notIn]: ['won', 'lost'] }
        },
        attributes: [
          'stage',
          [fn('COUNT', '*'), 'count'],
          [fn('SUM', col('value')), 'total_value'],
          [fn('AVG', col('probability')), 'avg_probability']
        ],
        group: ['stage']
      }),

      // Deals by type
      Deal.findAll({
        where,
        attributes: [
          'dealType',
          [fn('COUNT', '*'), 'count'],
          [fn('SUM', col('value')), 'total_value']
        ],
        group: ['dealType']
      }),

      // Pipeline by agent (admin/manager only)
      ['admin', 'manager'].includes(req.user.role) ? Deal.findAll({
        where: {
          ...where,
          stage: { [Op.notIn]: ['won', 'lost'] }
        },
        attributes: [
          'listingAgentId',
          [fn('COUNT', '*'), 'deal_count'],
          [fn('SUM', col('value')), 'pipeline_value']
        ],
        include: [
          {
            model: User,
            as: 'listingAgent',
            attributes: ['firstName', 'lastName']
          }
        ],
        group: ['listingAgentId', 'listingAgent.id']
      }) : [],

      // Monthly trend (last 12 months)
      Deal.findAll({
        where: {
          ...where,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000)
          }
        },
        attributes: [
          [fn('DATE_TRUNC', 'month', col('created_at')), 'month'],
          [fn('COUNT', '*'), 'deals_created'],
          [fn('SUM', literal('CASE WHEN stage = \'won\' THEN value ELSE 0 END')), 'revenue']
        ],
        group: [fn('DATE_TRUNC', 'month', col('created_at'))],
        order: [[fn('DATE_TRUNC', 'month', col('created_at')), 'ASC']]
      })
    ]);

    res.json({
      pipeline: {
        stageBreakdown,
        dealsByType,
        pipelineByAgent,
        monthlyTrend
      }
    });
  } catch (error) {
    appLogger.error('Get sales pipeline error:', error);
    next(error);
  }
});

// GET /api/reports/property-performance - Get property performance metrics
router.get('/property-performance', [
  query('propertyType').optional().isIn(['office', 'retail', 'industrial', 'warehouse', 'multifamily', 'hotel', 'land', 'mixed_use', 'medical', 'restaurant', 'other']).withMessage('Invalid property type'),
  query('city').optional().isLength({ max: 100 }).withMessage('City name too long'),
  query('state').optional().isLength({ min: 2, max: 2 }).withMessage('State must be 2 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { propertyType, city, state } = req.query;
    const where = { isActive: true };

    // Apply filters
    if (propertyType) where.propertyType = propertyType;
    if (city) where.city = { [Op.iLike]: `%${city}%` };
    if (state) where.state = state.toUpperCase();

    // Apply agent filter for non-admin users
    if (!['admin', 'manager'].includes(req.user.role)) {
      where.listingAgentId = req.user.id;
    }

    const [
      propertysByType,
      propertiesByStatus,
      averageMetrics,
      topPerformingProperties,
      marketTrends
    ] = await Promise.all([
      // Properties by type
      Property.findAll({
        where,
        attributes: [
          'propertyType',
          [fn('COUNT', '*'), 'count'],
          [fn('AVG', col('list_price')), 'avg_price'],
          [fn('AVG', col('total_square_footage')), 'avg_sqft']
        ],
        group: ['propertyType']
      }),

      // Properties by status
      Property.findAll({
        where,
        attributes: [
          'status',
          [fn('COUNT', '*'), 'count'],
          [fn('AVG', col('days_on_market')), 'avg_days_on_market']
        ],
        group: ['status']
      }),

      // Average metrics
      Property.findOne({
        where,
        attributes: [
          [fn('AVG', col('list_price')), 'avg_list_price'],
          [fn('AVG', col('price_per_square_foot')), 'avg_price_per_sqft'],
          [fn('AVG', col('days_on_market')), 'avg_days_on_market'],
          [fn('AVG', col('views')), 'avg_views'],
          [fn('AVG', col('inquiries')), 'avg_inquiries']
        ]
      }),

      // Top performing properties (most inquiries)
      Property.findAll({
        where,
        order: [['inquiries', 'DESC']],
        limit: 10,
        attributes: ['id', 'name', 'address', 'city', 'state', 'inquiries', 'views', 'listPrice']
      }),

      // Market trends by location
      Property.findAll({
        where,
        attributes: [
          'city',
          'state',
          [fn('COUNT', '*'), 'property_count'],
          [fn('AVG', col('list_price')), 'avg_price'],
          [fn('AVG', col('price_per_square_foot')), 'avg_price_per_sqft']
        ],
        group: ['city', 'state'],
        having: literal('COUNT(*) >= 3'), // Only include locations with 3+ properties
        order: [[fn('AVG', col('list_price')), 'DESC']],
        limit: 20
      })
    ]);

    res.json({
      propertyPerformance: {
        propertysByType,
        propertiesByStatus,
        averageMetrics,
        topPerformingProperties,
        marketTrends
      }
    });
  } catch (error) {
    appLogger.error('Get property performance error:', error);
    next(error);
  }
});

// GET /api/reports/lead-analysis - Get lead analysis and conversion metrics
router.get('/lead-analysis', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('leadSource').optional().isIn(['referral', 'website', 'cold_call', 'email_campaign', 'social_media', 'networking', 'advertisement', 'trade_show', 'other']).withMessage('Invalid lead source')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { startDate, endDate, leadSource } = req.query;
    const where = { isActive: true };

    // Apply date filters
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    // Apply lead source filter
    if (leadSource) {
      where.leadSource = leadSource;
    }

    // Apply agent filter for non-admin users
    if (!['admin', 'manager'].includes(req.user.role)) {
      where.assignedAgentId = req.user.id;
    }

    const [
      leadsBySource,
      leadsByStatus,
      conversionRates,
      leadsByAgent,
      monthlyLeadTrend
    ] = await Promise.all([
      // Leads by source
      Contact.findAll({
        where,
        attributes: [
          'leadSource',
          [fn('COUNT', '*'), 'count'],
          [fn('COUNT', literal('CASE WHEN lead_status = \'converted\' THEN 1 END')), 'converted']
        ],
        group: ['leadSource']
      }),

      // Leads by status
      Contact.findAll({
        where,
        attributes: [
          'leadStatus',
          [fn('COUNT', '*'), 'count']
        ],
        group: ['leadStatus']
      }),

      // Conversion rates by contact role
      Contact.findAll({
        where,
        attributes: [
          'contactRole',
          [fn('COUNT', '*'), 'total_leads'],
          [fn('COUNT', literal('CASE WHEN lead_status = \'converted\' THEN 1 END')), 'converted_leads']
        ],
        group: ['contactRole']
      }),

      // Leads by agent (admin/manager only)
      ['admin', 'manager'].includes(req.user.role) ? Contact.findAll({
        where,
        attributes: [
          'assignedAgentId',
          [fn('COUNT', '*'), 'lead_count'],
          [fn('COUNT', literal('CASE WHEN lead_status = \'qualified\' THEN 1 END')), 'qualified_leads']
        ],
        include: [
          {
            model: User,
            as: 'assignedAgent',
            attributes: ['firstName', 'lastName']
          }
        ],
        group: ['assignedAgentId', 'assignedAgent.id']
      }) : [],

      // Monthly lead trend
      Contact.findAll({
        where: {
          ...where,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000)
          }
        },
        attributes: [
          [fn('DATE_TRUNC', 'month', col('created_at')), 'month'],
          [fn('COUNT', '*'), 'leads_created'],
          [fn('COUNT', literal('CASE WHEN lead_status = \'converted\' THEN 1 END')), 'leads_converted']
        ],
        group: [fn('DATE_TRUNC', 'month', col('created_at'))],
        order: [[fn('DATE_TRUNC', 'month', col('created_at')), 'ASC']]
      })
    ]);

    res.json({
      leadAnalysis: {
        leadsBySource,
        leadsByStatus,
        conversionRates,
        leadsByAgent,
        monthlyLeadTrend
      }
    });
  } catch (error) {
    appLogger.error('Get lead analysis error:', error);
    next(error);
  }
});

// GET /api/reports/activity-summary - Get activity summary and productivity metrics
router.get('/activity-summary', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('userId').optional().isUUID().withMessage('Invalid user ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { startDate, endDate, userId } = req.query;
    const where = {};

    // Apply date filters
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    // Apply user filter
    if (userId && ['admin', 'manager'].includes(req.user.role)) {
      where.userId = userId;
    } else if (!['admin', 'manager'].includes(req.user.role)) {
      where.userId = req.user.id;
    }

    const [
      activitiesByType,
      activitiesByOutcome,
      dailyActivityTrend,
      topActiveUsers,
      communicationBreakdown
    ] = await Promise.all([
      // Activities by type
      Activity.findAll({
        where,
        attributes: [
          'type',
          [fn('COUNT', '*'), 'count'],
          [fn('AVG', col('duration')), 'avg_duration']
        ],
        group: ['type']
      }),

      // Activities by outcome
      Activity.findAll({
        where: {
          ...where,
          outcome: { [Op.ne]: null }
        },
        attributes: [
          'outcome',
          [fn('COUNT', '*'), 'count']
        ],
        group: ['outcome']
      }),

      // Daily activity trend (last 30 days)
      Activity.findAll({
        where: {
          ...where,
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        attributes: [
          [fn('DATE_TRUNC', 'day', col('created_at')), 'day'],
          [fn('COUNT', '*'), 'activity_count']
        ],
        group: [fn('DATE_TRUNC', 'day', col('created_at'))],
        order: [[fn('DATE_TRUNC', 'day', col('created_at')), 'ASC']]
      }),

      // Most active users (admin/manager only)
      ['admin', 'manager'].includes(req.user.role) ? Activity.findAll({
        where,
        attributes: [
          'userId',
          [fn('COUNT', '*'), 'activity_count'],
          [fn('AVG', col('duration')), 'avg_duration']
        ],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName']
          }
        ],
        group: ['userId', 'user.id'],
        order: [[fn('COUNT', '*'), 'DESC']],
        limit: 10
      }) : [],

      // Communication method breakdown
      Activity.findAll({
        where: {
          ...where,
          communicationMethod: { [Op.ne]: null }
        },
        attributes: [
          'communicationMethod',
          [fn('COUNT', '*'), 'count'],
          [fn('AVG', col('duration')), 'avg_duration']
        ],
        group: ['communicationMethod']
      })
    ]);

    res.json({
      activitySummary: {
        activitiesByType,
        activitiesByOutcome,
        dailyActivityTrend,
        topActiveUsers,
        communicationBreakdown
      }
    });
  } catch (error) {
    appLogger.error('Get activity summary error:', error);
    next(error);
  }
});

// GET /api/reports/revenue-forecast - Get revenue forecasting data
router.get('/revenue-forecast', [
  query('months').optional().isInt({ min: 1, max: 24 }).withMessage('Months must be between 1 and 24')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const months = parseInt(req.query.months) || 12;
    const where = { isActive: true };

    // Apply agent filter for non-admin users
    if (!['admin', 'manager'].includes(req.user.role)) {
      where[Op.or] = [
        { listingAgentId: req.user.id },
        { buyerAgentId: req.user.id }
      ];
    }

    // Create future month dates
    const futureMonths = [];
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      futureMonths.push({
        month: date,
        monthName: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      });
    }

    const [
      pipelineDeals,
      historicalRevenue,
      dealProbabilities
    ] = await Promise.all([
      // Current pipeline deals
      Deal.findAll({
        where: {
          ...where,
          stage: { [Op.notIn]: ['won', 'lost'] },
          expectedCloseDate: { [Op.ne]: null }
        },
        attributes: ['id', 'name', 'value', 'probability', 'stage', 'expectedCloseDate'],
        order: [['expectedCloseDate', 'ASC']]
      }),

      // Historical revenue (last 12 months)
      Deal.findAll({
        where: {
          ...where,
          stage: 'won',
          actualCloseDate: {
            [Op.gte]: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000)
          }
        },
        attributes: [
          [fn('DATE_TRUNC', 'month', col('actual_close_date')), 'month'],
          [fn('SUM', col('value')), 'revenue'],
          [fn('COUNT', '*'), 'deals_closed']
        ],
        group: [fn('DATE_TRUNC', 'month', col('actual_close_date'))],
        order: [[fn('DATE_TRUNC', 'month', col('actual_close_date')), 'ASC']]
      }),

      // Deal probabilities by stage
      Deal.findAll({
        where,
        attributes: [
          'stage',
          [fn('AVG', col('probability')), 'avg_probability'],
          [fn('COUNT', '*'), 'deal_count']
        ],
        group: ['stage']
      })
    ]);

    // Calculate forecasted revenue for each month
    const forecast = futureMonths.map(({ month, monthName }) => {
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const dealsInMonth = pipelineDeals.filter(deal => {
        const closeDate = new Date(deal.expected_close_date);
        return closeDate >= monthStart && closeDate <= monthEnd;
      });

      const totalValue = dealsInMonth.reduce((sum, deal) => sum + (deal.value || 0), 0);
      const weightedValue = dealsInMonth.reduce((sum, deal) => 
        sum + ((deal.value || 0) * (deal.probability / 100)), 0
      );

      return {
        month: monthName,
        totalPipelineValue: totalValue,
        forecastedRevenue: Math.round(weightedValue),
        dealCount: dealsInMonth.length,
        deals: dealsInMonth.map(d => ({
          id: d.id,
          name: d.name,
          value: d.value,
          probability: d.probability,
          stage: d.stage
        }))
      };
    });

    res.json({
      revenueForecast: {
        forecast,
        historicalRevenue,
        dealProbabilities,
        totalPipelineValue: pipelineDeals.reduce((sum, deal) => sum + (deal.value || 0), 0),
        weightedPipelineValue: Math.round(pipelineDeals.reduce((sum, deal) => 
          sum + ((deal.value || 0) * (deal.probability / 100)), 0
        ))
      }
    });
  } catch (error) {
    appLogger.error('Get revenue forecast error:', error);
    next(error);
  }
});

module.exports = router;