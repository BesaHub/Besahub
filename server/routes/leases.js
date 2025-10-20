const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { Op } = require('sequelize');

const { Lease, Property, Contact, User, Activity } = require('../models');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { cacheMiddleware, invalidateCache } = require('../middleware/cache');
const { appLogger } = require('../config/logger');
const DatabaseWrapper = require('../utils/dbWrapper');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/leases - Get all leases
router.get('/', 
  permissionMiddleware('properties', 'read'),
  cacheMiddleware((req) => `crm:leases:${req.query.page || 1}:${req.query.limit || 20}:${JSON.stringify(req.query)}`, 600),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isLength({ max: 100 }).withMessage('Search term too long'),
    query('status').optional().isIn(['active', 'expired', 'terminated', 'pending']).withMessage('Invalid status'),
    query('propertyId').optional().isUUID().withMessage('Invalid property ID'),
    query('tenantId').optional().isUUID().withMessage('Invalid tenant ID')
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
        status,
        propertyId,
        tenantId,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Apply filters
      if (search) {
        where[Op.or] = [
          { terms: { [Op.iLike]: `%${search}%` } },
          { options: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (status) {
        where.status = status;
      }

      if (propertyId) {
        where.propertyId = propertyId;
      }

      if (tenantId) {
        where.tenantId = tenantId;
      }

      // Fallback demo data - 3 leases with different expiration dates
      const fallbackLeases = [
        {
          id: '1',
          startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          monthlyRent: 45000,
          squareFeet: 15000,
          status: 'active',
          terms: '5-year lease with 3% annual escalation',
          property: { id: '2', name: 'Retail Shopping Center', address: '456 Commerce Blvd', city: 'Los Angeles', state: 'CA', propertyType: 'retail' },
          tenant: { id: '2', firstName: 'Emily', lastName: 'Chen', companyName: 'Pacific Retail Partners', primaryEmail: 'emily@pacificretail.com', primaryPhone: '555-0202' }
        },
        {
          id: '2',
          startDate: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          monthlyRent: 85000,
          squareFeet: 32000,
          status: 'active',
          terms: '10-year lease with CPI adjustments',
          property: { id: '5', name: 'Medical Office Building', address: '654 Healthcare Pkwy', city: 'Boston', state: 'MA', propertyType: 'office' },
          tenant: { id: '5', firstName: 'David', lastName: 'Lee', companyName: 'Lee Industrial Partners', primaryEmail: 'david@leeindustrial.com', primaryPhone: '555-0205' }
        },
        {
          id: '3',
          startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          monthlyRent: 125000,
          squareFeet: 45000,
          status: 'active',
          terms: '3-year net lease',
          property: { id: '3', name: 'Industrial Warehouse Complex', address: '789 Industrial Park Dr', city: 'Chicago', state: 'IL', propertyType: 'industrial' },
          tenant: { id: '3', firstName: 'Robert', lastName: 'Thompson', companyName: 'Thompson Properties LLC', primaryEmail: 'robert@thompsonprops.com', primaryPhone: '555-0203' }
        }
      ];

      const result = await DatabaseWrapper.query(
        async () => {
          const { rows, count } = await Lease.findAndCountAll({
            where,
            include: [
              {
                model: Property,
                as: 'property',
                attributes: ['id', 'name', 'address', 'city', 'state', 'propertyType']
              },
              {
                model: Contact,
                as: 'tenant',
                attributes: ['id', 'firstName', 'lastName', 'companyName', 'primaryEmail', 'primaryPhone']
              }
            ],
            order: [[sortBy, sortOrder.toUpperCase()]],
            limit: parseInt(limit),
            offset: parseInt(offset)
          });
          return { leases: rows, count };
        },
        {
          timeout: 5000,
          operation: 'fetch leases',
          fallback: { leases: fallbackLeases, count: fallbackLeases.length }
        }
      );

      res.json({
        leases: result.data.leases,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(result.data.count / limit),
          totalItems: result.data.count,
          itemsPerPage: parseInt(limit)
        },
        usingFallback: result.usingFallback
      });
    } catch (error) {
      appLogger.error('Get leases error:', error);
      next(error);
    }
  }
);

// GET /api/leases/:id - Get lease by ID
router.get('/:id', permissionMiddleware('properties', 'read'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const lease = await Lease.findByPk(id, {
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
          model: Contact,
          as: 'tenant',
          attributes: ['id', 'firstName', 'lastName', 'companyName', 'primaryEmail', 'primaryPhone']
        }
      ]
    });

    if (!lease) {
      return res.status(404).json({ error: 'Lease not found' });
    }

    res.json({ lease });
  } catch (error) {
    appLogger.error('Get lease error:', error);
    next(error);
  }
});

// POST /api/leases - Create new lease
router.post('/', 
  permissionMiddleware('properties', 'create'), 
  [
    body('propertyId').notEmpty().isUUID().withMessage('Valid property ID is required'),
    body('tenantId').notEmpty().isUUID().withMessage('Valid tenant ID is required'),
    body('startDate').notEmpty().isISO8601().withMessage('Valid start date is required'),
    body('endDate').notEmpty().isISO8601().withMessage('Valid end date is required'),
    body('monthlyRent').notEmpty().isFloat({ min: 0 }).withMessage('Monthly rent must be a positive number'),
    body('squareFeet').optional().isInt({ min: 0 }).withMessage('Square feet must be a positive integer'),
    body('terms').optional().isLength({ max: 5000 }).withMessage('Terms too long'),
    body('options').optional().isLength({ max: 5000 }).withMessage('Options too long'),
    body('status').optional().isIn(['active', 'expired', 'terminated', 'pending']).withMessage('Invalid status')
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

      const leaseData = req.body;

      // Validate relationships
      const property = await Property.findByPk(leaseData.propertyId);
      if (!property) {
        return res.status(400).json({ error: 'Property not found' });
      }

      const tenant = await Contact.findByPk(leaseData.tenantId);
      if (!tenant) {
        return res.status(400).json({ error: 'Tenant not found' });
      }

      // Validate date range
      const startDate = new Date(leaseData.startDate);
      const endDate = new Date(leaseData.endDate);
      if (endDate <= startDate) {
        return res.status(400).json({ error: 'End date must be after start date' });
      }

      const lease = await Lease.create(leaseData);

      // Create activity log
      await Activity.createSystemEvent({
        title: 'Lease Created',
        description: `New lease created for property "${property.name}"`,
        userId: req.user.id,
        propertyId: lease.propertyId,
        contactId: lease.tenantId,
        source: 'lease_management'
      });

      const createdLease = await Lease.findByPk(lease.id, {
        include: [
          {
            model: Property,
            as: 'property',
            attributes: ['id', 'name', 'address', 'city', 'state']
          },
          {
            model: Contact,
            as: 'tenant',
            attributes: ['id', 'firstName', 'lastName', 'companyName', 'primaryEmail']
          }
        ]
      });

      // Invalidate leases cache
      await invalidateCache('crm:leases:*');

      res.status(201).json({
        message: 'Lease created successfully',
        lease: createdLease
      });
    } catch (error) {
      appLogger.error('Create lease error:', error);
      next(error);
    }
  }
);

// PUT /api/leases/:id - Update lease
router.put('/:id', 
  permissionMiddleware('properties', 'update'), 
  [
    body('propertyId').optional().isUUID().withMessage('Invalid property ID'),
    body('tenantId').optional().isUUID().withMessage('Invalid tenant ID'),
    body('startDate').optional().isISO8601().withMessage('Invalid start date'),
    body('endDate').optional().isISO8601().withMessage('Invalid end date'),
    body('monthlyRent').optional().isFloat({ min: 0 }).withMessage('Monthly rent must be a positive number'),
    body('squareFeet').optional().isInt({ min: 0 }).withMessage('Square feet must be a positive integer'),
    body('terms').optional().isLength({ max: 5000 }).withMessage('Terms too long'),
    body('options').optional().isLength({ max: 5000 }).withMessage('Options too long'),
    body('status').optional().isIn(['active', 'expired', 'terminated', 'pending']).withMessage('Invalid status')
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
      const lease = await Lease.findByPk(id);

      if (!lease) {
        return res.status(404).json({ error: 'Lease not found' });
      }

      // Validate relationships if being updated
      if (req.body.propertyId) {
        const property = await Property.findByPk(req.body.propertyId);
        if (!property) {
          return res.status(400).json({ error: 'Property not found' });
        }
      }

      if (req.body.tenantId) {
        const tenant = await Contact.findByPk(req.body.tenantId);
        if (!tenant) {
          return res.status(400).json({ error: 'Tenant not found' });
        }
      }

      // Validate date range if being updated
      const startDate = req.body.startDate ? new Date(req.body.startDate) : lease.startDate;
      const endDate = req.body.endDate ? new Date(req.body.endDate) : lease.endDate;
      if (endDate <= startDate) {
        return res.status(400).json({ error: 'End date must be after start date' });
      }

      const oldStatus = lease.status;
      await lease.update(req.body);

      // Create activity log for status changes
      if (req.body.status && req.body.status !== oldStatus) {
        await Activity.createSystemEvent({
          title: 'Lease Status Changed',
          description: `Lease status changed from "${oldStatus}" to "${req.body.status}"`,
          userId: req.user.id,
          propertyId: lease.propertyId,
          contactId: lease.tenantId,
          source: 'lease_management'
        });
      }

      const updatedLease = await Lease.findByPk(id, {
        include: [
          {
            model: Property,
            as: 'property',
            attributes: ['id', 'name', 'address', 'city', 'state']
          },
          {
            model: Contact,
            as: 'tenant',
            attributes: ['id', 'firstName', 'lastName', 'companyName', 'primaryEmail']
          }
        ]
      });

      // Invalidate leases cache
      await invalidateCache('crm:leases:*');

      res.json({
        message: 'Lease updated successfully',
        lease: updatedLease
      });
    } catch (error) {
      appLogger.error('Update lease error:', error);
      next(error);
    }
  }
);

// DELETE /api/leases/:id - Delete lease
router.delete('/:id', permissionMiddleware('properties', 'delete'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const lease = await Lease.findByPk(id);

    if (!lease) {
      return res.status(404).json({ error: 'Lease not found' });
    }

    // Create activity log before deletion
    await Activity.createSystemEvent({
      title: 'Lease Deleted',
      description: `Lease for property ID ${lease.propertyId} was deleted`,
      userId: req.user.id,
      propertyId: lease.propertyId,
      contactId: lease.tenantId,
      source: 'lease_management'
    });

    await lease.destroy();

    // Invalidate leases cache
    await invalidateCache('crm:leases:*');

    res.json({ message: 'Lease deleted successfully' });
  } catch (error) {
    appLogger.error('Delete lease error:', error);
    next(error);
  }
});

// GET /api/leases/expiring/soon - Get leases expiring soon
router.get('/expiring/soon', 
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

      const days = parseInt(req.query.days) || 90;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      // Fallback demo data - leases expiring soon
      const fallbackExpiringLeases = [
        {
          id: '1',
          startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          monthlyRent: 45000,
          squareFeet: 15000,
          status: 'active',
          property: { id: '2', name: 'Retail Shopping Center', address: '456 Commerce Blvd', city: 'Los Angeles', state: 'CA' },
          tenant: { id: '2', firstName: 'Emily', lastName: 'Chen', companyName: 'Pacific Retail Partners', primaryEmail: 'emily@pacificretail.com' }
        },
        {
          id: '2',
          startDate: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          monthlyRent: 85000,
          squareFeet: 32000,
          status: 'active',
          property: { id: '5', name: 'Medical Office Building', address: '654 Healthcare Pkwy', city: 'Boston', state: 'MA' },
          tenant: { id: '5', firstName: 'David', lastName: 'Lee', companyName: 'Lee Industrial Partners', primaryEmail: 'david@leeindustrial.com' }
        },
        {
          id: '3',
          startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          monthlyRent: 125000,
          squareFeet: 45000,
          status: 'active',
          property: { id: '3', name: 'Industrial Warehouse Complex', address: '789 Industrial Park Dr', city: 'Chicago', state: 'IL' },
          tenant: { id: '3', firstName: 'Robert', lastName: 'Thompson', companyName: 'Thompson Properties LLC', primaryEmail: 'robert@thompsonprops.com' }
        }
      ];

      const result = await DatabaseWrapper.query(
        async () => {
          return await Lease.findAll({
            where: {
              status: 'active',
              endDate: {
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
                model: Contact,
                as: 'tenant',
                attributes: ['id', 'firstName', 'lastName', 'companyName', 'primaryEmail']
              }
            ],
            order: [['endDate', 'ASC']]
          });
        },
        {
          timeout: 5000,
          operation: 'fetch expiring leases',
          fallback: fallbackExpiringLeases
        }
      );

      res.json({ leases: result.data, usingFallback: result.usingFallback });
    } catch (error) {
      appLogger.error('Get expiring leases error:', error);
      next(error);
    }
  }
);

module.exports = router;
