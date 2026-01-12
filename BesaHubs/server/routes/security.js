const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const securityMonitoringService = require('../services/securityMonitoringService');
const securityAlertService = require('../services/securityAlertService');

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.get('/dashboard', authMiddleware, adminOnly, async (req, res, next) => {
  try {
    const { timeWindow = '24h' } = req.query;
    
    const stats = await securityMonitoringService.getDashboardStats(timeWindow);
    
    res.json({
      success: true,
      data: stats,
      timeWindow
    });
  } catch (error) {
    console.error('Error fetching security dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security dashboard'
    });
  }
});

router.get('/failed-logins', authMiddleware, adminOnly, async (req, res, next) => {
  try {
    const {
      timeWindow = '24h',
      page = 1,
      limit = 50,
      ip,
      email
    } = req.query;

    const result = await securityMonitoringService.getFailedLoginAttempts({
      timeWindow,
      page: parseInt(page),
      limit: parseInt(limit),
      ip,
      email
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error fetching failed logins:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch failed login attempts'
    });
  }
});

router.get('/rate-limit-violations', authMiddleware, adminOnly, async (req, res, next) => {
  try {
    const {
      timeWindow = '24h',
      page = 1,
      limit = 50,
      ip
    } = req.query;

    const result = await securityMonitoringService.getRateLimitViolations({
      timeWindow,
      page: parseInt(page),
      limit: parseInt(limit),
      ip
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error fetching rate limit violations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rate limit violations'
    });
  }
});

router.get('/suspicious-activity', authMiddleware, adminOnly, async (req, res, next) => {
  try {
    const { timeWindow = '24h' } = req.query;
    
    const activity = await securityMonitoringService.detectSuspiciousActivity(timeWindow);
    
    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error detecting suspicious activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect suspicious activity'
    });
  }
});

router.get('/alerts', authMiddleware, adminOnly, async (req, res, next) => {
  try {
    const { limit = 10, severity } = req.query;
    
    const alerts = await securityAlertService.getRecentAlerts(
      parseInt(limit),
      severity
    );
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security alerts'
    });
  }
});

router.get('/alerts/stats', authMiddleware, adminOnly, async (req, res, next) => {
  try {
    const { timeWindow = '24h' } = req.query;
    
    const stats = await securityAlertService.getAlertStats(timeWindow);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alert statistics'
    });
  }
});

router.post('/alerts/:id/resolve', authMiddleware, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const alert = await securityAlertService.resolveAlert(
      id,
      req.user.id,
      notes
    );
    
    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(error.message === 'Alert not found' ? 404 : 500).json({
      success: false,
      error: error.message || 'Failed to resolve alert'
    });
  }
});

router.get('/lockouts', authMiddleware, adminOnly, async (req, res, next) => {
  try {
    const lockouts = await securityMonitoringService.getAccountLockouts();
    
    res.json({
      success: true,
      data: lockouts
    });
  } catch (error) {
    console.error('Error fetching account lockouts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch account lockouts'
    });
  }
});

router.get('/mfa-stats', authMiddleware, adminOnly, async (req, res, next) => {
  try {
    const stats = await securityMonitoringService.getMFAEnrollmentRate();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching MFA stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch MFA statistics'
    });
  }
});

module.exports = router;
