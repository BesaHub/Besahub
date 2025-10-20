const express = require('express');
const { Op } = require('sequelize');

const { Contact, User, Property, Deal, Activity, Company } = require('../models');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { cacheMiddleware, invalidateCache } = require('../middleware/cache');
const { appLogger } = require('../config/logger');
const { avatarUpload } = require('../middleware/upload');
const DatabaseWrapper = require('../utils/dbWrapper');

const {
  createContactSchema,
  updateContactSchema,
  getContactsSchema,
  getContactByIdSchema
} = require('../validation/schemas/contact.schemas');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/contacts - Get all contacts
router.get('/', 
  permissionMiddleware('contacts', 'read'),
  cacheMiddleware((req) => `crm:contacts:${req.query.page || 1}:${req.query.limit || 20}:${JSON.stringify(req.query)}`, 600),
  getContactsSchema,
  async (req, res, next) => {
  try {

    const {
      page = 1,
      limit = 20,
      search,
      contactRole,
      leadStatus,
      type,
      sortBy = 'updatedAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { isActive: true };

    // Apply filters
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { companyName: { [Op.iLike]: `%${search}%` } },
        { primaryEmail: { [Op.iLike]: `%${search}%` } },
        { primaryPhone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (contactRole) {
      where.contactRole = contactRole;
    }

    if (leadStatus) {
      where.leadStatus = leadStatus;
    }

    if (type) {
      where.type = type;
    }

    // Non-admin users only see their assigned contacts or unassigned ones
    if (!['admin', 'manager'].includes(req.user.role)) {
      where[Op.or] = [
        { assignedAgentId: req.user.id },
        { assignedAgentId: null }
      ];
    }

    // Fallback demo data
    const fallbackContacts = [
      {
        id: '1',
        firstName: 'Michael',
        lastName: 'Anderson',
        companyName: 'Anderson Capital Group',
        primaryEmail: 'michael@andersoncapital.com',
        primaryPhone: '555-0201',
        contactRole: 'investor',
        leadStatus: 'qualified',
        type: 'individual',
        assignedAgent: { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        company: { id: '1', name: 'Anderson Capital Group', industry: 'Real Estate Investment' }
      },
      {
        id: '2',
        firstName: 'Emily',
        lastName: 'Chen',
        companyName: 'Pacific Retail Partners',
        primaryEmail: 'emily@pacificretail.com',
        primaryPhone: '555-0202',
        contactRole: 'tenant',
        leadStatus: 'hot',
        type: 'individual',
        assignedAgent: { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
        company: { id: '2', name: 'Pacific Retail Partners', industry: 'Retail' }
      },
      {
        id: '3',
        firstName: 'Robert',
        lastName: 'Thompson',
        companyName: 'Thompson Properties LLC',
        primaryEmail: 'robert@thompsonprops.com',
        primaryPhone: '555-0203',
        contactRole: 'buyer',
        leadStatus: 'qualified',
        type: 'individual',
        assignedAgent: { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        company: { id: '3', name: 'Thompson Properties LLC', industry: 'Property Management' }
      },
      {
        id: '4',
        firstName: 'Jennifer',
        lastName: 'Martinez',
        companyName: 'Martinez Development Corp',
        primaryEmail: 'jennifer@martinezdev.com',
        primaryPhone: '555-0204',
        contactRole: 'seller',
        leadStatus: 'warm',
        type: 'individual',
        assignedAgent: { id: '3', firstName: 'Mike', lastName: 'Johnson', email: 'mike@example.com' },
        company: { id: '4', name: 'Martinez Development Corp', industry: 'Development' }
      },
      {
        id: '5',
        firstName: 'David',
        lastName: 'Lee',
        companyName: 'Lee Industrial Partners',
        primaryEmail: 'david@leeindustrial.com',
        primaryPhone: '555-0205',
        contactRole: 'investor',
        leadStatus: 'new',
        type: 'individual',
        assignedAgent: { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
        company: { id: '5', name: 'Lee Industrial Partners', industry: 'Industrial' }
      }
    ];

    const result = await DatabaseWrapper.query(
      async () => {
        const { rows, count } = await Contact.findAndCountAll({
          where,
          include: [
            {
              model: User,
              as: 'assignedAgent',
              attributes: ['id', 'firstName', 'lastName', 'email']
            },
            {
              model: Company,
              as: 'company',
              attributes: ['id', 'name', 'industry']
            }
          ],
          order: [[sortBy, sortOrder.toUpperCase()]],
          limit: parseInt(limit),
          offset: parseInt(offset)
        });
        return { contacts: rows, count };
      },
      {
        timeout: 5000,
        operation: 'fetch contacts',
        fallback: { contacts: fallbackContacts, count: fallbackContacts.length }
      }
    );

    res.json({
      contacts: result.data.contacts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(result.data.count / limit),
        totalItems: result.data.count,
        itemsPerPage: parseInt(limit)
      },
      usingFallback: result.usingFallback
    });
  } catch (error) {
    appLogger.error('Get contacts error:', error);
    next(error);
  }
});

// GET /api/contacts/:id - Get contact by ID
router.get('/:id', permissionMiddleware('contacts', 'read'), getContactByIdSchema, async (req, res, next) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedAgent',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'industry', 'website', 'description']
        },
        {
          model: Property,
          as: 'ownedProperties',
          attributes: ['id', 'name', 'propertyType', 'status', 'address', 'city', 'state']
        },
        {
          model: Deal,
          as: 'deals',
          include: [
            {
              model: Property,
              as: 'property',
              attributes: ['id', 'name', 'address', 'city', 'state']
            }
          ]
        },
        {
          model: Activity,
          as: 'activities',
          limit: 10,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName']
            }
          ]
        }
      ]
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Check access permissions for non-admin users
    if (!['admin', 'manager'].includes(req.user.role)) {
      if (contact.assignedAgentId && contact.assignedAgentId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json({ contact });
  } catch (error) {
    appLogger.error('Get contact error:', error);
    next(error);
  }
});

// POST /api/contacts - Create new contact
router.post('/', permissionMiddleware('contacts', 'create'), createContactSchema, async (req, res, next) => {
  try {

    const contactData = {
      ...req.body,
      assignedAgentId: req.body.assignedAgentId || req.user.id
    };

    const contact = await Contact.create(contactData);

    // Create activity log
    await Activity.createSystemEvent({
      title: 'Contact Created',
      description: `New contact "${contact.getDisplayName()}" was added to the system`,
      userId: req.user.id,
      contactId: contact.id,
      source: 'contact_management'
    });

    const createdContact = await Contact.findByPk(contact.id, {
      include: [
        {
          model: User,
          as: 'assignedAgent',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    // Invalidate contacts cache
    await invalidateCache('crm:contacts:*');

    res.status(201).json({
      message: 'Contact created successfully',
      contact: createdContact
    });
  } catch (error) {
    appLogger.error('Create contact error:', error);
    next(error);
  }
});

// PUT /api/contacts/:id - Update contact
router.put('/:id', permissionMiddleware('contacts', 'update'), updateContactSchema, async (req, res, next) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findByPk(id);

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Check access permissions
    if (!['admin', 'manager'].includes(req.user.role)) {
      if (contact.assignedAgentId && contact.assignedAgentId !== req.user.id) {
        return res.status(403).json({ error: 'You can only edit your assigned contacts' });
      }
    }

    const oldLeadStatus = contact.leadStatus;
    await contact.update(req.body);

    // Create activity log for lead status changes
    if (req.body.leadStatus && req.body.leadStatus !== oldLeadStatus) {
      await Activity.createSystemEvent({
        title: 'Lead Status Changed',
        description: `Lead status changed from "${oldLeadStatus}" to "${req.body.leadStatus}" for ${contact.getDisplayName()}`,
        userId: req.user.id,
        contactId: contact.id,
        source: 'contact_management'
      });
    }

    const updatedContact = await Contact.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedAgent',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'industry']
        }
      ]
    });

    // Invalidate contacts cache
    await invalidateCache('crm:contacts:*');

    res.json({
      message: 'Contact updated successfully',
      contact: updatedContact
    });
  } catch (error) {
    appLogger.error('Update contact error:', error);
    next(error);
  }
});

// DELETE /api/contacts/:id - Soft delete contact
router.delete('/:id', permissionMiddleware('contacts', 'delete'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findByPk(id);

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Check access permissions
    if (!['admin', 'manager'].includes(req.user.role)) {
      if (contact.assignedAgentId && contact.assignedAgentId !== req.user.id) {
        return res.status(403).json({ error: 'You can only delete your assigned contacts' });
      }
    }

    await contact.update({ isActive: false });

    // Create activity log
    await Activity.createSystemEvent({
      title: 'Contact Deleted',
      description: `Contact "${contact.getDisplayName()}" was removed from the system`,
      userId: req.user.id,
      contactId: contact.id,
      source: 'contact_management'
    });

    // Invalidate contacts cache
    await invalidateCache('crm:contacts:*');

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    appLogger.error('Delete contact error:', error);
    next(error);
  }
});

// POST /api/contacts/:id/activities - Create activity for contact
router.post('/:id/activities', permissionMiddleware('contacts', 'update'), async (req, res, next) => {
  try {

    const { id } = req.params;
    const contact = await Contact.findByPk(id);

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Check access permissions
    if (!['admin', 'manager'].includes(req.user.role)) {
      if (contact.assignedAgentId && contact.assignedAgentId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const activityData = {
      ...req.body,
      userId: req.user.id,
      contactId: id
    };

    const activity = await Activity.create(activityData);

    // Update contact's last contact date
    await contact.updateLastContact();

    // Create follow-up task if required
    if (activity.followUpRequired) {
      await activity.createFollowUpTask();
    }

    const createdActivity = await Activity.findByPk(activity.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    res.status(201).json({
      message: 'Activity created successfully',
      activity: createdActivity
    });
  } catch (error) {
    appLogger.error('Create activity error:', error);
    next(error);
  }
});

// GET /api/contacts/:id/activities - Get contact activities
router.get('/:id/activities', permissionMiddleware('contacts', 'read'), async (req, res, next) => {
  try {

    const { id } = req.params;
    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;

    const contact = await Contact.findByPk(id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Check access permissions
    if (!['admin', 'manager'].includes(req.user.role)) {
      if (contact.assignedAgentId && contact.assignedAgentId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const where = { contactId: id };
    if (type) {
      where.type = type;
    }

    const { rows: activities, count } = await Activity.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      activities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    appLogger.error('Get contact activities error:', error);
    next(error);
  }
});

// POST /api/contacts/:id/assign - Assign contact to agent
router.post('/:id/assign', permissionMiddleware('contacts', 'update'), async (req, res, next) => {
  try {

    const { id } = req.params;
    const { agentId } = req.body;

    // Only managers and admins can reassign contacts
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only managers and admins can assign contacts' });
    }

    const contact = await Contact.findByPk(id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const agent = await User.findByPk(agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const oldAgent = contact.assignedAgentId;
    await contact.update({ assignedAgentId: agentId });

    // Create activity log
    await Activity.createSystemEvent({
      title: 'Contact Reassigned',
      description: `Contact "${contact.getDisplayName()}" was assigned to ${agent.getFullName()}`,
      userId: req.user.id,
      contactId: contact.id,
      source: 'contact_management'
    });

    res.json({
      message: 'Contact assigned successfully',
      contact: await Contact.findByPk(id, {
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
    appLogger.error('Assign contact error:', error);
    next(error);
  }
});

// GET /api/contacts/search/qualified - Get qualified leads
router.get('/search/qualified', permissionMiddleware('contacts', 'read'), async (req, res, next) => {
  try {
    const where = {
      isActive: true,
      leadStatus: { [Op.in]: ['qualified', 'hot'] }
    };

    // Non-admin users only see their assigned contacts
    if (!['admin', 'manager'].includes(req.user.role)) {
      where.assignedAgentId = req.user.id;
    }

    const contacts = await Contact.findAll({
      where,
      include: [
        {
          model: User,
          as: 'assignedAgent',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['updatedAt', 'DESC']],
      limit: 50
    });

    res.json({ contacts });
  } catch (error) {
    appLogger.error('Get qualified leads error:', error);
    next(error);
  }
});

// POST /api/contacts/:id/avatar - Upload contact avatar
router.post('/:id/avatar', permissionMiddleware('contacts', 'update'), avatarUpload, async (req, res, next) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Check permissions for non-admin users
    if (!['admin', 'manager'].includes(req.user.role) && contact.assignedAgentId !== req.user.id) {
      return res.status(403).json({ error: 'You can only upload avatars to your assigned contacts' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No avatar uploaded' });
    }

    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    await contact.update({ avatar: avatarPath });

    res.json({
      message: 'Avatar uploaded successfully',
      avatar: avatarPath,
      contact
    });
  } catch (error) {
    appLogger.error('Upload avatar error:', error);
    next(error);
  }
});

// DELETE /api/contacts/:id/avatar - Remove contact avatar
router.delete('/:id/avatar', permissionMiddleware('contacts', 'update'), async (req, res, next) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Check permissions for non-admin users
    if (!['admin', 'manager'].includes(req.user.role) && contact.assignedAgentId !== req.user.id) {
      return res.status(403).json({ error: 'You can only remove avatars from your assigned contacts' });
    }

    await contact.update({ avatar: null });

    res.json({
      message: 'Avatar removed successfully',
      contact
    });
  } catch (error) {
    appLogger.error('Remove avatar error:', error);
    next(error);
  }
});

module.exports = router;