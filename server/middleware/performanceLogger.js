const { appLogger } = require('../config/logger');

// Track query performance
const queryPerformanceLogger = (query, executionTime, options) => {
  const duration = executionTime;
  
  // Log slow queries (> 1000ms)
  if (duration > 1000) {
    appLogger.warn('Slow query detected', {
      service: 'cre-crm-performance',
      query: query.substring(0, 200), // Truncate long queries
      duration: `${duration}ms`,
      type: options?.type || 'unknown'
    });
  }
  
  // Log all queries in debug mode (only in development and for fast queries)
  if (process.env.NODE_ENV === 'development' && duration <= 1000) {
    appLogger.debug('Query executed', {
      service: 'cre-crm-performance',
      duration: `${duration}ms`,
      type: options?.type || 'unknown'
    });
  }
};

// API request performance middleware
const requestPerformanceLogger = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      service: 'cre-crm-performance',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent') || 'unknown'
    };
    
    // Only log slow requests (> 2000ms) as warnings
    if (duration > 2000) {
      appLogger.warn('Slow API request', logData);
    } else if (process.env.NODE_ENV === 'development') {
      // Only log normal requests in development
      appLogger.debug('API request completed', logData);
    }
  });
  
  next();
};

// Memory and resource monitoring
const getSystemMetrics = () => {
  const used = process.memoryUsage();
  return {
    memory: {
      rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(used.external / 1024 / 1024)}MB`
    },
    uptime: `${Math.round(process.uptime())}s`,
    cpu: process.cpuUsage()
  };
};

module.exports = {
  queryPerformanceLogger,
  requestPerformanceLogger,
  getSystemMetrics
};
