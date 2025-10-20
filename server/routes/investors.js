const express = require('express');
const { query, body, validationResult } = require('express-validator');
const { Op, fn, col, literal } = require('sequelize');
const { Contact, Property, User, Activity, Deal } = require('../models');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { appLogger } = require('../config/logger');

const router = express.Router();
router.use(authMiddleware);

// GET /api/investors - Get investor database
router.get('/', permissionMiddleware('contacts', 'read'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isLength({ max: 100 }).withMessage('Search term too long'),
  query('investorType').optional().isString(),
  query('minBudget').optional().isFloat({ min: 0 }),
  query('maxBudget').optional().isFloat({ min: 0 }),
  query('propertyTypes').optional().isString(),
  query('markets').optional().isString(),
  query('leadStatus').optional().isIn(['cold', 'warm', 'hot', 'qualified', 'converted'])
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
      search,
      investorType,
      minBudget,
      maxBudget,
      propertyTypes,
      markets,
      leadStatus,
      sortBy = 'updatedAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {
      isActive: true,
      contactRole: { [Op.in]: ['investor', 'buyer'] }
    };

    // Apply user restrictions
    if (req.user.role === 'agent') {
      where.assignedAgentId = req.user.id;
    }

    // Apply filters
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { companyName: { [Op.iLike]: `%${search}%` } },
        { primaryEmail: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (leadStatus) {
      where.leadStatus = leadStatus;
    }

    // Budget filtering
    if (minBudget || maxBudget) {
      where[Op.or] = [
        ...(where[Op.or] || []),
        {
          [Op.and]: [
            minBudget ? { budgetMax: { [Op.gte]: parseFloat(minBudget) } } : {},
            maxBudget ? { budgetMin: { [Op.lte]: parseFloat(maxBudget) } } : {}
          ]
        }
      ];
    }

    // Property type filtering
    if (propertyTypes) {
      const types = propertyTypes.split(',');
      where.propertyTypeInterest = { [Op.overlap]: types };
    }

    // Market filtering
    if (markets) {
      const marketList = markets.split(',');
      where.preferredLocations = { [Op.overlap]: marketList };
    }

    // Investor type filtering (custom field)
    if (investorType) {
      where[literal("custom_fields->>'investorType'")] = investorType;
    }

    const { rows: investors, count } = await Contact.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'assignedAgent',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: Deal,
          as: 'deals',
          where: { isActive: true },
          required: false,
          attributes: ['id', 'name', 'stage', 'value', 'dealType']
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Enhance investor data with engagement metrics
    const enhancedInvestors = await Promise.all(investors.map(async (investor) => {
      const data = investor.toJSON();
      
      // Get recent activity count
      const activityCount = await Activity.count({
        where: {
          contactId: investor.id,
          createdAt: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }
      });

      // Calculate engagement score
      const engagementScore = calculateEngagementScore(data, activityCount);
      
      // Get investment history
      const investmentHistory = await Deal.findAll({
        where: {
          primaryContactId: investor.id,
          stage: 'won'
        },
        attributes: ['value', 'dealType', 'actualCloseDate'],
        order: [['actualCloseDate', 'DESC']],
        limit: 5
      });

      return {
        ...data,
        engagementMetrics: {
          score: engagementScore,
          recentActivityCount: activityCount,
          totalInvestments: investmentHistory.length,
          totalInvested: investmentHistory.reduce((sum, deal) => sum + (deal.value || 0), 0),
          lastActivity: data.lastContactDate
        },
        investmentHistory: investmentHistory.slice(0, 3) // Show only top 3
      };
    }));

    res.json({
      investors: enhancedInvestors,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      },
      summary: await getInvestorSummary(where)
    });
  } catch (error) {
    appLogger.error('Get investors error:', error);
    next(error);
  }
});

// POST /api/investors/match - Find matching properties for investors
router.post('/match', permissionMiddleware('properties', 'read'), [
  body('contactIds').optional().isArray().withMessage('Contact IDs must be an array'),
  body('contactIds.*').isUUID().withMessage('Invalid contact ID'),
  body('propertyId').optional().isUUID().withMessage('Invalid property ID'),
  body('criteria').optional().isObject().withMessage('Criteria must be an object')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { contactIds, propertyId, criteria } = req.body;
    let results = [];

    if (propertyId) {
      // Find investors for a specific property
      const property = await Property.findByPk(propertyId);
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }

      const matchingInvestors = await findInvestorsForProperty(property);
      results = [{
        property: property.toJSON(),
        matchingInvestors
      }];
    } else if (contactIds && contactIds.length > 0) {
      // Find properties for specific investors
      const investors = await Contact.findAll({
        where: {
          id: { [Op.in]: contactIds },
          contactRole: { [Op.in]: ['investor', 'buyer'] },
          isActive: true
        }
      });

      for (const investor of investors) {
        const matchingProperties = await findPropertiesForInvestor(investor);
        results.push({
          investor: investor.toJSON(),
          matchingProperties
        });
      }
    } else if (criteria) {
      // Find matches based on custom criteria
      const matches = await findMatchesByCriteria(criteria);
      results = matches;
    } else {
      // Auto-match all active investors with available properties
      const autoMatches = await performAutoMatching();
      results = autoMatches;
    }

    res.json({
      matches: results,
      matchedAt: new Date(),
      totalMatches: results.length
    });
  } catch (error) {
    appLogger.error('Investor matching error:', error);
    next(error);
  }
});

// POST /api/investors/distribute - Distribute offering to investor list
router.post('/distribute', permissionMiddleware('properties', 'read'), [
  body('propertyId').isUUID().withMessage('Property ID is required'),
  body('investorIds').isArray().withMessage('Investor IDs must be an array'),
  body('investorIds.*').isUUID().withMessage('Invalid investor ID'),
  body('message').optional().isString(),
  body('includeOM').optional().isBoolean(),
  body('subject').trim().isLength({ min: 1 }).withMessage('Subject is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { propertyId, investorIds, message, includeOM, subject } = req.body;

    const property = await Property.findByPk(propertyId, {
      include: [
        {
          model: User,
          as: 'listingAgent',
          attributes: ['firstName', 'lastName', 'email', 'phone']
        }
      ]
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const investors = await Contact.findAll({
      where: {
        id: { [Op.in]: investorIds },
        isActive: true
      }
    });

    if (investors.length === 0) {
      return res.status(400).json({ error: 'No valid investors found' });
    }

    // Create distribution record
    const distribution = {
      id: `dist_${Date.now()}`,
      propertyId,
      subject,
      message,
      includeOM,
      sentBy: req.user.id,
      sentAt: new Date(),
      recipients: [],
      metrics: {
        sent: 0,
        opened: 0,
        downloaded: 0,
        responded: 0
      }
    };

    // Send to each investor (in a real implementation, this would integrate with email service)
    for (const investor of investors) {
      const recipientRecord = {
        contactId: investor.id,
        email: investor.primaryEmail,
        status: 'sent',
        sentAt: new Date(),
        trackingId: `track_${Date.now()}_${investor.id}`
      };

      distribution.recipients.push(recipientRecord);
      distribution.metrics.sent++;

      // Create activity record
      await Activity.create({
        type: 'email',
        title: `Offering Distributed: ${property.name}`,
        description: `${subject}${message ? `\n\n${message}` : ''}`,
        userId: req.user.id,
        contactId: investor.id,
        propertyId: property.id,
        source: 'investor_distribution',
        customFields: {
          distributionId: distribution.id,
          trackingId: recipientRecord.trackingId
        }
      });

      // Update investor last contact date
      await investor.update({ lastContactDate: new Date() });
    }

    // Store distribution in property's custom fields for tracking
    await property.update({
      customFields: {
        ...property.customFields,
        distributions: [
          ...(property.customFields?.distributions || []),
          distribution
        ]
      }
    });

    res.json({
      message: 'Distribution sent successfully',
      distribution: {
        id: distribution.id,
        sent: distribution.metrics.sent,
        recipients: distribution.recipients.length
      },
      property: {
        id: property.id,
        name: property.name,
        address: property.address
      }
    });
  } catch (error) {
    appLogger.error('Distribution error:', error);
    next(error);
  }
});

// GET /api/investors/engagement - Track engagement metrics
router.get('/engagement', permissionMiddleware('contacts', 'read'), [
  query('propertyId').optional().isUUID(),
  query('distributionId').optional().isString(),
  query('timeframe').optional().isInt({ min: 1, max: 365 })
], async (req, res, next) => {
  try {
    const { propertyId, distributionId, timeframe = 30 } = req.query;
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - timeframe);

    let engagementData = {};

    if (distributionId) {
      // Get specific distribution engagement
      const property = await Property.findOne({
        where: {
          [`customFields.distributions`]: {
            [Op.contains]: [{ id: distributionId }]
          }
        }
      });

      if (property) {
        const distribution = property.customFields.distributions.find(d => d.id === distributionId);
        engagementData = await getDistributionEngagement(distribution);
      }
    } else if (propertyId) {
      // Get all engagement for a property
      engagementData = await getPropertyEngagement(propertyId, dateFrom);
    } else {
      // Get overall engagement metrics
      engagementData = await getOverallEngagement(dateFrom, req.user);
    }

    res.json({
      engagement: engagementData,
      timeframe: `${timeframe} days`,
      generatedAt: new Date()
    });
  } catch (error) {
    appLogger.error('Engagement tracking error:', error);
    next(error);
  }
});

// PUT /api/investors/:id/criteria - Update investor criteria
router.put('/:id/criteria', permissionMiddleware('contacts', 'update'), [
  body('propertyTypeInterest').optional().isArray(),
  body('budgetMin').optional().isFloat({ min: 0 }),
  body('budgetMax').optional().isFloat({ min: 0 }),
  body('preferredLocations').optional().isArray(),
  body('timeframe').optional().isIn(['immediate', '30_days', '60_days', '90_days', '6_months', '1_year', 'flexible'])
], async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const contact = await Contact.findByPk(id);
    if (!contact) {
      return res.status(404).json({ error: 'Investor not found' });
    }

    // Check access
    if (req.user.role === 'agent' && contact.assignedAgentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await contact.update(updateData);

    // Log the update
    await Activity.createSystemEvent({
      title: 'Investor Criteria Updated',
      description: `Investment criteria updated for ${contact.getDisplayName()}`,
      userId: req.user.id,
      contactId: contact.id,
      source: 'investor_management'
    });

    res.json({
      message: 'Investor criteria updated successfully',
      contact: contact.toJSON()
    });
  } catch (error) {
    appLogger.error('Update investor criteria error:', error);
    next(error);
  }
});

// Helper functions
async function findInvestorsForProperty(property) {
  const matchCriteria = {
    isActive: true,
    contactRole: { [Op.in]: ['investor', 'buyer'] },
    [Op.and]: [
      // Budget match
      {
        [Op.or]: [
          { budgetMin: { [Op.lte]: property.listPrice } },
          { budgetMin: null }
        ]
      },
      {
        [Op.or]: [
          { budgetMax: { [Op.gte]: property.listPrice } },
          { budgetMax: null }
        ]
      }
    ]
  };

  // Property type match
  if (property.propertyType) {
    matchCriteria.propertyTypeInterest = { [Op.contains]: [property.propertyType] };
  }

  // Location match
  if (property.city) {
    matchCriteria[Op.or] = [
      { preferredLocations: { [Op.contains]: [property.city] } },
      { preferredLocations: { [Op.eq]: [] } }
    ];
  }

  const investors = await Contact.findAll({
    where: matchCriteria,
    include: [
      {
        model: User,
        as: 'assignedAgent',
        attributes: ['firstName', 'lastName', 'email']
      }
    ],
    limit: 50
  });

  return investors.map(investor => {
    const match = calculateMatchScore(investor, property);
    return {
      ...investor.toJSON(),
      matchScore: match.score,
      matchReasons: match.reasons
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

async function findPropertiesForInvestor(investor) {
  const matchCriteria = {
    isActive: true,
    status: 'available'
  };

  // Budget filtering
  if (investor.budgetMin || investor.budgetMax) {
    matchCriteria.listPrice = {};
    if (investor.budgetMin) matchCriteria.listPrice[Op.gte] = investor.budgetMin;
    if (investor.budgetMax) matchCriteria.listPrice[Op.lte] = investor.budgetMax;
  }

  // Property type filtering
  if (investor.propertyTypeInterest && investor.propertyTypeInterest.length > 0) {
    matchCriteria.propertyType = { [Op.in]: investor.propertyTypeInterest };
  }

  // Location filtering
  if (investor.preferredLocations && investor.preferredLocations.length > 0) {
    matchCriteria.city = { [Op.in]: investor.preferredLocations };
  }

  const properties = await Property.findAll({
    where: matchCriteria,
    include: [
      {
        model: User,
        as: 'listingAgent',
        attributes: ['firstName', 'lastName', 'email']
      }
    ],
    limit: 20
  });

  return properties.map(property => {
    const match = calculateMatchScore(investor, property);
    return {
      ...property.toJSON(),
      matchScore: match.score,
      matchReasons: match.reasons
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

function calculateMatchScore(investor, property) {
  let score = 0;
  const reasons = [];

  // Budget match (30% weight)
  if (investor.budgetMin && investor.budgetMax) {
    if (property.listPrice >= investor.budgetMin && property.listPrice <= investor.budgetMax) {
      score += 30;
      reasons.push('Within budget range');
    } else if (property.listPrice < investor.budgetMax * 1.1) {
      score += 20;
      reasons.push('Close to budget');
    }
  } else if (investor.budgetMax && property.listPrice <= investor.budgetMax) {
    score += 25;
    reasons.push('Under maximum budget');
  }

  // Property type match (25% weight)
  if (investor.propertyTypeInterest && investor.propertyTypeInterest.includes(property.propertyType)) {
    score += 25;
    reasons.push('Preferred property type');
  }

  // Location match (20% weight)
  if (investor.preferredLocations && investor.preferredLocations.includes(property.city)) {
    score += 20;
    reasons.push('Preferred location');
  }

  // Square footage match (15% weight)
  if (investor.squareFootageMin && investor.squareFootageMax) {
    if (property.totalSquareFootage >= investor.squareFootageMin && 
        property.totalSquareFootage <= investor.squareFootageMax) {
      score += 15;
      reasons.push('Preferred size range');
    }
  }

  // Timeframe urgency (10% weight)
  if (investor.timeframe === 'immediate') {
    score += 10;
    reasons.push('Immediate timeline');
  } else if (investor.timeframe === '30_days') {
    score += 8;
    reasons.push('Near-term timeline');
  }

  return { score, reasons };
}

function calculateEngagementScore(investor, activityCount) {
  let score = 0;
  
  // Recent activity weight
  score += Math.min(activityCount * 10, 40);
  
  // Lead status weight
  const statusWeights = { cold: 5, warm: 15, hot: 25, qualified: 35, converted: 50 };
  score += statusWeights[investor.leadStatus] || 0;
  
  // Complete profile weight
  if (investor.budgetMin && investor.budgetMax) score += 10;
  if (investor.propertyTypeInterest && investor.propertyTypeInterest.length > 0) score += 10;
  if (investor.preferredLocations && investor.preferredLocations.length > 0) score += 10;
  
  return Math.min(score, 100);
}

async function getInvestorSummary(where) {
  const summary = await Contact.findAll({
    where,
    attributes: [
      [fn('COUNT', col('id')), 'totalInvestors'],
      [fn('AVG', col('budgetMax')), 'avgBudget'],
      [fn('SUM', literal('CASE WHEN "leadStatus" = \'qualified\' THEN 1 ELSE 0 END')), 'qualifiedCount'],
      [fn('SUM', literal('CASE WHEN "leadStatus" = \'hot\' THEN 1 ELSE 0 END')), 'hotCount']
    ]
  });

  return summary[0] || {};
}

async function getOverallEngagement(dateFrom, user) {
  // This is a simplified version - would need more complex tracking in production
  const activities = await Activity.findAll({
    where: {
      createdAt: { [Op.gte]: dateFrom },
      type: { [Op.in]: ['email', 'property_inquiry', 'document_download'] },
      ...(user.role === 'agent' ? { userId: user.id } : {})
    },
    include: [
      {
        model: Contact,
        as: 'contact',
        where: { contactRole: { [Op.in]: ['investor', 'buyer'] } },
        attributes: ['id']
      }
    ]
  });

  return {
    totalActivities: activities.length,
    uniqueInvestors: [...new Set(activities.map(a => a.contact?.id))].filter(Boolean).length,
    activityBreakdown: activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {})
  };
}

module.exports = router;