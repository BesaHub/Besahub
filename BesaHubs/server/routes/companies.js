const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { Op } = require('sequelize');

const { Company, Contact, User, Deal, Property, Activity } = require('../models');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { appLogger } = require('../config/logger');
const { avatarUpload } = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/companies - Get all companies
router.get('/', permissionMiddleware('contacts', 'read'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isLength({ max: 100 }).withMessage('Search term too long'),
  query('industry').optional().isLength({ max: 100 }).withMessage('Industry name too long'),
  query('companyType').optional().isIn(['corporation', 'llc', 'partnership', 'sole_proprietorship', 'trust', 'non_profit', 'government', 'other']).withMessage('Invalid company type'),
  query('leadStatus').optional().isIn(['cold', 'warm', 'hot', 'qualified', 'customer', 'inactive']).withMessage('Invalid lead status')
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
      industry,
      companyType,
      leadStatus,
      sortBy = 'updatedAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { isActive: true };

    // Apply filters
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { legalName: { [Op.iLike]: `%${search}%` } },
        { dbaName: { [Op.iLike]: `%${search}%` } },
        { primaryEmail: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (industry) {
      where.industry = industry;
    }

    if (companyType) {
      where.companyType = companyType;
    }

    if (leadStatus) {
      where.leadStatus = leadStatus;
    }

    // Non-admin users only see their assigned companies or unassigned ones
    if (!['admin', 'manager'].includes(req.user.role)) {
      where[Op.or] = [
        { assignedAgentId: req.user.id },
        { assignedAgentId: null }
      ];
    }

    const { rows: companies, count } = await Company.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'assignedAgent',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Contact,
          as: 'primaryContact',
          attributes: ['id', 'firstName', 'lastName', 'primaryEmail', 'primaryPhone']
        },
        {
          model: Contact,
          as: 'contacts',
          attributes: ['id'],
          separate: false
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      companies,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    appLogger.error('Get companies error:', error);
    next(error);
  }
});

// GET /api/companies/:id - Get company by ID
router.get('/:id', permissionMiddleware('contacts', 'read'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const company = await Company.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedAgent',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: Contact,
          as: 'primaryContact',
          attributes: ['id', 'firstName', 'lastName', 'primaryEmail', 'primaryPhone', 'title']
        },
        {
          model: Contact,
          as: 'contacts',
          attributes: ['id', 'firstName', 'lastName', 'title', 'primaryEmail', 'primaryPhone']
        }
      ]
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check access permissions for non-admin users
    if (!['admin', 'manager'].includes(req.user.role)) {
      if (company.assignedAgentId && company.assignedAgentId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Get related deals and properties
    const [deals, ownedProperties] = await Promise.all([
      Deal.findAll({
        include: [
          {
            model: Contact,
            as: 'primaryContact',
            where: { companyId: id }
          },
          {
            model: Property,
            as: 'property',
            attributes: ['id', 'name', 'address', 'city', 'state']
          }
        ],
        limit: 10,
        order: [['createdAt', 'DESC']]
      }),
      Property.findAll({
        include: [
          {
            model: Contact,
            as: 'owner',
            where: { companyId: id }
          }
        ],
        attributes: ['id', 'name', 'propertyType', 'status', 'address', 'city', 'state'],
        limit: 10
      })
    ]);

    res.json({ 
      company: {
        ...company.toJSON(),
        relatedDeals: deals,
        ownedProperties
      }
    });
  } catch (error) {
    appLogger.error('Get company error:', error);
    next(error);
  }
});

// POST /api/companies - Create new company
router.post('/', permissionMiddleware('contacts', 'create'), [
  body('name').trim().isLength({ min: 1 }).withMessage('Company name is required'),
  body('industry').optional().isIn(['real_estate', 'commercial_real_estate', 'real_estate_investment', 'real_estate_development', 'property_management', 'retail', 'hospitality', 'healthcare', 'manufacturing', 'technology', 'finance', 'legal', 'construction', 'other']).withMessage('Invalid industry. Valid options: real_estate, commercial_real_estate, real_estate_investment, real_estate_development, property_management, retail, hospitality, healthcare, manufacturing, technology, finance, legal, construction, other'),
  body('companyType').optional().isIn(['corporation', 'llc', 'partnership', 'sole_proprietorship', 'trust', 'non_profit', 'government', 'other']).withMessage('Invalid company type. Valid options: corporation, llc, partnership, sole_proprietorship, trust, non_profit, government, other'),
  body('primaryEmail').optional().isEmail().withMessage('Invalid email format'),
  body('primaryPhone').optional().matches(/^[\d\s\-\+\(\)\.]+$/).withMessage('Invalid phone number. Allowed formats: "555-1234", "(555) 123-4567", "+1-555-123-4567"'),
  body('annualRevenue').optional().isFloat({ min: 0 }).withMessage('Annual revenue must be positive'),
  body('employeeCount').optional().isInt({ min: 0 }).withMessage('Employee count must be positive integer')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Check if company with same name already exists
    const existingCompany = await Company.findOne({
      where: { name: req.body.name }
    });
    if (existingCompany) {
      return res.status(400).json({ error: 'Company with this name already exists' });
    }

    const companyData = {
      ...req.body,
      assignedAgentId: req.body.assignedAgentId || req.user.id
    };

    const company = await Company.create(companyData);

    // Create activity log
    await Activity.createSystemEvent({
      title: 'Company Created',
      description: `New company "${company.name}" was added to the system`,
      userId: req.user.id,
      companyId: company.id,
      source: 'company_management'
    });

    const createdCompany = await Company.findByPk(company.id, {
      include: [
        {
          model: User,
          as: 'assignedAgent',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.status(201).json({
      message: 'Company created successfully',
      company: createdCompany
    });
  } catch (error) {
    appLogger.error('Create company error:', error);
    next(error);
  }
});

// PUT /api/companies/:id - Update company
router.put('/:id', permissionMiddleware('contacts', 'update'), [
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Company name cannot be empty'),
  body('primaryEmail').optional().isEmail().withMessage('Invalid email format'),
  body('primaryPhone').optional().matches(/^[\d\s\-\+\(\)\.]+$/).withMessage('Invalid phone number. Allowed formats: "555-1234", "(555) 123-4567", "+1-555-123-4567"'),
  body('annualRevenue').optional().isFloat({ min: 0 }).withMessage('Annual revenue must be positive'),
  body('employeeCount').optional().isInt({ min: 0 }).withMessage('Employee count must be positive integer'),
  body('leadStatus').optional().isIn(['cold', 'warm', 'hot', 'qualified', 'customer', 'inactive']).withMessage('Invalid lead status')
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
    const company = await Company.findByPk(id);

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check access permissions
    if (!['admin', 'manager'].includes(req.user.role)) {
      if (company.assignedAgentId && company.assignedAgentId !== req.user.id) {
        return res.status(403).json({ error: 'You can only edit your assigned companies' });
      }
    }

    // Check for name conflicts
    if (req.body.name && req.body.name !== company.name) {
      const existingCompany = await Company.findOne({
        where: { 
          name: req.body.name,
          id: { [Op.ne]: id }
        }
      });
      if (existingCompany) {
        return res.status(400).json({ error: 'Another company with this name already exists' });
      }
    }

    const oldLeadStatus = company.leadStatus;
    await company.update(req.body);

    // Create activity log for lead status changes
    if (req.body.leadStatus && req.body.leadStatus !== oldLeadStatus) {
      await Activity.createSystemEvent({
        title: 'Company Lead Status Changed',
        description: `Lead status changed from "${oldLeadStatus}" to "${req.body.leadStatus}" for ${company.name}`,
        userId: req.user.id,
        companyId: company.id,
        source: 'company_management'
      });
    }

    const updatedCompany = await Company.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedAgent',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Contact,
          as: 'primaryContact',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    res.json({
      message: 'Company updated successfully',
      company: updatedCompany
    });
  } catch (error) {
    appLogger.error('Update company error:', error);
    next(error);
  }
});

// DELETE /api/companies/:id - Soft delete company
router.delete('/:id', permissionMiddleware('contacts', 'delete'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = await Company.findByPk(id);

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check access permissions
    if (!['admin', 'manager'].includes(req.user.role)) {
      if (company.assignedAgentId && company.assignedAgentId !== req.user.id) {
        return res.status(403).json({ error: 'You can only delete your assigned companies' });
      }
    }

    await company.update({ isActive: false });

    // Create activity log
    await Activity.createSystemEvent({
      title: 'Company Deleted',
      description: `Company "${company.name}" was removed from the system`,
      userId: req.user.id,
      companyId: company.id,
      source: 'company_management'
    });

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    appLogger.error('Delete company error:', error);
    next(error);
  }
});

// POST /api/companies/:id/assign - Assign company to agent
router.post('/:id/assign', permissionMiddleware('contacts', 'update'), [
  body('agentId').isUUID().withMessage('Valid agent ID is required')
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
    const { agentId } = req.body;

    // Only managers and admins can reassign companies
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only managers and admins can assign companies' });
    }

    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const agent = await User.findByPk(agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    await company.update({ assignedAgentId: agentId });

    // Create activity log
    await Activity.createSystemEvent({
      title: 'Company Reassigned',
      description: `Company "${company.name}" was assigned to ${agent.getFullName()}`,
      userId: req.user.id,
      companyId: company.id,
      source: 'company_management'
    });

    res.json({
      message: 'Company assigned successfully',
      company: await Company.findByPk(id, {
        include: [
          {
            model: User,
            as: 'assignedAgent',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      })
    });
  } catch (error) {
    appLogger.error('Assign company error:', error);
    next(error);
  }
});

// GET /api/companies/:id/matching-properties - Get properties matching company's investment criteria
router.get('/:id/matching-properties', permissionMiddleware('contacts', 'read'), [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
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
    const limit = parseInt(req.query.limit) || 10;

    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check access permissions
    if (!['admin', 'manager'].includes(req.user.role)) {
      if (company.assignedAgentId && company.assignedAgentId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const criteria = company.investmentCriteria || {};
    const where = { 
      isActive: true,
      status: { [Op.in]: ['available', 'coming_soon'] }
    };

    // Apply investment criteria filters
    if (criteria.minInvestment || criteria.maxInvestment) {
      where.listPrice = {};
      if (criteria.minInvestment) where.listPrice[Op.gte] = criteria.minInvestment;
      if (criteria.maxInvestment) where.listPrice[Op.lte] = criteria.maxInvestment;
    }

    if (criteria.preferredLocations && criteria.preferredLocations.length > 0) {
      where[Op.or] = criteria.preferredLocations.map(location => ({
        [Op.or]: [
          { city: { [Op.iLike]: `%${location}%` } },
          { state: { [Op.iLike]: `%${location}%` } }
        ]
      }));
    }

    if (company.propertyTypes && company.propertyTypes.length > 0) {
      where.propertyType = { [Op.in]: company.propertyTypes };
    }

    if (criteria.capRateRange) {
      where.capRate = {};
      if (criteria.capRateRange.min) where.capRate[Op.gte] = criteria.capRateRange.min;
      if (criteria.capRateRange.max) where.capRate[Op.lte] = criteria.capRateRange.max;
    }

    const properties = await Property.findAll({
      where,
      include: [
        {
          model: User,
          as: 'listingAgent',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        }
      ],
      order: [['updatedAt', 'DESC']],
      limit
    });

    res.json({ 
      properties,
      matchingCriteria: criteria,
      totalFound: properties.length
    });
  } catch (error) {
    appLogger.error('Get matching properties error:', error);
    next(error);
  }
});

// GET /api/companies/search/investors - Get investment companies
router.get('/search/investors', permissionMiddleware('contacts', 'read'), [
  query('minPortfolioValue').optional().isFloat({ min: 0 }).withMessage('Minimum portfolio value must be positive'),
  query('propertyTypes').optional().isString().withMessage('Property types must be a comma-separated string')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { minPortfolioValue, propertyTypes } = req.query;

    const where = {
      isActive: true,
      industry: { [Op.in]: ['real_estate_investment', 'real_estate_development'] },
      leadStatus: { [Op.in]: ['qualified', 'hot', 'warm'] }
    };

    if (minPortfolioValue) {
      where.portfolioValue = { [Op.gte]: parseFloat(minPortfolioValue) };
    }

    if (propertyTypes) {
      const types = propertyTypes.split(',').map(t => t.trim());
      where.propertyTypes = { [Op.overlap]: types };
    }

    // Non-admin users only see their assigned companies
    if (!['admin', 'manager'].includes(req.user.role)) {
      where.assignedAgentId = req.user.id;
    }

    const companies = await Company.findAll({
      where,
      include: [
        {
          model: User,
          as: 'assignedAgent',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: Contact,
          as: 'primaryContact',
          attributes: ['id', 'firstName', 'lastName', 'primaryEmail']
        }
      ],
      order: [['portfolioValue', 'DESC']],
      limit: 50
    });

    res.json({ companies });
  } catch (error) {
    appLogger.error('Get investor companies error:', error);
    next(error);
  }
});

// POST /api/companies/:id/logo - Upload company logo
router.post('/:id/logo', permissionMiddleware('contacts', 'update'), avatarUpload, async (req, res, next) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check permissions for non-admin users
    if (!['admin', 'manager'].includes(req.user.role) && company.assignedAgentId !== req.user.id) {
      return res.status(403).json({ error: 'You can only upload logos to your assigned companies' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No logo uploaded' });
    }

    const logoPath = `/uploads/avatars/${req.file.filename}`;
    await company.update({ logo: logoPath });

    res.json({
      message: 'Logo uploaded successfully',
      logo: logoPath,
      company
    });
  } catch (error) {
    appLogger.error('Upload logo error:', error);
    next(error);
  }
});

// DELETE /api/companies/:id/logo - Remove company logo
router.delete('/:id/logo', permissionMiddleware('contacts', 'update'), async (req, res, next) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check permissions for non-admin users
    if (!['admin', 'manager'].includes(req.user.role) && company.assignedAgentId !== req.user.id) {
      return res.status(403).json({ error: 'You can only remove logos from your assigned companies' });
    }

    await company.update({ logo: null });

    res.json({
      message: 'Logo removed successfully',
      company
    });
  } catch (error) {
    appLogger.error('Remove logo error:', error);
    next(error);
  }
});

module.exports = router;