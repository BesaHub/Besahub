const { v4: uuidv4 } = require('uuid');
const { auditLogger, appLogger, securityLogger } = require('../config/logger');
const { 
  AppError, 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError, 
  ConflictError, 
  RateLimitError 
} = require('../utils/AppError');

// Error tracking system
const errorTracker = {
  errors: new Map(),
  resetInterval: 60000, // 1 minute
  errorThreshold: 10, // Alert after 10 errors per minute
  
  track(errorType, endpoint) {
    const key = `${errorType}:${endpoint}`;
    const now = Date.now();
    
    if (!this.errors.has(key)) {
      this.errors.set(key, []);
    }
    
    const timestamps = this.errors.get(key);
    timestamps.push(now);
    
    // Remove timestamps older than 1 minute
    const recentErrors = timestamps.filter(ts => now - ts < this.resetInterval);
    this.errors.set(key, recentErrors);
    
    // Check if threshold exceeded
    if (recentErrors.length >= this.errorThreshold) {
      this.triggerAlert(errorType, endpoint, recentErrors.length);
    }
    
    return recentErrors.length;
  },
  
  triggerAlert(errorType, endpoint, count) {
    const alert = {
      type: 'ERROR_RATE_THRESHOLD_EXCEEDED',
      errorType,
      endpoint,
      count,
      threshold: this.errorThreshold,
      window: `${this.resetInterval / 1000} seconds`,
      timestamp: new Date().toISOString(),
      severity: 'HIGH'
    };
    
    appLogger.error('🚨 ERROR RATE ALERT', alert);
    securityLogger.warn('Error rate threshold exceeded', alert);
    
    console.error('🚨 ALERT: Error rate threshold exceeded:', alert);
  },
  
  getStats() {
    const stats = {};
    this.errors.forEach((timestamps, key) => {
      stats[key] = timestamps.length;
    });
    return stats;
  }
};

// Reset error counters periodically
setInterval(() => {
  const now = Date.now();
  errorTracker.errors.forEach((timestamps, key) => {
    const recentErrors = timestamps.filter(ts => now - ts < errorTracker.resetInterval);
    if (recentErrors.length === 0) {
      errorTracker.errors.delete(key);
    } else {
      errorTracker.errors.set(key, recentErrors);
    }
  });
}, errorTracker.resetInterval);

// Error categorization
const categorizeError = (err) => {
  // Database errors
  if (err.name?.startsWith('Sequelize') || err.parent?.code) {
    return 'database';
  }
  
  // Validation errors
  if (err.name === 'ValidationError' || err.statusCode === 400) {
    return 'validation';
  }
  
  // Authentication/Authorization errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' || 
      err.statusCode === 401 || err.statusCode === 403) {
    return 'authentication';
  }
  
  // API/Network errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
    return 'api';
  }
  
  // System errors (5xx)
  if (err.statusCode >= 500) {
    return 'system';
  }
  
  return 'unknown';
};

// Global Express error middleware
const errorHandler = (err, req, res, next) => {
  // Generate unique error ID for tracking
  const errorId = uuidv4();
  
  // Check for Celebrate/Joi errors FIRST - they should return 400
  if (err.joi || err.isJoi || err.name === 'CelebrateError') {
    appLogger.warn('Validation error', { 
      errorId,
      error: err.message, 
      details: err.details 
    });
    return res.status(400).json({
      error: 'Validation failed',
      details: err.details || err.message
    });
  }
  
  // Check for AppError and preserve its statusCode
  if (err.isOperational) {
    // This is an operational AppError with a known statusCode
    const errorCategory = categorizeError(err);
    
    // Prepare log data with full context
    const logData = {
      errorId,
      category: errorCategory,
      type: err.name || 'app_error',
      message: err.message,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      userEmail: req.user?.email,
      stack: err.stack,
      body: process.env.NODE_ENV === 'development' ? req.body : undefined,
      query: process.env.NODE_ENV === 'development' ? req.query : undefined,
      params: process.env.NODE_ENV === 'development' ? req.params : undefined
    };

    // Log to appropriate Winston logger
    const logLevel = err.statusCode >= 500 ? 'error' : 'warn';
    appLogger.log(logLevel, `API Error - ${errorCategory}`, logData);
    
    // Log security-related errors to security logger
    if (err.statusCode === 401 || err.statusCode === 403) {
      securityLogger.warn('Authentication/Authorization error', {
        errorId,
        category: errorCategory,
        userId: req.user?.id,
        ip: req.ip,
        path: req.path,
        message: err.message
      });
    }
    
    // Send error response with preserved statusCode - simple format for tests
    return res.status(err.statusCode).json({ error: err.message });
  }
  
  // Set default statusCode for non-AppError errors
  if (!err.statusCode) {
    err.statusCode = 500;
  }
  
  const errorCategory = categorizeError(err);
  
  // Default error properties
  let error = {
    id: errorId,
    category: errorCategory,
    message: err.message || 'Internal Server Error',
    statusCode: err.statusCode || 500,
    timestamp: err.timestamp || new Date().toISOString(),
    path: req.path,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent')
  };

  // Add user info if available (no sensitive data)
  if (req.user) {
    error.userId = req.user.id;
    error.userEmail = req.user.email;
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error.statusCode = 400;
    error.type = 'validation_error';
    error.errors = err.errors;
  } else if (err.name === 'SequelizeValidationError') {
    error.statusCode = 400;
    error.type = 'database_validation_error';
    error.errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    error.statusCode = 409;
    error.type = 'unique_constraint_error';
    error.field = err.errors[0]?.path;
    error.message = 'Resource already exists';
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    error.statusCode = 400;
    error.type = 'foreign_key_constraint_error';
    error.message = 'Referenced resource does not exist';
  } else if (err.name === 'SequelizeDatabaseError') {
    error.statusCode = 500;
    error.type = 'database_error';
    error.message = 'Database operation failed';
  } else if (err.name === 'JsonWebTokenError') {
    error.statusCode = 401;
    error.type = 'jwt_error';
    error.message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    error.statusCode = 401;
    error.type = 'jwt_expired_error';
    error.message = 'Authentication token has expired';
  } else if (err.name === 'MulterError') {
    error.statusCode = 400;
    error.type = 'file_upload_error';
    if (err.code === 'LIMIT_FILE_SIZE') {
      error.message = 'File size too large';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      error.message = 'Too many files uploaded';
    }
  } else if (err.code === 'ECONNREFUSED') {
    error.statusCode = 503;
    error.type = 'service_unavailable';
    error.message = 'External service unavailable';
  } else if (err.code === 'ETIMEDOUT') {
    error.statusCode = 504;
    error.type = 'gateway_timeout';
    error.message = 'Request timeout';
  }

  // Track error rate
  const errorCount = errorTracker.track(errorCategory, req.path);
  
  // Prepare log data with full context
  const logData = {
    errorId,
    category: errorCategory,
    type: error.type || 'server_error',
    message: error.message,
    statusCode: error.statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    userEmail: req.user?.email,
    errorCount,
    stack: err.stack,
    body: process.env.NODE_ENV === 'development' ? req.body : undefined,
    query: process.env.NODE_ENV === 'development' ? req.query : undefined,
    params: process.env.NODE_ENV === 'development' ? req.params : undefined
  };

  // Log to appropriate Winston logger
  const logLevel = error.statusCode >= 500 ? 'error' : 'warn';
  
  // Always log to app logger
  appLogger.log(logLevel, `API Error - ${error.category}`, logData);
  
  // Log security-related errors to security logger
  if (errorCategory === 'authentication' || error.statusCode === 401 || error.statusCode === 403) {
    securityLogger.warn('Authentication/Authorization error', {
      errorId,
      category: errorCategory,
      userId: req.user?.id,
      ip: req.ip,
      path: req.path,
      message: error.message
    });
  }
  
  // Log critical errors to audit logger
  if (error.statusCode >= 500) {
    auditLogger.error('Critical system error', {
      errorId,
      category: errorCategory,
      message: error.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      userId: req.user?.id
    });
  }

  // Send error response (no sensitive data)
  const response = {
    error: {
      id: errorId,
      message: error.statusCode >= 500 ? 'Internal server error' : error.message,
      type: error.type || 'server_error',
      category: errorCategory,
      timestamp: error.timestamp
    }
  };

  // Add validation errors (safe to expose)
  if (error.errors) {
    response.error.validation_errors = error.errors;
  }

  // Send appropriate HTTP status code
  res.status(error.statusCode).json(response);

  // Alert on critical errors
  if (error.statusCode >= 500) {
    alertCriticalError(error, err.stack);
  }
};

// Alert on critical errors
const alertCriticalError = (error, stack) => {
  const alert = {
    type: 'CRITICAL_ERROR',
    errorId: error.id,
    category: error.category,
    message: error.message,
    path: error.path,
    method: error.method,
    userId: error.userId,
    timestamp: error.timestamp,
    severity: 'CRITICAL',
    stack: stack
  };
  
  appLogger.error('🚨 CRITICAL ERROR ALERT', alert);
  console.error('🚨 CRITICAL ERROR:', alert);
};

// 404 handler for undefined routes
const notFoundHandler = (req, res) => {
  const error = {
    id: uuidv4(),
    message: `Route ${req.originalUrl} not found`,
    type: 'not_found',
    category: 'api',
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl
  };

  appLogger.warn('Route not found', {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json({ error });
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Process-level error handlers
const setupProcessErrorHandlers = () => {
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    const errorId = uuidv4();
    const errorData = {
      errorId,
      type: 'UNCAUGHT_EXCEPTION',
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
      severity: 'CRITICAL'
    };
    
    appLogger.error('🚨 UNCAUGHT EXCEPTION', errorData);
    auditLogger.error('Uncaught exception - system may be unstable', errorData);
    securityLogger.error('Uncaught exception detected', errorData);
    
    console.error('🚨 UNCAUGHT EXCEPTION:', err);
    
    // Give logger time to write
    setTimeout(() => {
      console.error('🛑 Process exiting due to uncaught exception');
      process.exit(1);
    }, 1000);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    const errorId = uuidv4();
    const errorData = {
      errorId,
      type: 'UNHANDLED_REJECTION',
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      timestamp: new Date().toISOString(),
      severity: 'HIGH'
    };
    
    appLogger.error('🚨 UNHANDLED PROMISE REJECTION', errorData);
    auditLogger.error('Unhandled promise rejection detected', errorData);
    
    console.error('🚨 UNHANDLED REJECTION:', reason);
    
    // In production, we might want to exit gracefully
    if (process.env.NODE_ENV === 'production') {
      setTimeout(() => {
        console.error('🛑 Process exiting due to unhandled rejection in production');
        process.exit(1);
      }, 1000);
    }
  });

  // Handle SIGTERM for graceful shutdown
  process.on('SIGTERM', () => {
    appLogger.info('SIGTERM received, shutting down gracefully');
    console.log('🛑 SIGTERM received, shutting down gracefully');
  });

  // Handle SIGINT (Ctrl+C) for graceful shutdown
  process.on('SIGINT', () => {
    appLogger.info('SIGINT received, shutting down gracefully');
    console.log('🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
  });
  
  console.log('✅ Process-level error handlers initialized');
};

// Export error stats endpoint handler
const getErrorStats = (req, res) => {
  const stats = {
    currentErrors: errorTracker.getStats(),
    threshold: errorTracker.errorThreshold,
    window: `${errorTracker.resetInterval / 1000} seconds`,
    timestamp: new Date().toISOString()
  };
  
  res.json(stats);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  setupProcessErrorHandlers,
  getErrorStats,
  errorTracker,
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError
};
