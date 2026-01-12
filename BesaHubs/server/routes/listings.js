const express = require('express');
const { query, body, validationResult } = require('express-validator');
const { Op, fn, col } = require('sequelize');
const { Property, User, Contact, Deal, Activity } = require('../models');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { appLogger } = require('../config/logger');

const router = express.Router();
router.use(authMiddleware);

// GET /api/listings - Get all active listings with enhanced filtering
router.get('/', permissionMiddleware('properties', 'read'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('listingType').optional().isIn(['sale', 'lease']).withMessage('Invalid listing type'),
  query('propertyType').optional().isString(),
  query('status').optional().isString(),
  query('marketingStatus').optional().isIn(['draft', 'published', 'expired', 'suspended']).withMessage('Invalid marketing status'),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('minSF').optional().isInt({ min: 0 }),
  query('maxSF').optional().isInt({ min: 0 }),
  query('city').optional().isString(),
  query('state').optional().isLength({ min: 2, max: 2 }),
  query('agentId').optional().isUUID(),
  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['ASC', 'DESC'])
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
      listingType,
      propertyType,
      status = 'available',
      marketingStatus,
      minPrice,
      maxPrice,
      minSF,
      maxSF,
      city,
      state,
      agentId,
      sortBy = 'updatedAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { 
      isActive: true,
      status: status || { [Op.in]: ['available', 'under_contract'] }
    };

    // Apply user role restrictions
    if (req.user.role === 'agent') {
      where.listingAgentId = req.user.id;
    } else if (agentId) {
      where.listingAgentId = agentId;
    }

    // Apply filters
    if (listingType) where.listingType = listingType;
    if (propertyType) where.propertyType = propertyType;
    if (marketingStatus) where.marketingStatus = marketingStatus;
    if (city) where.city = { [Op.iLike]: `%${city}%` };
    if (state) where.state = state.toUpperCase();

    // Price filtering
    if (minPrice || maxPrice) {
      where.listPrice = {};
      if (minPrice) where.listPrice[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.listPrice[Op.lte] = parseFloat(maxPrice);
    }

    // Square footage filtering
    if (minSF || maxSF) {
      where.totalSquareFootage = {};
      if (minSF) where.totalSquareFootage[Op.gte] = parseInt(minSF);
      if (maxSF) where.totalSquareFootage[Op.lte] = parseInt(maxSF);
    }

    const { rows: listings, count } = await Property.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'listingAgent',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: Contact,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'companyName', 'primaryEmail', 'primaryPhone']
        },
        {
          model: Deal,
          as: 'deals',
          where: { isActive: true },
          required: false,
          attributes: ['id', 'name', 'stage', 'value', 'probability']
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Add calculated fields
    const enhancedListings = listings.map(listing => {
      const data = listing.toJSON();
      
      // Calculate availability metrics
      data.availablePercentage = data.totalSquareFootage > 0 
        ? ((data.availableSquareFootage || data.totalSquareFootage) / data.totalSquareFootage * 100)
        : 0;
      
      // Calculate potential monthly income for lease properties
      if (data.listingType === 'lease' && data.leaseRate) {
        data.potentialMonthlyIncome = (data.leaseRate * data.totalSquareFootage) / 12;
      }
      
      // Add marketing metrics
      data.marketingMetrics = {
        daysListed: data.daysOnMarket,
        totalViews: data.views,
        totalInquiries: data.inquiries,
        showingsScheduled: data.showings,
        inquiryRate: data.views > 0 ? (data.inquiries / data.views * 100) : 0
      };
      
      return data;
    });

    // Calculate summary statistics
    const summaryStats = await Property.findAll({
      where,
      attributes: [
        [fn('COUNT', col('id')), 'totalListings'],
        [fn('SUM', col('totalSquareFootage')), 'totalSF'],
        [fn('SUM', col('availableSquareFootage')), 'availableSF'],
        [fn('AVG', col('listPrice')), 'avgPrice'],
        [fn('AVG', col('daysOnMarket')), 'avgDaysOnMarket'],
        [fn('AVG', col('pricePerSquareFoot')), 'avgPricePSF']
      ]
    });

    res.json({
      listings: enhancedListings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      },
      summary: summaryStats[0],
      filters: {
        listingType,
        propertyType,
        status,
        marketingStatus,
        priceRange: { min: minPrice, max: maxPrice },
        sfRange: { min: minSF, max: maxSF },
        location: { city, state },
        agentId
      }
    });
  } catch (error) {
    appLogger.error('Get listings error:', error);
    next(error);
  }
});

// GET /api/listings/availability - Get availability tracking data
router.get('/availability', permissionMiddleware('properties', 'read'), [
  query('propertyType').optional().isString(),
  query('submarket').optional().isString(),
  query('buildingClass').optional().isIn(['A', 'B', 'C'])
], async (req, res, next) => {
  try {
    const { propertyType, submarket, buildingClass } = req.query;
    
    const where = { 
      isActive: true,
      listingType: { [Op.in]: ['lease', 'both'] },
      status: { [Op.in]: ['available', 'under_contract'] }
    };

    if (req.user.role === 'agent') {
      where.listingAgentId = req.user.id;
    }

    if (propertyType) where.propertyType = propertyType;
    if (buildingClass) where.buildingClass = buildingClass;
    if (submarket) where.city = { [Op.iLike]: `%${submarket}%` };

    // Availability by property type
    const availabilityByType = await Property.findAll({
      where,
      attributes: [
        'propertyType',
        [fn('COUNT', col('id')), 'totalProperties'],
        [fn('SUM', col('totalSquareFootage')), 'totalSF'],
        [fn('SUM', col('availableSquareFootage')), 'availableSF'],
        [fn('AVG', col('occupancyPercentage')), 'avgOccupancy'],
        [fn('AVG', col('leaseRate')), 'avgLeaseRate']
      ],
      group: ['propertyType'],
      order: [['propertyType', 'ASC']]
    });

    // Suite sizes analysis
    const suiteSizes = await Property.findAll({
      where: {
        ...where,
        availableSquareFootage: { [Op.gt]: 0 }
      },
      attributes: [
        'id',
        'name',
        'address',
        'city',
        'availableSquareFootage',
        'leaseRate',
        'leaseType',
        'availabilityDate'
      ],
      include: [
        {
          model: User,
          as: 'listingAgent',
          attributes: ['firstName', 'lastName', 'phone', 'email']
        }
      ],
      order: [['availableSquareFootage', 'ASC']]
    });

    // Rent roll analysis for multi-tenant properties
    const rentRollData = await Property.findAll({
      where: {
        ...where,
        tenantRoster: { [Op.not]: null }
      },
      attributes: [
        'id',
        'name',
        'address',
        'totalSquareFootage',
        'occupancyPercentage',
        'tenantRoster',
        'netOperatingIncome'
      ]
    });

    // Vacancy trends (simplified - would need historical data)
    const vacancyTrends = await Property.findAll({
      where,
      attributes: [
        [fn('DATE_TRUNC', 'month', col('updatedAt')), 'month'],
        [fn('AVG', col('vacancyPercentage')), 'avgVacancy'],
        [fn('COUNT', col('id')), 'propertyCount']
      ],
      group: [fn('DATE_TRUNC', 'month', col('updatedAt'))],
      order: [[fn('DATE_TRUNC', 'month', col('updatedAt')), 'ASC']],
      limit: 12
    });

    res.json({
      availabilityByType,
      suiteSizes,
      rentRollData,
      vacancyTrends,
      summary: {
        totalAvailableSF: suiteSizes.reduce((sum, prop) => sum + (prop.availableSquareFootage || 0), 0),
        avgVacancyRate: availabilityByType.reduce((sum, type) => sum + (100 - (type.dataValues.avgOccupancy || 0)), 0) / (availabilityByType.length || 1),
        avgLeaseRate: availabilityByType.reduce((sum, type) => sum + (type.dataValues.avgLeaseRate || 0), 0) / (availabilityByType.length || 1)
      }
    });
  } catch (error) {
    appLogger.error('Availability tracking error:', error);
    next(error);
  }
});

// PUT /api/listings/:id/marketing-status - Update marketing status
router.put('/:id/marketing-status', permissionMiddleware('properties', 'update'), [
  body('marketingStatus').isIn(['draft', 'published', 'expired', 'suspended']).withMessage('Invalid marketing status'),
  body('notes').optional().isString()
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
    const { marketingStatus, notes } = req.body;

    const property = await Property.findByPk(id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check ownership
    if (req.user.role === 'agent' && property.listingAgentId !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own property listings' });
    }

    const oldStatus = property.marketingStatus;
    await property.update({ 
      marketingStatus,
      notes: notes || property.notes
    });

    // Log status change
    await Activity.createSystemEvent({
      title: 'Marketing Status Updated',
      description: `Marketing status changed from ${oldStatus} to ${marketingStatus}${notes ? `: ${notes}` : ''}`,
      userId: req.user.id,
      propertyId: property.id,
      source: 'listing_management'
    });

    res.json({
      message: 'Marketing status updated successfully',
      property: {
        id: property.id,
        name: property.name,
        marketingStatus: property.marketingStatus,
        updatedAt: property.updatedAt
      }
    });
  } catch (error) {
    appLogger.error('Update marketing status error:', error);
    next(error);
  }
});

// POST /api/listings/:id/syndicate - Syndicate listing to external portals
router.post('/:id/syndicate', permissionMiddleware('properties', 'update'), [
  body('portals').isArray().withMessage('Portals must be an array'),
  body('portals.*').isIn(['website', 'loopnet', 'crexi', 'showcase', 'costar']).withMessage('Invalid portal'),
  body('customMessage').optional().isString()
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
    const { portals, customMessage } = req.body;

    const property = await Property.findByPk(id, {
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

    // Check ownership
    if (req.user.role === 'agent' && property.listingAgentId !== req.user.id) {
      return res.status(403).json({ error: 'You can only syndicate your own property listings' });
    }

    // Check if property is ready for syndication
    const requiredFields = ['name', 'address', 'city', 'state', 'propertyType', 'listPrice'];
    const missingFields = requiredFields.filter(field => !property[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Property missing required fields for syndication',
        missingFields
      });
    }

    // Update syndication status
    const currentSyndication = property.customFields?.syndication || {};
    const syndicationResults = {};

    for (const portal of portals) {
      // In a real implementation, this would call external APIs
      // For now, we'll simulate the process
      syndicationResults[portal] = {
        status: 'success',
        syndicatedAt: new Date(),
        listingId: `${portal}_${property.id}_${Date.now()}`,
        message: `Successfully syndicated to ${portal}`
      };
    }

    await property.update({
      marketingStatus: 'published',
      customFields: {
        ...property.customFields,
        syndication: {
          ...currentSyndication,
          ...syndicationResults,
          lastSyndicatedAt: new Date()
        }
      }
    });

    // Log syndication activity
    await Activity.createSystemEvent({
      title: 'Listing Syndicated',
      description: `Property syndicated to ${portals.join(', ')}${customMessage ? `: ${customMessage}` : ''}`,
      userId: req.user.id,
      propertyId: property.id,
      source: 'syndication'
    });

    res.json({
      message: 'Listing syndicated successfully',
      syndicationResults,
      property: {
        id: property.id,
        name: property.name,
        marketingStatus: property.marketingStatus,
        syndication: property.customFields?.syndication
      }
    });
  } catch (error) {
    appLogger.error('Syndication error:', error);
    next(error);
  }
});

// GET /api/listings/:id/performance - Get listing performance metrics
router.get('/:id/performance', permissionMiddleware('properties', 'read'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { timeframe = '30' } = req.query;
    
    const property = await Property.findByPk(id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check access
    if (req.user.role === 'agent' && property.listingAgentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const daysBack = parseInt(timeframe);
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysBack);

    // Get activity metrics
    const activityMetrics = await Activity.findAll({
      where: {
        propertyId: id,
        createdAt: { [Op.gte]: dateFrom }
      },
      attributes: [
        'type',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['type']
    });

    // Get inquiry details
    const inquiries = await Activity.findAll({
      where: {
        propertyId: id,
        type: 'property_inquiry',
        createdAt: { [Op.gte]: dateFrom }
      },
      include: [
        {
          model: Contact,
          as: 'contact',
          attributes: ['firstName', 'lastName', 'companyName', 'primaryEmail']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calculate performance metrics
    const performanceMetrics = {
      daysOnMarket: property.daysOnMarket,
      totalViews: property.views,
      totalInquiries: property.inquiries,
      totalShowings: property.showings,
      inquiryRate: property.views > 0 ? (property.inquiries / property.views * 100) : 0,
      showingConversionRate: property.inquiries > 0 ? (property.showings / property.inquiries * 100) : 0,
      recentActivity: activityMetrics.map(metric => ({
        type: metric.type,
        count: parseInt(metric.dataValues.count)
      })),
      recentInquiries: inquiries.length,
      avgDaysOnMarketForType: await getAvgDaysOnMarketForType(property.propertyType, property.city),
      competitivePosition: await getCompetitivePosition(property)
    };

    res.json({
      property: {
        id: property.id,
        name: property.name,
        address: property.address,
        listPrice: property.listPrice,
        propertyType: property.propertyType
      },
      performanceMetrics,
      inquiries,
      timeframe: `${daysBack} days`
    });
  } catch (error) {
    appLogger.error('Listing performance error:', error);
    next(error);
  }
});

// Helper functions
async function getAvgDaysOnMarketForType(propertyType, city) {
  try {
    const result = await Property.findAll({
      attributes: [[fn('AVG', col('daysOnMarket')), 'avgDays']],
      where: {
        propertyType,
        city: { [Op.iLike]: `%${city}%` },
        isActive: true,
        status: { [Op.in]: ['available', 'under_contract', 'sold', 'leased'] }
      }
    });
    
    return parseFloat(result[0]?.dataValues?.avgDays || 0);
  } catch (error) {
    appLogger.error('Error calculating avg days on market:', error);
    return 0;
  }
}

async function getCompetitivePosition(property) {
  try {
    const competitors = await Property.findAll({
      where: {
        propertyType: property.propertyType,
        city: property.city,
        isActive: true,
        status: 'available',
        id: { [Op.ne]: property.id }
      },
      attributes: ['listPrice', 'pricePerSquareFoot', 'totalSquareFootage'],
      limit: 10
    });

    if (competitors.length === 0) {
      return { position: 'No comparable properties found' };
    }

    const prices = competitors.map(comp => comp.listPrice).filter(price => price > 0);
    const pricePSF = competitors.map(comp => comp.pricePerSquareFoot).filter(price => price > 0);
    
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const avgPricePSF = pricePSF.reduce((sum, price) => sum + price, 0) / pricePSF.length;
    
    return {
      comparableCount: competitors.length,
      avgMarketPrice: avgPrice,
      avgMarketPricePSF: avgPricePSF,
      pricePosition: property.listPrice > avgPrice ? 'above_market' : 'below_market',
      priceDifference: ((property.listPrice - avgPrice) / avgPrice * 100).toFixed(2)
    };
  } catch (error) {
    appLogger.error('Error calculating competitive position:', error);
    return { error: 'Unable to calculate competitive position' };
  }
}

module.exports = router;