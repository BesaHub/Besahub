const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { Op } = require('sequelize');

const { Task, User, Contact, Property, Deal, Company } = require('../models');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { appLogger } = require('../config/logger');
const DatabaseWrapper = require('../utils/dbWrapper');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/tasks - Get all tasks
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  query('taskType').optional().isIn(['call', 'email', 'meeting', 'follow_up', 'property_showing', 'document_review', 'market_analysis', 'site_visit', 'other']).withMessage('Invalid task type'),
  query('assignedTo').optional().isUUID().withMessage('Invalid assignedTo ID'),
  query('overdue').optional().isBoolean().withMessage('Overdue must be boolean')
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
      status,
      priority,
      taskType,
      assignedTo,
      overdue,
      sortBy = 'dueDate',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Apply filters
    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (taskType) {
      where.taskType = taskType;
    }

    if (assignedTo) {
      where.assignedToId = assignedTo;
    }

    if (overdue === 'true') {
      where.dueDate = { [Op.lt]: new Date() };
      where.status = { [Op.notIn]: ['completed', 'cancelled'] };
    }

    // Non-admin users only see their tasks or tasks they created
    if (!['admin', 'manager'].includes(req.user.role)) {
      where[Op.or] = [
        { assignedToId: req.user.id },
        { createdById: req.user.id }
      ];
    }

    // Fallback demo data
    const fallbackTasks = [
      {
        id: '1',
        title: 'Schedule Property Tour',
        taskType: 'property_showing',
        status: 'pending',
        priority: 'high',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        assignedTo: { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        createdBy: { id: '2', firstName: 'Jane', lastName: 'Smith' },
        contact: { id: '1', firstName: 'Michael', lastName: 'Anderson', companyName: 'Anderson Capital Group' },
        property: { id: '1', name: 'Downtown Office Tower', address: '123 Main St' },
        deal: { id: '1', name: 'Downtown Office Tower Sale', stage: 'negotiation' }
      },
      {
        id: '2',
        title: 'Follow Up Call',
        taskType: 'call',
        status: 'in_progress',
        priority: 'medium',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        assignedTo: { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
        createdBy: { id: '1', firstName: 'John', lastName: 'Doe' },
        contact: { id: '2', firstName: 'Emily', lastName: 'Chen', companyName: 'Pacific Retail Partners' },
        property: null,
        deal: { id: '2', name: 'Retail Center Lease', stage: 'proposal' }
      },
      {
        id: '3',
        title: 'Review Lease Documents',
        taskType: 'document_review',
        status: 'pending',
        priority: 'urgent',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        assignedTo: { id: '3', firstName: 'Mike', lastName: 'Johnson', email: 'mike@example.com' },
        createdBy: { id: '1', firstName: 'John', lastName: 'Doe' },
        contact: { id: '3', firstName: 'Robert', lastName: 'Thompson', companyName: 'Thompson Properties LLC' },
        property: { id: '3', name: 'Industrial Warehouse Complex', address: '789 Industrial Park Dr' },
        deal: null
      },
      {
        id: '4',
        title: 'Market Analysis Report',
        taskType: 'market_analysis',
        status: 'completed',
        priority: 'medium',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        assignedTo: { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
        createdBy: { id: '3', firstName: 'Mike', lastName: 'Johnson' },
        contact: null,
        property: { id: '4', name: 'Luxury Apartment Complex', address: '321 Residential Ave' },
        deal: { id: '4', name: 'Apartment Complex Sale', stage: 'qualification' }
      },
      {
        id: '5',
        title: 'Send Proposal Email',
        taskType: 'email',
        status: 'pending',
        priority: 'low',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        assignedTo: { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        createdBy: { id: '2', firstName: 'Jane', lastName: 'Smith' },
        contact: { id: '5', firstName: 'David', lastName: 'Lee', companyName: 'Lee Industrial Partners' },
        property: { id: '5', name: 'Medical Office Building', address: '654 Healthcare Pkwy' },
        deal: null
      }
    ];

    const result = await DatabaseWrapper.query(
      async () => {
        const { rows, count } = await Task.findAndCountAll({
          where,
          include: [
            {
              model: User,
              as: 'assignedTo',
              attributes: ['id', 'firstName', 'lastName', 'email']
            },
            {
              model: User,
              as: 'createdBy',
              attributes: ['id', 'firstName', 'lastName']
            },
            {
              model: Contact,
              as: 'contact',
              attributes: ['id', 'firstName', 'lastName', 'companyName']
            },
            {
              model: Property,
              as: 'property',
              attributes: ['id', 'name', 'address']
            },
            {
              model: Deal,
              as: 'deal',
              attributes: ['id', 'name', 'stage']
            }
          ],
          order: [[sortBy, sortOrder.toUpperCase()]],
          limit: parseInt(limit),
          offset: parseInt(offset)
        });
        return { tasks: rows, count };
      },
      {
        timeout: 5000,
        operation: 'fetch tasks',
        fallback: { tasks: fallbackTasks, count: fallbackTasks.length }
      }
    );

    res.json({
      tasks: result.data.tasks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(result.data.count / limit),
        totalItems: result.data.count,
        itemsPerPage: parseInt(limit)
      },
      usingFallback: result.usingFallback
    });
  } catch (error) {
    appLogger.error('Get tasks error:', error);
    next(error);
  }
});

// GET /api/tasks/:id - Get task by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Contact,
          as: 'contact',
          attributes: ['id', 'firstName', 'lastName', 'companyName', 'primaryEmail', 'primaryPhone']
        },
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'name', 'address', 'city', 'state']
        },
        {
          model: Deal,
          as: 'deal',
          attributes: ['id', 'name', 'stage', 'value']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'primaryEmail']
        }
      ]
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check access permissions
    if (!['admin', 'manager'].includes(req.user.role)) {
      if (task.assignedToId !== req.user.id && task.createdById !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json({ task });
  } catch (error) {
    appLogger.error('Get task error:', error);
    next(error);
  }
});

// POST /api/tasks - Create new task
router.post('/', [
  body('title').trim().isLength({ min: 1 }).withMessage('Task title is required'),
  body('taskType').optional().isIn(['call', 'email', 'meeting', 'follow_up', 'property_showing', 'document_review', 'market_analysis', 'site_visit', 'other']).withMessage('Invalid task type. Valid options: call, email, meeting, follow_up, property_showing, document_review, market_analysis, site_visit, other'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority. Valid options: low, medium, high, urgent'),
  body('assignedToId').optional().isUUID().withMessage('Invalid assignedTo ID format'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date format (use YYYY-MM-DD or ISO 8601)'),
  body('estimatedDuration').optional().isInt({ min: 0 }).withMessage('Estimated duration must be positive integer'),
  body('contactId').optional().isUUID().withMessage('Invalid contact ID'),
  body('propertyId').optional().isUUID().withMessage('Invalid property ID'),
  body('dealId').optional().isUUID().withMessage('Invalid deal ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Default assignedToId to current user if not provided
    const assignedToId = req.body.assignedToId || req.user.id;

    // Validate assigned user exists
    const assignedUser = await User.findByPk(assignedToId);
    if (!assignedUser) {
      return res.status(400).json({ error: 'Assigned user not found' });
    }

    // Validate optional relationships
    if (req.body.contactId) {
      const contact = await Contact.findByPk(req.body.contactId);
      if (!contact) {
        return res.status(400).json({ error: 'Contact not found' });
      }
    }

    if (req.body.propertyId) {
      const property = await Property.findByPk(req.body.propertyId);
      if (!property) {
        return res.status(400).json({ error: 'Property not found' });
      }
    }

    if (req.body.dealId) {
      const deal = await Deal.findByPk(req.body.dealId);
      if (!deal) {
        return res.status(400).json({ error: 'Deal not found' });
      }
    }

    const taskData = {
      ...req.body,
      assignedToId: assignedToId,
      createdById: req.user.id
    };

    const task = await Task.create(taskData);

    const createdTask = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: Contact,
          as: 'contact',
          attributes: ['id', 'firstName', 'lastName', 'companyName']
        },
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'name', 'address']
        },
        {
          model: Deal,
          as: 'deal',
          attributes: ['id', 'name', 'stage']
        }
      ]
    });

    // Send notification to assigned user if different from creator
    if (task.assignedToId !== req.user.id) {
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${task.assignedToId}`).emit('task_assigned', {
          taskId: task.id,
          title: task.title,
          dueDate: task.dueDate,
          createdBy: req.user.firstName + ' ' + req.user.lastName
        });
      }
    }

    res.status(201).json({
      message: 'Task created successfully',
      task: createdTask
    });
  } catch (error) {
    appLogger.error('Create task error:', error);
    next(error);
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Task title cannot be empty'),
  body('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
  body('estimatedDuration').optional().isInt({ min: 0 }).withMessage('Estimated duration must be positive integer'),
  body('actualDuration').optional().isInt({ min: 0 }).withMessage('Actual duration must be positive integer')
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
    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check access permissions
    if (!['admin', 'manager'].includes(req.user.role)) {
      if (task.assignedToId !== req.user.id && task.createdById !== req.user.id) {
        return res.status(403).json({ error: 'You can only edit tasks assigned to you or created by you' });
      }
    }

    // Auto-set completion date if status is being changed to completed
    if (req.body.status === 'completed' && task.status !== 'completed') {
      req.body.completedDate = new Date();
    }

    await task.update(req.body);

    // Handle recurring tasks if completed
    if (req.body.status === 'completed' && task.isRecurring) {
      await task.createRecurringTask();
    }

    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: Contact,
          as: 'contact',
          attributes: ['id', 'firstName', 'lastName', 'companyName']
        },
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'name', 'address']
        },
        {
          model: Deal,
          as: 'deal',
          attributes: ['id', 'name', 'stage']
        }
      ]
    });

    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    appLogger.error('Update task error:', error);
    next(error);
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check access permissions
    if (!['admin', 'manager'].includes(req.user.role)) {
      if (task.assignedToId !== req.user.id && task.createdById !== req.user.id) {
        return res.status(403).json({ error: 'You can only delete tasks assigned to you or created by you' });
      }
    }

    await task.destroy();

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    appLogger.error('Delete task error:', error);
    next(error);
  }
});

// POST /api/tasks/:id/complete - Mark task as completed
router.post('/:id/complete', [
  body('outcome').optional().isIn(['successful', 'unsuccessful', 'rescheduled', 'cancelled', 'no_show']).withMessage('Invalid outcome'),
  body('notes').optional().isLength({ max: 2000 }).withMessage('Notes too long'),
  body('actualDuration').optional().isInt({ min: 0 }).withMessage('Actual duration must be positive integer')
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
    const { outcome, notes, actualDuration } = req.body;

    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check access permissions
    if (!['admin', 'manager'].includes(req.user.role)) {
      if (task.assignedToId !== req.user.id) {
        return res.status(403).json({ error: 'You can only complete tasks assigned to you' });
      }
    }

    await task.markCompleted(outcome, notes);
    
    if (actualDuration) {
      await task.update({ actualDuration });
    }

    // Handle recurring tasks
    if (task.isRecurring) {
      await task.createRecurringTask();
    }

    res.json({
      message: 'Task marked as completed',
      task: await Task.findByPk(id, {
        include: [
          {
            model: User,
            as: 'assignedTo',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      })
    });
  } catch (error) {
    appLogger.error('Complete task error:', error);
    next(error);
  }
});

// GET /api/tasks/my/dashboard - Get user's task dashboard
router.get('/my/dashboard', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(today.getDate() + 7);

    const [overdueTasks, todayTasks, upcomingTasks, completedThisWeek] = await Promise.all([
      Task.findAll({
        where: {
          assignedToId: userId,
          status: { [Op.notIn]: ['completed', 'cancelled'] },
          dueDate: { [Op.lt]: today }
        },
        include: [
          {
            model: Contact,
            as: 'contact',
            attributes: ['id', 'firstName', 'lastName', 'companyName']
          },
          {
            model: Property,
            as: 'property',
            attributes: ['id', 'name']
          }
        ],
        order: [['dueDate', 'ASC']],
        limit: 10
      }),
      Task.findAll({
        where: {
          assignedToId: userId,
          status: { [Op.notIn]: ['completed', 'cancelled'] },
          dueDate: {
            [Op.gte]: new Date(today.setHours(0, 0, 0, 0)),
            [Op.lt]: new Date(today.setHours(23, 59, 59, 999))
          }
        },
        include: [
          {
            model: Contact,
            as: 'contact',
            attributes: ['id', 'firstName', 'lastName', 'companyName']
          },
          {
            model: Property,
            as: 'property',
            attributes: ['id', 'name']
          }
        ],
        order: [['dueDate', 'ASC']]
      }),
      Task.findAll({
        where: {
          assignedToId: userId,
          status: { [Op.notIn]: ['completed', 'cancelled'] },
          dueDate: {
            [Op.gt]: today,
            [Op.lte]: weekFromNow
          }
        },
        include: [
          {
            model: Contact,
            as: 'contact',
            attributes: ['id', 'firstName', 'lastName', 'companyName']
          },
          {
            model: Property,
            as: 'property',
            attributes: ['id', 'name']
          }
        ],
        order: [['dueDate', 'ASC']],
        limit: 15
      }),
      Task.count({
        where: {
          assignedToId: userId,
          status: 'completed',
          completedDate: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    res.json({
      dashboard: {
        overdue: overdueTasks,
        today: todayTasks,
        upcoming: upcomingTasks,
        completedThisWeek
      }
    });
  } catch (error) {
    appLogger.error('Get task dashboard error:', error);
    next(error);
  }
});

// GET /api/tasks/search/overdue - Get all overdue tasks (managers/admins)
router.get('/search/overdue', async (req, res, next) => {
  try {
    // Only managers and admins can see all overdue tasks
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const tasks = await Task.findAll({
      where: {
        status: { [Op.notIn]: ['completed', 'cancelled'] },
        dueDate: { [Op.lt]: new Date() }
      },
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Contact,
          as: 'contact',
          attributes: ['id', 'firstName', 'lastName', 'companyName']
        },
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'name']
        },
        {
          model: Deal,
          as: 'deal',
          attributes: ['id', 'name', 'stage']
        }
      ],
      order: [['dueDate', 'ASC']],
      limit: 100
    });

    res.json({ tasks });
  } catch (error) {
    appLogger.error('Get overdue tasks error:', error);
    next(error);
  }
});

module.exports = router;