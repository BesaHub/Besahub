const express = require('express');
const router = express.Router();
const { Dashboard, Widget, User } = require('../models');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const { isFeatureEnabled } = require('../config/featureFlags');
const { executeQuery, invalidateCache } = require('../services/reports/queryEngine');
const { appLogger } = require('../config/logger');
const { Op } = require('sequelize');

const featureGuard = (req, res, next) => {
  if (!isFeatureEnabled('DASHBOARDS_ENABLED')) {
    return res.status(403).json({
      success: false,
      message: 'Dashboards feature is not enabled'
    });
  }
  next();
};

router.use(authMiddleware);
router.use(featureGuard);

router.get('/', 
  permissionMiddleware('dashboards', 'read'),
  async (req, res, next) => {
    try {
      const userId = req.user.id;

      const myDashboards = await Dashboard.findAll({
        where: {
          userId,
          isActive: true
        },
        include: [{
          model: Widget,
          as: 'widgets',
          where: { isActive: true },
          required: false
        }],
        order: [['isDefault', 'DESC'], ['updatedAt', 'DESC']]
      });

      const sharedDashboards = await Dashboard.findAll({
        where: {
          isShared: true,
          isActive: true,
          userId: { [Op.ne]: userId },
          [Op.or]: [
            { sharedWith: { [Op.contains]: [userId] } },
            { sharedWith: { [Op.contains]: [req.user.role] } }
          ]
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }, {
          model: Widget,
          as: 'widgets',
          where: { isActive: true },
          required: false
        }],
        order: [['updatedAt', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          myDashboards,
          sharedDashboards
        }
      });

    } catch (error) {
      appLogger.error('Error listing dashboards', {
        service: 'dashboards-api',
        error: error.message,
        userId: req.user.id
      });
      next(error);
    }
  }
);

router.post('/',
  permissionMiddleware('dashboards', 'create'),
  async (req, res, next) => {
    try {
      const { name, description, layout, isDefault } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Dashboard name is required'
        });
      }

      const dashboard = await Dashboard.create({
        userId: req.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        layout: layout || {},
        isDefault: isDefault || false,
        isShared: false,
        sharedWith: []
      });

      res.status(201).json({
        success: true,
        data: dashboard
      });

    } catch (error) {
      appLogger.error('Error creating dashboard', {
        service: 'dashboards-api',
        error: error.message,
        userId: req.user.id
      });
      next(error);
    }
  }
);

router.get('/:id',
  permissionMiddleware('dashboards', 'read'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const dashboard = await Dashboard.findOne({
        where: {
          id,
          isActive: true,
          [Op.or]: [
            { userId },
            {
              isShared: true,
              [Op.or]: [
                { sharedWith: { [Op.contains]: [userId] } },
                { sharedWith: { [Op.contains]: [req.user.role] } }
              ]
            }
          ]
        },
        include: [{
          model: Widget,
          as: 'widgets',
          where: { isActive: true },
          required: false,
          order: [['createdAt', 'ASC']]
        }, {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }]
      });

      if (!dashboard) {
        return res.status(404).json({
          success: false,
          message: 'Dashboard not found or access denied'
        });
      }

      res.json({
        success: true,
        data: dashboard
      });

    } catch (error) {
      appLogger.error('Error fetching dashboard', {
        service: 'dashboards-api',
        error: error.message,
        dashboardId: req.params.id
      });
      next(error);
    }
  }
);

router.put('/:id',
  permissionMiddleware('dashboards', 'update'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { name, description, layout, isDefault } = req.body;

      const dashboard = await Dashboard.findOne({
        where: { id, userId, isActive: true }
      });

      if (!dashboard) {
        return res.status(404).json({
          success: false,
          message: 'Dashboard not found or access denied'
        });
      }

      const updates = {};
      if (name !== undefined) updates.name = name.trim();
      if (description !== undefined) updates.description = description?.trim() || null;
      if (layout !== undefined) updates.layout = layout;
      if (isDefault !== undefined) updates.isDefault = isDefault;

      await dashboard.update(updates);

      res.json({
        success: true,
        data: dashboard
      });

    } catch (error) {
      appLogger.error('Error updating dashboard', {
        service: 'dashboards-api',
        error: error.message,
        dashboardId: req.params.id
      });
      next(error);
    }
  }
);

router.delete('/:id',
  permissionMiddleware('dashboards', 'delete'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const dashboard = await Dashboard.findOne({
        where: { id, userId, isActive: true }
      });

      if (!dashboard) {
        return res.status(404).json({
          success: false,
          message: 'Dashboard not found or access denied'
        });
      }

      await dashboard.update({ isActive: false });
      await Widget.update(
        { isActive: false },
        { where: { dashboardId: id } }
      );

      res.json({
        success: true,
        message: 'Dashboard deleted successfully'
      });

    } catch (error) {
      appLogger.error('Error deleting dashboard', {
        service: 'dashboards-api',
        error: error.message,
        dashboardId: req.params.id
      });
      next(error);
    }
  }
);

router.post('/:id/share',
  permissionMiddleware('dashboards', 'update'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { userIds = [], roles = [] } = req.body;

      const dashboard = await Dashboard.findOne({
        where: { id, userId, isActive: true }
      });

      if (!dashboard) {
        return res.status(404).json({
          success: false,
          message: 'Dashboard not found or access denied'
        });
      }

      const sharedWith = [...new Set([...userIds, ...roles])];

      await dashboard.update({
        isShared: sharedWith.length > 0,
        sharedWith
      });

      res.json({
        success: true,
        data: dashboard
      });

    } catch (error) {
      appLogger.error('Error sharing dashboard', {
        service: 'dashboards-api',
        error: error.message,
        dashboardId: req.params.id
      });
      next(error);
    }
  }
);

router.post('/:id/default',
  permissionMiddleware('dashboards', 'update'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const dashboard = await Dashboard.findOne({
        where: { id, userId, isActive: true }
      });

      if (!dashboard) {
        return res.status(404).json({
          success: false,
          message: 'Dashboard not found or access denied'
        });
      }

      await dashboard.update({ isDefault: true });

      res.json({
        success: true,
        data: dashboard
      });

    } catch (error) {
      appLogger.error('Error setting default dashboard', {
        service: 'dashboards-api',
        error: error.message,
        dashboardId: req.params.id
      });
      next(error);
    }
  }
);

router.get('/:id/widgets',
  permissionMiddleware('dashboards', 'read'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const dashboard = await Dashboard.findOne({
        where: {
          id,
          isActive: true,
          [Op.or]: [
            { userId },
            {
              isShared: true,
              [Op.or]: [
                { sharedWith: { [Op.contains]: [userId] } },
                { sharedWith: { [Op.contains]: [req.user.role] } }
              ]
            }
          ]
        }
      });

      if (!dashboard) {
        return res.status(404).json({
          success: false,
          message: 'Dashboard not found or access denied'
        });
      }

      const widgets = await Widget.findAll({
        where: { dashboardId: id, isActive: true },
        order: [['createdAt', 'ASC']]
      });

      res.json({
        success: true,
        data: widgets
      });

    } catch (error) {
      appLogger.error('Error listing widgets', {
        service: 'dashboards-api',
        error: error.message,
        dashboardId: req.params.id
      });
      next(error);
    }
  }
);

router.post('/:id/widgets',
  permissionMiddleware('dashboards', 'create'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { type, dataset, query, title, position, refreshInterval } = req.body;

      const dashboard = await Dashboard.findOne({
        where: { id, userId, isActive: true }
      });

      if (!dashboard) {
        return res.status(404).json({
          success: false,
          message: 'Dashboard not found or access denied'
        });
      }

      if (!type || !dataset || !title) {
        return res.status(400).json({
          success: false,
          message: 'Widget type, dataset, and title are required'
        });
      }

      const widget = await Widget.create({
        dashboardId: id,
        type,
        dataset,
        query: query || {},
        title: title.trim(),
        position: position || { x: 0, y: 0, w: 4, h: 4 },
        refreshInterval: refreshInterval || null
      });

      res.status(201).json({
        success: true,
        data: widget
      });

    } catch (error) {
      appLogger.error('Error creating widget', {
        service: 'dashboards-api',
        error: error.message,
        dashboardId: req.params.id
      });
      next(error);
    }
  }
);

router.put('/widgets/:id',
  permissionMiddleware('dashboards', 'update'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { query, position, title, refreshInterval } = req.body;

      const widget = await Widget.findOne({
        where: { id, isActive: true },
        include: [{
          model: Dashboard,
          as: 'dashboard',
          where: { userId, isActive: true }
        }]
      });

      if (!widget) {
        return res.status(404).json({
          success: false,
          message: 'Widget not found or access denied'
        });
      }

      const updates = {};
      if (query !== undefined) updates.query = query;
      if (position !== undefined) updates.position = position;
      if (title !== undefined) updates.title = title.trim();
      if (refreshInterval !== undefined) updates.refreshInterval = refreshInterval;

      await widget.update(updates);

      res.json({
        success: true,
        data: widget
      });

    } catch (error) {
      appLogger.error('Error updating widget', {
        service: 'dashboards-api',
        error: error.message,
        widgetId: req.params.id
      });
      next(error);
    }
  }
);

router.delete('/widgets/:id',
  permissionMiddleware('dashboards', 'delete'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const widget = await Widget.findOne({
        where: { id, isActive: true },
        include: [{
          model: Dashboard,
          as: 'dashboard',
          where: { userId, isActive: true }
        }]
      });

      if (!widget) {
        return res.status(404).json({
          success: false,
          message: 'Widget not found or access denied'
        });
      }

      await widget.update({ isActive: false });

      res.json({
        success: true,
        message: 'Widget deleted successfully'
      });

    } catch (error) {
      appLogger.error('Error deleting widget', {
        service: 'dashboards-api',
        error: error.message,
        widgetId: req.params.id
      });
      next(error);
    }
  }
);

router.post('/widgets/query',
  permissionMiddleware('dashboards', 'read'),
  async (req, res, next) => {
    try {
      const { dataset, query } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      if (!dataset || !query) {
        return res.status(400).json({
          success: false,
          message: 'Dataset and query are required'
        });
      }

      const result = await executeQuery(dataset, query, userId, userRole);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      appLogger.error('Error executing widget query', {
        service: 'dashboards-api',
        error: error.message,
        userId: req.user.id
      });
      next(error);
    }
  }
);

router.post('/widgets/:id/refresh',
  permissionMiddleware('dashboards', 'read'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const widget = await Widget.findOne({
        where: { id, isActive: true },
        include: [{
          model: Dashboard,
          as: 'dashboard',
          where: {
            isActive: true,
            [Op.or]: [
              { userId },
              {
                isShared: true,
                [Op.or]: [
                  { sharedWith: { [Op.contains]: [userId] } },
                  { sharedWith: { [Op.contains]: [userRole] } }
                ]
              }
            ]
          }
        }]
      });

      if (!widget) {
        return res.status(404).json({
          success: false,
          message: 'Widget not found or access denied'
        });
      }

      await invalidateCache(widget.dataset, userId);

      const result = await executeQuery(
        widget.dataset,
        widget.query,
        userId,
        userRole
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      appLogger.error('Error refreshing widget', {
        service: 'dashboards-api',
        error: error.message,
        widgetId: req.params.id
      });
      next(error);
    }
  }
);

module.exports = router;
