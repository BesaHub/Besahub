const winston = require('winston');
const expressWinston = require('express-winston');
const { v4: uuidv4 } = require('uuid');

// Configure request logger
const requestLogger = expressWinston.logger({
  transports: [
    new winston.transports.File({ 
      filename: 'logs/requests.log',
      maxsize: 5242880, // 5MB
      maxFiles: 10
    })
  ],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: false,
  requestWhitelist: ['url', 'headers', 'method', 'httpVersion', 'originalUrl', 'query'],
  responseWhitelist: ['statusCode'],
  bodyWhitelist: process.env.NODE_ENV === 'development' ? ['email', 'name'] : [],
  bodyBlacklist: ['password', 'token', 'refreshToken', 'apiKey'],
  ignoredRoutes: ['/health', '/favicon.ico'],
  skip: function (req, res) {
    // Skip logging for static files and health checks
    return req.url.startsWith('/uploads/') || 
           req.url === '/health' ||
           req.url === '/favicon.ico';
  },
  dynamicMeta: function (req, res) {
    return {
      requestId: req.requestId,
      userId: req.user?.id,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      responseTime: res.responseTime
    };
  }
});

// Request ID middleware
const requestId = (req, res, next) => {
  const id = uuidv4();
  req.requestId = id;
  res.set('X-Request-ID', id);
  next();
};

// Response time middleware
const responseTime = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.responseTime = duration;
    res.set('X-Response-Time', `${duration}ms`);
  });
  
  next();
};

// Performance tracking middleware
const performanceTracker = (req, res, next) => {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    // Log slow requests
    if (duration > 1000) {
      winston.warn('Slow request detected', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        userId: req.user?.id,
        statusCode: res.statusCode
      });
    }
    
    // Track API metrics
    trackApiMetrics(req, res, duration);
  });
  
  next();
};

// API metrics tracking
const trackApiMetrics = (req, res, duration) => {
  // In production, send to metrics service (Prometheus, DataDog, etc.)
  const metrics = {
    timestamp: new Date().toISOString(),
    method: req.method,
    route: req.route?.path || req.url,
    statusCode: res.statusCode,
    duration,
    userId: req.user?.id,
    userRole: req.user?.role,
    requestId: req.requestId
  };
  
  // Mock metrics collection - replace with actual service
  if (process.env.METRICS_ENDPOINT) {
    // Send to metrics service
    // fetch(process.env.METRICS_ENDPOINT, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(metrics)
    // }).catch(err => console.error('Metrics error:', err));
  }
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Add security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  
  next();
};

// Sanitize request data
const sanitizeRequest = (req, res, next) => {
  // Basic input sanitization
  if (req.body) {
    sanitizeObject(req.body);
  }
  
  if (req.query) {
    sanitizeObject(req.query);
  }
  
  if (req.params) {
    sanitizeObject(req.params);
  }
  
  next();
};

const sanitizeObject = (obj) => {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Remove potentially dangerous characters
      obj[key] = obj[key].replace(/[<>\"']/g, '');
      
      // Trim whitespace
      obj[key] = obj[key].trim();
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
};

// Request validation middleware
const validateRequest = (req, res, next) => {
  // Check for required headers
  const contentType = req.get('Content-Type');
  
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && 
      contentType && 
      !contentType.includes('application/json') && 
      !contentType.includes('multipart/form-data')) {
    return res.status(415).json({
      error: {
        message: 'Unsupported content type',
        supported: ['application/json', 'multipart/form-data']
      }
    });
  }
  
  // Check request size
  const contentLength = parseInt(req.get('Content-Length') || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (contentLength > maxSize) {
    return res.status(413).json({
      error: {
        message: 'Request entity too large',
        maxSize: '10MB'
      }
    });
  }
  
  next();
};

// CORS preflight handler
const corsPreflightHandler = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.set({
      'Access-Control-Allow-Origin': req.get('Origin') || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-API-Key',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400' // 24 hours
    });
    
    return res.status(204).send();
  }
  
  next();
};

module.exports = {
  requestLogger,
  requestId,
  responseTime,
  performanceTracker,
  securityHeaders,
  sanitizeRequest,
  validateRequest,
  corsPreflightHandler
};