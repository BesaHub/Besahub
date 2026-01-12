const express = require('express');
const router = express.Router();
const DatabaseWrapper = require('../utils/dbWrapper');
const { sequelize } = require('../config/database');

/**
 * Health Check Endpoint
 * Returns system status and database connectivity information
 */
router.get('/', async (req, res, next) => {
  try {
    const startTime = Date.now();
    
    // Check database availability
    const dbAvailable = await DatabaseWrapper.isAvailable(sequelize, 3000);
    const responseTime = Date.now() - startTime;

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        connected: dbAvailable,
        responseTime: `${responseTime}ms`,
        status: dbAvailable ? 'operational' : 'degraded'
      },
      features: {
        login: 'operational',
        dashboard: dbAvailable ? 'operational' : 'using fallback data',
        properties: dbAvailable ? 'operational' : 'using fallback data',
        contacts: dbAvailable ? 'operational' : 'using fallback data',
        deals: dbAvailable ? 'operational' : 'using fallback data',
        tasks: dbAvailable ? 'operational' : 'using fallback data',
        leases: dbAvailable ? 'operational' : 'using fallback data',
        debts: dbAvailable ? 'operational' : 'using fallback data'
      },
      environment: process.env.NODE_ENV || 'development'
    };

    // Set appropriate status code
    const statusCode = dbAvailable ? 200 : 207; // 207 = Multi-Status (partial functionality)

    res.status(statusCode).json(healthStatus);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
