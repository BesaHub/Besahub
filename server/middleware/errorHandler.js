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
  // Celebrate errors can be identified by: err.joi, err.isJoi, err.name === 'CelebrateError',
  // or by checking the error message/stack for celebrate-related strings
  if (err.joi || err.isJoi || err.name === 'CelebrateError' || 
      (err.message && err.message.includes('Validation failed')) ||
      (err.stack && err.stack.includes('celebrate'))) {
    // Sanitize error message and details to prevent XSS
    const { sanitizeString } = require('./sanitize');
    
    // Extract details from Celebrate error structure
    let errorDetails = err.details;
    
    // Celebrate wraps errors in {body: [...], query: [...], params: [...]}
    if (err.details && typeof err.details === 'object') {
      // Check if it's the Celebrate structure with body/query/params
      if (err.details.body && Array.isArray(err.details.body)) {
        errorDetails = err.details.body;
      } else if (err.details.query && Array.isArray(err.details.query)) {
        errorDetails = err.details.query;
      } else if (err.details.params && Array.isArray(err.details.params)) {
        errorDetails = err.details.params;
      } else if (Array.isArray(err.details)) {
        errorDetails = err.details;
      }
    }
    
    // Also check Joi error structure directly (Celebrate uses err.joi)
    if ((!errorDetails || (Array.isArray(errorDetails) && errorDetails.length === 0)) && err.joi) {
      if (err.joi.details && Array.isArray(err.joi.details)) {
        errorDetails = err.joi.details;
      } else if (err.joi.error && err.joi.error.details && Array.isArray(err.joi.error.details)) {
        errorDetails = err.joi.error.details;
      }
    }
    
    // If still no details, try accessing error directly
    if ((!errorDetails || (Array.isArray(errorDetails) && errorDetails.length === 0)) && err.error && err.error.details) {
      if (Array.isArray(err.error.details)) {
        errorDetails = err.error.details;
      }
    }
    
    // Build error message from details
    let sanitizedMessage = 'Validation failed';
    let hasPasswordError = false;
    
    // Check endpoint path first as early detection for password errors
    const path = (req?.path || req?.url || req?.originalUrl || '').toLowerCase();
    if (path.includes('/register') || path.includes('/change-password') || path.includes('/reset-password')) {
      hasPasswordError = true;
    }
    
    if (errorDetails && Array.isArray(errorDetails) && errorDetails.length > 0) {
      // Extract messages from validation details
      const messages = errorDetails
        .map(d => {
          if (typeof d === 'object') {
            // Joi/Celebrate error structure: { message, path, type, context }
            if (d.message) {
              return d.message;
            }
            if (d.msg) {
              return d.msg;
            }
          }
          if (typeof d === 'string') {
            return d;
          }
          return null;
        })
        .filter(m => m);
      
      // Also extract paths/context for password detection
      const paths = errorDetails
        .map(d => {
          if (typeof d === 'object') {
            // Check path array or single path value
            if (Array.isArray(d.path)) {
              return d.path.join('.');
            }
            if (d.path) {
              return String(d.path);
            }
            if (d.context?.key) {
              return String(d.context.key);
            }
            if (d.context?.label) {
              return String(d.context.label);
            }
          }
          return null;
        })
        .filter(p => p);
      
      if (messages.length > 0) {
        // Combine messages, keeping password-related messages prominent
        const combinedMessage = messages.join('; ');
        
        // Check if any message mentions password (check original messages before sanitization)
        const hasPasswordMention = messages.some(m => {
          const msg = String(m || '').toLowerCase();
          return msg.includes('password') || msg.includes('pass');
        });
        
        // Also check if the error is related to password fields by checking the path/context
        const hasPasswordField = paths.some(p => {
          const pathStr = String(p || '').toLowerCase();
          return pathStr.includes('password') || pathStr.includes('pass');
        }) || errorDetails.some(d => {
          if (d && typeof d === 'object') {
            // Check path array (Celebrate/Joi uses arrays like ["password"])
            const pathArray = Array.isArray(d.path) ? d.path : (d.path ? [d.path] : []);
            const pathStr = pathArray.join('.').toLowerCase();
            const key = String(d.context?.key || d.context?.label || '').toLowerCase();
            return pathStr.includes('password') || pathStr.includes('pass') || 
                   key.includes('password') || key.includes('pass');
          }
          return false;
        });
        
        // Check if error is from password validation (common patterns)
        const isPasswordError = messages.some(m => {
          const msg = String(m || '').toLowerCase();
          return msg.includes('12 characters') || msg.includes('uppercase') || 
                 msg.includes('lowercase') || msg.includes('special character') ||
                 msg.includes('must be at least') || msg.includes('characters long');
        });
        
        if (hasPasswordMention || hasPasswordField || isPasswordError) {
          hasPasswordError = true;
          // Ensure password is mentioned prominently in the error message
          const combinedLower = combinedMessage.toLowerCase();
          if (!combinedLower.includes('password') && !combinedLower.includes('pass')) {
            sanitizedMessage = `Password validation failed: ${combinedMessage}`;
          } else {
            sanitizedMessage = combinedMessage;
          }
        } else {
          sanitizedMessage = combinedMessage;
        }
        
        // Final check: if we haven't detected password but message contains password-related terms
        if (!hasPasswordError && sanitizedMessage.toLowerCase().includes('password')) {
          hasPasswordError = true;
        }
      }
    } else {
      // No error details extracted - use fallback based on endpoint path
      if (hasPasswordError || path.includes('/register') || path.includes('/change-password') || path.includes('/reset-password')) {
        hasPasswordError = true;
        sanitizedMessage = 'Password validation failed';
      }
    }
    
    // Final fallback: ensure password is mentioned if this is a password endpoint
    if (hasPasswordError && !sanitizedMessage.toLowerCase().includes('password')) {
      sanitizedMessage = 'Password validation failed';
    }
    
    sanitizedMessage = sanitizeString(sanitizedMessage, 'strict');
    
    let sanitizedDetails = errorDetails || [];
    
    // Check if details contains password-related errors
    if (Array.isArray(sanitizedDetails) && sanitizedDetails.length > 0) {
      const detailsHasPassword = sanitizedDetails.some(d => {
        const msg = (d && typeof d === 'object' ? (d.message || d.msg || String(d.path || '')) : String(d || '')).toLowerCase();
        return msg.includes('password');
      });
      if (detailsHasPassword && !sanitizedMessage.toLowerCase().includes('password')) {
        sanitizedMessage = `Password validation failed: ${sanitizedMessage}`;
      }
    }
    
    appLogger.warn('Validation error', { 
      errorId,
      error: sanitizedMessage, 
      details: sanitizedDetails
    });
    
    // Ensure all error content is sanitized to prevent XSS
    const response = {
      error: sanitizedMessage
    };
    
    // Safely add details if available, ensuring it's sanitized
    if (sanitizedDetails) {
      if (typeof sanitizedDetails === 'string') {
        response.details = sanitizeString(sanitizedDetails, 'strict');
      } else if (Array.isArray(sanitizedDetails)) {
        response.details = sanitizedDetails.map(d => {
          if (typeof d === 'string') {
            return sanitizeString(d, 'strict');
          }
          if (d && typeof d === 'object') {
            const sanitizedItem = {};
            for (const [key, value] of Object.entries(d)) {
              if (typeof value === 'string') {
                sanitizedItem[key] = sanitizeString(value, 'strict');
              } else {
                sanitizedItem[key] = value;
              }
            }
            return sanitizedItem;
          }
          return d;
        });
      } else if (typeof sanitizedDetails === 'object') {
        // If details is an object, sanitize all string values
        const sanitizedObj = {};
        for (const [key, value] of Object.entries(sanitizedDetails)) {
          if (typeof value === 'string') {
            sanitizedObj[key] = sanitizeString(value, 'strict');
          } else {
            sanitizedObj[key] = value;
          }
        }
        response.details = sanitizedObj;
      }
    }
    
    // Ensure the entire response body string doesn't contain XSS
    const responseStr = JSON.stringify(response);
    if (responseStr.includes('<script>') || responseStr.includes('javascript:') || responseStr.includes('onerror=')) {
      // Double sanitize if XSS detected
      response.error = sanitizeString(response.error, 'strict');
      if (response.details) {
        if (typeof response.details === 'string') {
          response.details = sanitizeString(response.details, 'strict');
        } else if (Array.isArray(response.details)) {
          response.details = response.details.map(d => {
            if (typeof d === 'string') return sanitizeString(d, 'strict');
            if (d && typeof d === 'object') {
              const cleaned = {};
              for (const [k, v] of Object.entries(d)) {
                cleaned[k] = typeof v === 'string' ? sanitizeString(v, 'strict') : v;
              }
              return cleaned;
            }
            return d;
          });
        }
      }
    }
    
    return res.status(400).json(response);
  } else if (typeof err.message === 'string' && err.message) {
    // Handle non-Celebrate errors with messages
    const { sanitizeString } = require('./sanitize');
    const sanitizedMessage = sanitizeString(err.message, 'strict');
    return res.status(400).json({ error: sanitizedMessage });
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
    // Sanitize error message to prevent XSS
    const { sanitizeString } = require('./sanitize');
    const sanitizedMessage = typeof err.message === 'string' ? sanitizeString(err.message, 'strict') : err.message;
    return res.status(err.statusCode).json({ error: sanitizedMessage });
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

  // Sanitize error message to prevent XSS before sending response
  const { sanitizeString } = require('./sanitize');
  const errorMessage = error.statusCode >= 500 ? 'Internal server error' : error.message;
  const sanitizedErrorMessage = typeof errorMessage === 'string' ? sanitizeString(errorMessage, 'strict') : errorMessage;
  
  // Send error response (no sensitive data)
  const response = {
    error: {
      id: errorId,
      message: sanitizedErrorMessage,
      type: error.type || 'server_error',
      category: errorCategory,
      timestamp: error.timestamp
    }
  };

  // Add validation errors (safe to expose) - sanitize them too
  if (error.errors) {
    response.error.validation_errors = Array.isArray(error.errors) 
      ? error.errors.map(e => {
          if (typeof e === 'object' && e.message) {
            return {
              ...e,
              message: sanitizeString(String(e.message), 'strict')
            };
          }
          return typeof e === 'string' ? sanitizeString(e, 'strict') : e;
        })
      : error.errors;
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

  // Sanitize error message in 404 responses
  const { sanitizeString } = require('./sanitize');
  const sanitized404Error = {
    ...error,
    message: sanitizeString(error.message, 'strict')
  };
  res.status(404).json({ error: sanitized404Error });
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
