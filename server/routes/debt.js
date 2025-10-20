const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { Op } = require('sequelize');

const { Debt, Property, Company, User, Activity } = require('../models');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { cacheMiddleware, invalidateCache } = require('../middleware/cache');
const { appLogger } = require('../config/logger');
const DatabaseWrapper = require('../utils/dbWrapper');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/debt - Get all debt records
router.get('/', 
  permissionMiddleware('properties', 'read'),
  cacheMiddleware((req) => `crm:debt:${req.query.page || 1}:${req.query.limit || 20}:${JSON.stringify(req.query)}`, 600),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isLength({ max: 100 }).withMessage('Search term too long'),
    query('loanType').optional().isIn(['mortgage', 'bridge', 'mezzanine', 'construction', 'other']).withMessage('Invalid loan type'),
    query('propertyId').optional().isUUID().withMessage('Invalid property ID'),
    query('lenderId').optional().isUUID().withMessage('Invalid lender ID')
  ], 
  async (req, res, next) => {
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
        loanType,
        propertyId,
        lenderId,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Apply filters
      if (search) {
        where[Op.or] = [
          { notes: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (loanType) {
        where.loanType = loanType;
      }

      if (propertyId) {
        where.propertyId = propertyId;
      }

      if (lenderId) {
        where.lenderId = lenderId;
      }

      // Fallback demo data - 3 debts with different maturity dates
      const fallbackDebts = [
        {
          id: '1',
          amount: 12000000,
          interestRate: 4.75,
          maturityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          loanType: 'mortgage',
          dscr: 1.45,
          notes: 'Senior mortgage on office property',
          property: { id: '1', name: 'Downtown Office Tower', address: '123 Main St', city: 'New York', state: 'NY', propertyType: 'office' },
          lender: { id: '1', name: 'First National Bank', industry: 'Banking', website: 'www.firstnational.com', primaryEmail: 'loans@firstnational.com', primaryPhone: '555-1000' }
        },
        {
          id: '2',
          amount: 6500000,
          interestRate: 6.25,
          maturityDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          loanType: 'bridge',
          dscr: 1.20,
          notes: 'Bridge loan for warehouse acquisition',
          property: { id: '3', name: 'Industrial Warehouse Complex', address: '789 Industrial Park Dr', city: 'Chicago', state: 'IL', propertyType: 'industrial' },
          lender: { id: '2', name: 'Capital Bridge Lending', industry: 'Finance', website: 'www.capitalbridge.com', primaryEmail: 'info@capitalbridge.com', primaryPhone: '555-2000' }
        },
        {
          id: '3',
          amount: 18000000,
          interestRate: 5.15,
          maturityDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          loanType: 'mortgage',
          dscr: 1.55,
          notes: 'Permanent financing on multifamily',
          property: { id: '4', name: 'Luxury Apartment Complex', address: '321 Residential Ave', city: 'Miami', state: 'FL', propertyType: 'multifamily' },
          lender: { id: '3', name: 'Metropolitan Life Insurance', industry: 'Insurance', website: 'www.metlife.com', primaryEmail: 'cre@metlife.com', primaryPhone: '555-3000' }
        }
      ];

      const result = await DatabaseWrapper.query(
        async () => {
          const { rows, count } = await Debt.findAndCountAll({
            where,
            include: [
              {
                model: Property,
                as: 'property',
                attributes: ['id', 'name', 'address', 'city', 'state', 'propertyType']
              },
              {
                model: Company,
                as: 'lender',
                attributes: ['id', 'name', 'industry', 'website', 'primaryEmail', 'primaryPhone']
              }
            ],
            order: [[sortBy, sortOrder.toUpperCase()]],
            limit: parseInt(limit),
            offset: parseInt(offset)
          });
          return { debts: rows, count };
        },
        {
          timeout: 5000,
          operation: 'fetch debt records',
          fallback: { debts: fallbackDebts, count: fallbackDebts.length }
        }
      );

      res.json({
        debts: result.data.debts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(result.data.count / limit),
          totalItems: result.data.count,
          itemsPerPage: parseInt(limit)
        },
        usingFallback: result.usingFallback
      });
    } catch (error) {
      appLogger.error('Get debt records error:', error);
      next(error);
    }
  }
);

// GET /api/debt/:id - Get debt by ID
router.get('/:id', permissionMiddleware('properties', 'read'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const debt = await Debt.findByPk(id, {
      include: [
        {
          model: Property,
          as: 'property',
          include: [
            {
              model: User,
              as: 'listingAgent',
              attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
            }
          ]
        },
        {
          model: Company,
          as: 'lender',
          attributes: ['id', 'name', 'industry', 'website', 'primaryEmail', 'primaryPhone']
        }
      ]
    });

    if (!debt) {
      return res.status(404).json({ error: 'Debt record not found' });
    }

    res.json({ debt });
  } catch (error) {
    appLogger.error('Get debt error:', error);
    next(error);
  }
});

// POST /api/debt - Create new debt
router.post('/', 
  permissionMiddleware('properties', 'create'), 
  [
    body('propertyId').notEmpty().isUUID().withMessage('Valid property ID is required'),
    body('lenderId').notEmpty().isUUID().withMessage('Valid lender ID is required'),
    body('amount').notEmpty().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('interestRate').notEmpty().isFloat({ min: 0, max: 100 }).withMessage('Interest rate must be between 0 and 100'),
    body('maturityDate').notEmpty().isISO8601().withMessage('Valid maturity date is required'),
    body('dscr').optional().isFloat({ min: 0 }).withMessage('DSCR must be a positive number'),
    body('loanType').optional().isIn(['mortgage', 'bridge', 'mezzanine', 'construction', 'other']).withMessage('Invalid loan type'),
    body('notes').optional().isLength({ max: 5000 }).withMessage('Notes too long')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const debtData = req.body;

      // Validate relationships
      const property = await Property.findByPk(debtData.propertyId);
      if (!property) {
        return res.status(400).json({ error: 'Property not found' });
      }

      const lender = await Company.findByPk(debtData.lenderId);
      if (!lender) {
        return res.status(400).json({ error: 'Lender not found' });
      }

      const debt = await Debt.create(debtData);

      // Create activity log
      await Activity.createSystemEvent({
        title: 'Debt Created',
        description: `New ${debt.loanType} debt of $${debt.amount} created for property "${property.name}"`,
        userId: req.user.id,
        propertyId: debt.propertyId,
        companyId: debt.lenderId,
        source: 'debt_management'
      });

      const createdDebt = await Debt.findByPk(debt.id, {
        include: [
          {
            model: Property,
            as: 'property',
            attributes: ['id', 'name', 'address', 'city', 'state']
          },
          {
            model: Company,
            as: 'lender',
            attributes: ['id', 'name', 'industry', 'primaryEmail']
          }
        ]
      });

      // Invalidate debt cache
      await invalidateCache('crm:debt:*');

      res.status(201).json({
        message: 'Debt created successfully',
        debt: createdDebt
      });
    } catch (error) {
      appLogger.error('Create debt error:', error);
      next(error);
    }
  }
);

// PUT /api/debt/:id - Update debt
router.put('/:id', 
  permissionMiddleware('properties', 'update'), 
  [
    body('propertyId').optional().isUUID().withMessage('Invalid property ID'),
    body('lenderId').optional().isUUID().withMessage('Invalid lender ID'),
    body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('interestRate').optional().isFloat({ min: 0, max: 100 }).withMessage('Interest rate must be between 0 and 100'),
    body('maturityDate').optional().isISO8601().withMessage('Invalid maturity date'),
    body('dscr').optional().isFloat({ min: 0 }).withMessage('DSCR must be a positive number'),
    body('loanType').optional().isIn(['mortgage', 'bridge', 'mezzanine', 'construction', 'other']).withMessage('Invalid loan type'),
    body('notes').optional().isLength({ max: 5000 }).withMessage('Notes too long')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const debt = await Debt.findByPk(id);

      if (!debt) {
        return res.status(404).json({ error: 'Debt record not found' });
      }

      // Validate relationships if being updated
      if (req.body.propertyId) {
        const property = await Property.findByPk(req.body.propertyId);
        if (!property) {
          return res.status(400).json({ error: 'Property not found' });
        }
      }

      if (req.body.lenderId) {
        const lender = await Company.findByPk(req.body.lenderId);
        if (!lender) {
          return res.status(400).json({ error: 'Lender not found' });
        }
      }

      await debt.update(req.body);

      // Create activity log
      await Activity.createSystemEvent({
        title: 'Debt Updated',
        description: `Debt record for property ID ${debt.propertyId} was updated`,
        userId: req.user.id,
        propertyId: debt.propertyId,
        companyId: debt.lenderId,
        source: 'debt_management'
      });

      const updatedDebt = await Debt.findByPk(id, {
        include: [
          {
            model: Property,
            as: 'property',
            attributes: ['id', 'name', 'address', 'city', 'state']
          },
          {
            model: Company,
            as: 'lender',
            attributes: ['id', 'name', 'industry', 'primaryEmail']
          }
        ]
      });

      // Invalidate debt cache
      await invalidateCache('crm:debt:*');

      res.json({
        message: 'Debt updated successfully',
        debt: updatedDebt
      });
    } catch (error) {
      appLogger.error('Update debt error:', error);
      next(error);
    }
  }
);

// DELETE /api/debt/:id - Delete debt
router.delete('/:id', permissionMiddleware('properties', 'delete'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const debt = await Debt.findByPk(id);

    if (!debt) {
      return res.status(404).json({ error: 'Debt record not found' });
    }

    // Create activity log before deletion
    await Activity.createSystemEvent({
      title: 'Debt Deleted',
      description: `Debt record of $${debt.amount} for property ID ${debt.propertyId} was deleted`,
      userId: req.user.id,
      propertyId: debt.propertyId,
      companyId: debt.lenderId,
      source: 'debt_management'
    });

    await debt.destroy();

    // Invalidate debt cache
    await invalidateCache('crm:debt:*');

    res.json({ message: 'Debt deleted successfully' });
  } catch (error) {
    appLogger.error('Delete debt error:', error);
    next(error);
  }
});

// GET /api/debt/maturing/soon - Get debt maturing soon
router.get('/maturing/soon', 
  permissionMiddleware('properties', 'read'),
  [
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const days = parseInt(req.query.days) || 180;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      // Fallback demo data - debts maturing soon
      const fallbackMaturingDebts = [
        {
          id: '1',
          amount: 12000000,
          interestRate: 4.75,
          maturityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          loanType: 'mortgage',
          dscr: 1.45,
          property: { id: '1', name: 'Downtown Office Tower', address: '123 Main St', city: 'New York', state: 'NY' },
          lender: { id: '1', name: 'First National Bank', primaryEmail: 'loans@firstnational.com' }
        },
        {
          id: '2',
          amount: 6500000,
          interestRate: 6.25,
          maturityDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          loanType: 'bridge',
          dscr: 1.20,
          property: { id: '3', name: 'Industrial Warehouse Complex', address: '789 Industrial Park Dr', city: 'Chicago', state: 'IL' },
          lender: { id: '2', name: 'Capital Bridge Lending', primaryEmail: 'info@capitalbridge.com' }
        },
        {
          id: '3',
          amount: 18000000,
          interestRate: 5.15,
          maturityDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          loanType: 'mortgage',
          dscr: 1.55,
          property: { id: '4', name: 'Luxury Apartment Complex', address: '321 Residential Ave', city: 'Miami', state: 'FL' },
          lender: { id: '3', name: 'Metropolitan Life Insurance', primaryEmail: 'cre@metlife.com' }
        }
      ];

      const result = await DatabaseWrapper.query(
        async () => {
          return await Debt.findAll({
            where: {
              maturityDate: {
                [Op.gte]: new Date(),
                [Op.lte]: futureDate
              }
            },
            include: [
              {
                model: Property,
                as: 'property',
                attributes: ['id', 'name', 'address', 'city', 'state']
              },
              {
                model: Company,
                as: 'lender',
                attributes: ['id', 'name', 'primaryEmail']
              }
            ],
            order: [['maturityDate', 'ASC']]
          });
        },
        {
          timeout: 5000,
          operation: 'fetch maturing debt',
          fallback: fallbackMaturingDebts
        }
      );

      res.json({ debts: result.data, usingFallback: result.usingFallback });
    } catch (error) {
      appLogger.error('Get maturing debt error:', error);
      next(error);
    }
  }
);

module.exports = router;
