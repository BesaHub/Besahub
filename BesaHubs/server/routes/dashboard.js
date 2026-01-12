const express = require('express');
const { Op, literal, fn, col } = require('sequelize');
const { Property, Deal, Contact, User, Activity } = require('../models');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');
const { appLogger } = require('../config/logger');
const DatabaseWrapper = require('../utils/dbWrapper');

const router = express.Router();
router.use(authMiddleware);

// GET /api/dashboard - Main dashboard overview
router.get('/', 
  permissionMiddleware('dashboard', 'read'),
  cacheMiddleware((req) => `crm:dashboard:${req.user.id}:${req.query.timeframe || '30'}`, 300),
  async (req, res, next) => {
  try {
    const { timeframe = '30' } = req.query;
    const daysBack = parseInt(timeframe);
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysBack);

    // Fallback demo data
    const fallbackData = {
      pipeline: {
        totalPipeline: [
          { dealType: 'sale', count: '8', totalValue: '15500000', weightedValue: '9300000' },
          { dealType: 'lease', count: '5', totalValue: '850000', weightedValue: '510000' }
        ],
        recentWins: { count: '3', totalValue: '4200000' },
        conversionStats: [
          { stage: 'prospecting', count: '5' },
          { stage: 'qualification', count: '3' },
          { stage: 'proposal', count: '2' },
          { stage: 'negotiation', count: '2' },
          { stage: 'won', count: '3' }
        ]
      },
      properties: {
        listingsByStatus: [
          { status: 'available', listingType: 'sale', count: '12', totalSF: '450000' },
          { status: 'available', listingType: 'lease', count: '8', totalSF: '280000' },
          { status: 'under_contract', listingType: 'sale', count: '3', totalSF: '95000' }
        ],
        inventoryStats: { totalProperties: '25', totalSF: '825000', avgOccupancy: '87.5' }
      },
      recentActivity: [
        { title: 'Property Viewed', type: 'property_view', createdAt: new Date(Date.now() - 1000 * 60 * 30) },
        { title: 'Deal Updated', type: 'deal_update', createdAt: new Date(Date.now() - 1000 * 60 * 120) },
        { title: 'Contact Added', type: 'contact_create', createdAt: new Date(Date.now() - 1000 * 60 * 240) }
      ],
      agentPerformance: { individual: { totalDeals: '8', totalValue: '5600000', totalCommission: '168000' } }
    };

    // Get pipeline metrics with DatabaseWrapper
    const result = await DatabaseWrapper.query(
      async () => {
        const [pipelineMetrics, propertyStats, recentActivity, agentPerformance] = await Promise.all([
          getPipelineMetrics(req.user, dateFrom),
          getPropertyStats(req.user),
          getRecentActivity(req.user, dateFrom),
          getAgentPerformance(req.user, dateFrom)
        ]);
        return {
          pipeline: pipelineMetrics,
          properties: propertyStats,
          recentActivity,
          agentPerformance
        };
      },
      {
        timeout: 5000,
        operation: 'fetch dashboard metrics',
        fallback: fallbackData
      }
    );

    res.json({
      timeframe: `${daysBack} days`,
      pipeline: result.data.pipeline,
      properties: result.data.properties,
      recentActivity: result.data.recentActivity,
      agentPerformance: result.data.agentPerformance,
      generatedAt: new Date(),
      usingFallback: result.usingFallback
    });
  } catch (error) {
    appLogger.error('Dashboard error:', error);
    next(error);
  }
});

// GET /api/dashboard/pipeline - Pipeline analytics
router.get('/pipeline', permissionMiddleware('deals', 'read'), async (req, res, next) => {
  try {
    const { timeframe = '90', agentId, dealType } = req.query;
    const daysBack = parseInt(timeframe);
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysBack);

    const whereClause = {
      isActive: true,
      createdAt: { [Op.gte]: dateFrom }
    };

    if (req.user.role === 'agent') {
      whereClause.listingAgentId = req.user.id;
    } else if (agentId) {
      whereClause.listingAgentId = agentId;
    }

    if (dealType) {
      whereClause.dealType = dealType;
    }

    // Pipeline by stage
    const pipelineByStage = await Deal.findAll({
      attributes: [
        'stage',
        'dealType',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('value')), 'totalValue'],
        [fn('AVG', col('probability')), 'avgProbability']
      ],
      where: whereClause,
      group: ['stage', 'dealType'],
      order: [['stage', 'ASC']]
    });

    // Sales vs Lease breakdown
    const dealTypeBreakdown = await Deal.findAll({
      attributes: [
        'dealType',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('value')), 'totalValue'],
        [fn('SUM', literal('value * probability / 100')), 'weightedValue']
      ],
      where: whereClause,
      group: ['dealType']
    });

    // Monthly pipeline trends
    const monthlyTrends = await Deal.findAll({
      attributes: [
        [fn('DATE_TRUNC', 'month', col('created_at')), 'month'],
        'dealType',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('value')), 'totalValue']
      ],
      where: {
        isActive: true,
        createdAt: { [Op.gte]: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } // 1 year
      },
      group: [fn('DATE_TRUNC', 'month', col('created_at')), 'dealType'],
      order: [[fn('DATE_TRUNC', 'month', col('created_at')), 'ASC']]
    });

    res.json({
      pipelineByStage,
      dealTypeBreakdown,
      monthlyTrends,
      timeframe: `${daysBack} days`
    });
  } catch (error) {
    appLogger.error('Pipeline analytics error:', error);
    next(error);
  }
});

// GET /api/dashboard/properties - Property analytics
router.get('/properties', permissionMiddleware('properties', 'read'), async (req, res, next) => {
  try {
    const { timeframe = '30' } = req.query;
    const daysBack = parseInt(timeframe);
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysBack);

    const whereClause = { isActive: true };
    if (req.user.role === 'agent') {
      whereClause.listingAgentId = req.user.id;
    }

    // Property status breakdown
    const statusBreakdown = await Property.findAll({
      attributes: [
        'status',
        'listingType',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('total_square_footage')), 'totalSF'],
        [fn('SUM', col('list_price')), 'totalValue']
      ],
      where: whereClause,
      group: ['status', 'listingType']
    });

    // Property type breakdown
    const typeBreakdown = await Property.findAll({
      attributes: [
        'propertyType',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('total_square_footage')), 'totalSF'],
        [fn('AVG', col('list_price')), 'avgPrice']
      ],
      where: whereClause,
      group: ['propertyType']
    });

    // Recently added properties
    const recentProperties = await Property.findAll({
      where: {
        ...whereClause,
        createdAt: { [Op.gte]: dateFrom }
      },
      include: [
        {
          model: User,
          as: 'listingAgent',
          attributes: ['firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Market metrics
    const marketMetrics = await Property.findAll({
      attributes: [
        [fn('COUNT', col('id')), 'totalListings'],
        [fn('SUM', col('total_square_footage')), 'totalInventorySF'],
        [fn('AVG', col('list_price')), 'avgListPrice'],
        [fn('AVG', col('price_per_square_foot')), 'avgPricePSF'],
        [fn('AVG', col('days_on_market')), 'avgDaysOnMarket']
      ],
      where: {
        ...whereClause,
        status: { [Op.in]: ['available', 'under_contract'] }
      }
    });

    res.json({
      statusBreakdown,
      typeBreakdown,
      recentProperties,
      marketMetrics: marketMetrics[0],
      timeframe: `${daysBack} days`
    });
  } catch (error) {
    appLogger.error('Property analytics error:', error);
    next(error);
  }
});

// GET /api/dashboard/activity - Recent activity feed
router.get('/activity', permissionMiddleware('activities', 'read'), async (req, res, next) => {
  try {
    const { limit = 20, type } = req.query;

    const whereClause = {};
    if (req.user.role === 'agent') {
      whereClause.userId = req.user.id;
    }
    if (type) {
      whereClause.type = type;
    }

    // Fallback demo data
    const fallbackActivities = [
      {
        id: '1',
        type: 'property_view',
        title: 'Property Viewed',
        description: 'Viewed Downtown Office Tower',
        createdAt: new Date(Date.now() - 1000 * 60 * 15),
        user: { firstName: 'John', lastName: 'Doe', avatar: null },
        property: { name: 'Downtown Office Tower', address: '123 Main St', city: 'New York' }
      },
      {
        id: '2',
        type: 'deal_update',
        title: 'Deal Stage Changed',
        description: 'Deal moved to Negotiation',
        createdAt: new Date(Date.now() - 1000 * 60 * 45),
        user: { firstName: 'Jane', lastName: 'Smith', avatar: null },
        deal: { name: 'Retail Space Lease', stage: 'negotiation', value: 250000 }
      },
      {
        id: '3',
        type: 'contact_create',
        title: 'New Contact Added',
        description: 'Added new contact',
        createdAt: new Date(Date.now() - 1000 * 60 * 120),
        user: { firstName: 'Mike', lastName: 'Johnson', avatar: null },
        contact: { firstName: 'Sarah', lastName: 'Williams', companyName: 'ABC Corp' }
      }
    ];

    const result = await DatabaseWrapper.query(
      async () => {
        return await Activity.findAll({
          where: whereClause,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName', 'avatar']
            },
            {
              model: Property,
              as: 'property',
              attributes: ['name', 'address', 'city']
            },
            {
              model: Deal,
              as: 'deal',
              attributes: ['name', 'stage', 'value']
            },
            {
              model: Contact,
              as: 'contact',
              attributes: ['firstName', 'lastName', 'companyName']
            }
          ],
          order: [['createdAt', 'DESC']],
          limit: parseInt(limit)
        });
      },
      {
        timeout: 5000,
        operation: 'fetch recent activities',
        fallback: fallbackActivities
      }
    );

    res.json({ activities: result.data, usingFallback: result.usingFallback });
  } catch (error) {
    appLogger.error('Activity feed error:', error);
    next(error);
  }
});

// Helper functions
async function getPipelineMetrics(user, dateFrom) {
  const whereClause = { isActive: true };
  if (user.role === 'agent') {
    whereClause.listingAgentId = user.id;
  }

  // Current pipeline value by type
  const totalPipeline = await Deal.findAll({
    attributes: [
      'dealType',
      [fn('COUNT', col('id')), 'count'],
      [fn('SUM', col('value')), 'totalValue'],
      [fn('SUM', literal('value * probability / 100')), 'weightedValue']
    ],
    where: {
      ...whereClause,
      stage: { [Op.notIn]: ['won', 'lost'] }
    },
    group: ['dealType']
  });

  // Recent wins
  const recentWins = await Deal.findAll({
    where: {
      ...whereClause,
      stage: 'won',
      actualCloseDate: { [Op.gte]: dateFrom }
    },
    attributes: [
      [fn('COUNT', col('id')), 'count'],
      [fn('SUM', col('value')), 'totalValue']
    ]
  });

  // Conversion rates
  const conversionStats = await Deal.findAll({
    attributes: [
      'stage',
      [fn('COUNT', col('id')), 'count']
    ],
    where: whereClause,
    group: ['stage']
  });

  return {
    totalPipeline,
    recentWins: recentWins[0] || { count: 0, totalValue: 0 },
    conversionStats
  };
}

async function getPropertyStats(user) {
  const whereClause = { isActive: true };
  if (user.role === 'agent') {
    whereClause.listingAgentId = user.id;
  }

  // Active listings by status
  const listingsByStatus = await Property.findAll({
    attributes: [
      'status',
      'listingType',
      [fn('COUNT', col('id')), 'count'],
      [fn('SUM', col('total_square_footage')), 'totalSF']
    ],
    where: whereClause,
    group: ['status', 'listingType']
  });

  // Total inventory metrics
  const inventoryStats = await Property.findAll({
    attributes: [
      [fn('COUNT', col('id')), 'totalProperties'],
      [fn('SUM', col('total_square_footage')), 'totalSF'],
      [fn('AVG', col('occupancy_percentage')), 'avgOccupancy']
    ],
    where: whereClause
  });

  return {
    listingsByStatus,
    inventoryStats: inventoryStats[0]
  };
}

async function getRecentActivity(user, dateFrom) {
  const whereClause = {
    createdAt: { [Op.gte]: dateFrom }
  };
  
  if (user.role === 'agent') {
    whereClause.userId = user.id;
  }

  return await Activity.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName']
      },
      {
        model: Property,
        as: 'property',
        attributes: ['name']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: 5
  });
}

async function getAgentPerformance(user, dateFrom) {
  if (user.role === 'agent') {
    // Return individual performance
    const performance = await Deal.findAll({
      attributes: [
        [fn('COUNT', col('id')), 'totalDeals'],
        [fn('SUM', col('value')), 'totalValue'],
        [fn('SUM', col('commission')), 'totalCommission']
      ],
      where: {
        listingAgentId: user.id,
        createdAt: { [Op.gte]: dateFrom }
      }
    });
    
    return { individual: performance[0] };
  } else {
    // Return team performance
    const teamPerformance = await Deal.findAll({
      attributes: [
        [col('listingAgent.first_name'), 'firstName'],
        [col('listingAgent.last_name'), 'lastName'],
        [fn('COUNT', col('Deal.id')), 'totalDeals'],
        [fn('SUM', col('value')), 'totalValue'],
        [fn('SUM', col('commission')), 'totalCommission']
      ],
      include: [
        {
          model: User,
          as: 'listingAgent',
          attributes: []
        }
      ],
      where: {
        createdAt: { [Op.gte]: dateFrom }
      },
      group: ['listingAgent.id', 'listingAgent.first_name', 'listingAgent.last_name'],
      order: [[fn('SUM', col('value')), 'DESC']]
    });
    
    return { team: teamPerformance };
  }
}

module.exports = router;