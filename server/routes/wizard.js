const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { User, Dashboard, Widget } = require('../models');
const { appLogger } = require('../config/logger');

router.get('/status', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        firstRunCompleted: user.firstRunCompleted,
        isAdmin: user.role === 'admin',
        shouldShowWizard: user.role === 'admin' && !user.firstRunCompleted
      }
    });
  } catch (error) {
    appLogger.error('Wizard status check error:', error);
    next(error);
  }
});

router.post('/complete', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ firstRunCompleted: true });

    appLogger.info('First-run wizard completed', { userId: user.id });

    res.json({
      success: true,
      message: 'Wizard completed successfully',
      data: { firstRunCompleted: true }
    });
  } catch (error) {
    appLogger.error('Wizard completion error:', error);
    next(error);
  }
});

router.post('/create-sample-dashboard', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const dashboard = await Dashboard.create({
      userId: req.user.id,
      name: 'Sales Leader Dashboard',
      description: 'Sample dashboard with key sales metrics and pipeline insights',
      isDefault: false,
      isActive: true,
      layout: {
        lg: [
          { i: 'widget-1', x: 0, y: 0, w: 3, h: 2 },
          { i: 'widget-2', x: 3, y: 0, w: 3, h: 2 },
          { i: 'widget-3', x: 6, y: 0, w: 6, h: 3 },
          { i: 'widget-4', x: 0, y: 2, w: 6, h: 3 }
        ]
      }
    });

    const widgets = [
      {
        dashboardId: dashboard.id,
        type: 'kpi',
        title: 'Total Deals This Month',
        config: {
          metric: 'count',
          dataSource: 'deals',
          filters: { 
            dateRange: 'currentMonth',
            stage: ['qualification', 'proposal', 'negotiation', 'won']
          },
          format: 'number',
          prefix: '',
          suffix: ' deals',
          showTrend: true,
          comparisonPeriod: 'previousMonth'
        },
        position: 0,
        isActive: true
      },
      {
        dashboardId: dashboard.id,
        type: 'bar',
        title: 'Deals by Stage',
        config: {
          dataSource: 'deals',
          xAxis: 'stage',
          yAxis: 'count',
          filters: {
            dateRange: 'currentQuarter'
          },
          colors: ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f'],
          showLegend: true,
          showValues: true
        },
        position: 1,
        isActive: true
      },
      {
        dashboardId: dashboard.id,
        type: 'line',
        title: 'Deal Value Over Time',
        config: {
          dataSource: 'deals',
          xAxis: 'createdAt',
          yAxis: 'value',
          groupBy: 'month',
          filters: {
            dateRange: 'last6Months'
          },
          aggregation: 'sum',
          color: '#1976d2',
          showGrid: true,
          showDots: true,
          smooth: true,
          yAxisFormat: 'currency'
        },
        position: 2,
        isActive: true
      },
      {
        dashboardId: dashboard.id,
        type: 'funnel',
        title: 'Conversion Funnel',
        config: {
          dataSource: 'deals',
          stages: [
            { name: 'Lead', field: 'lead' },
            { name: 'Qualified', field: 'qualification' },
            { name: 'Proposal', field: 'proposal' },
            { name: 'Negotiation', field: 'negotiation' },
            { name: 'Closed Won', field: 'won' }
          ],
          filters: {
            dateRange: 'currentQuarter'
          },
          showPercentages: true,
          showCounts: true,
          colors: ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0']
        },
        position: 3,
        isActive: true
      }
    ];

    await Widget.bulkCreate(widgets);

    appLogger.info('Sample dashboard created', { 
      userId: req.user.id, 
      dashboardId: dashboard.id,
      widgetCount: widgets.length
    });

    res.json({
      success: true,
      message: 'Sample dashboard created successfully',
      data: {
        dashboardId: dashboard.id,
        name: dashboard.name,
        widgetCount: widgets.length
      }
    });
  } catch (error) {
    appLogger.error('Sample dashboard creation error:', error);
    next(error);
  }
});

module.exports = router;
