const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { appLogger, security: securityLogger } = require('../config/logger');
const securityAlertService = require('../services/securityAlertService');

const requestSignatureCache = new Map();
const DUPLICATE_REQUEST_WINDOW = 2000; // 2 seconds instead of 100ms

const getRequestSignature = (req) => {
  const body = req.body ? JSON.stringify(req.body) : '';
  const bodyHash = crypto.createHash('sha256').update(body).digest('hex').substring(0, 16);
  return `${req.ip}-${req.headers['user-agent']}-${bodyHash}`;
};

const detectDuplicateRequest = (req) => {
  if (process.env.DEMO_MODE === 'true' || process.env.NODE_ENV === 'development') {
    return false;
  }

  const signature = getRequestSignature(req);
  const now = Date.now();
  const lastRequest = requestSignatureCache.get(signature);

  if (lastRequest && (now - lastRequest) < DUPLICATE_REQUEST_WINDOW) {
    appLogger.warn('⚠️ Duplicate request detected within 1 second', {
      ip: req.ip,
      path: req.path,
      signature,
      timeSinceLastRequest: now - lastRequest
    });
    securityLogger('Rapid duplicate request detected', {
      ip: req.ip,
      path: req.path,
      signature,
      timeSinceLastRequest: now - lastRequest
    });
    return true;
  }

  requestSignatureCache.set(signature, now);

  if (requestSignatureCache.size > 10000) {
    const entries = Array.from(requestSignatureCache.entries());
    const cutoffTime = now - (60 * 1000);
    entries.forEach(([key, timestamp]) => {
      if (timestamp < cutoffTime) {
        requestSignatureCache.delete(key);
      }
    });
  }

  return false;
};

const createRateLimiter = (options) => {
  const {
    windowMs,
    max,
    message,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    name = 'rate-limiter',
    skip: customSkip
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    skipFailedRequests,
    skip: (req) => {
      // Use custom skip function if provided
      if (customSkip && typeof customSkip === 'function') {
        return customSkip(req);
      }
      // Skip in development/demo mode
      if (process.env.NODE_ENV === 'development' || process.env.DEMO_MODE === 'true') {
        return true;
      }
      if (detectDuplicateRequest(req)) {
        return false;
      }
      return false;
    },
    handler: async (req, res) => {
      const logData = {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent'],
        user: req.user?.email || 'anonymous'
      };

      appLogger.warn(`⚠️ Rate limit exceeded: ${name}`, logData);
      securityLogger('Rate limit exceeded', { ...logData, limiter: name });

      await securityAlertService.checkRateLimitViolations(
        req.user?.email || req.ip,
        req.ip,
        req.headers['user-agent']
      ).catch(err => appLogger.error('Error checking rate limit violations:', err));

      res.status(429).json({
        error: message
      });
    }
  });
};

const duplicateRequestBlocker = (req, res, next) => {
  if (detectDuplicateRequest(req)) {
    appLogger.warn('🚫 Blocking duplicate request', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    return res.status(429).json({
      error: 'Duplicate request detected. Please wait before retrying.'
    });
  }
  next();
};

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 5, // Very lenient in development
  message: 'Too many authentication attempts from this IP, please try again in 15 minutes',
  skipSuccessfulRequests: false,
  name: 'auth-limiter'
});

const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many password reset attempts from this IP, please try again in 1 hour',
  skipSuccessfulRequests: true,
  name: 'password-reset-limiter'
});

const mfaVerifyLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many MFA verification attempts from this IP, please try again in 15 minutes',
  skipSuccessfulRequests: false,
  name: 'mfa-verify-limiter'
});

const strictLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: 'Too many sensitive operation attempts from this IP, please try again in 15 minutes',
  skipSuccessfulRequests: true,
  name: 'strict-limiter'
});

const generalLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please slow down',
  skipSuccessfulRequests: true,
  name: 'general-limiter'
});

module.exports = {
  authLimiter,
  passwordResetLimiter,
  mfaVerifyLimiter,
  strictLimiter,
  generalLimiter,
  createRateLimiter,
  duplicateRequestBlocker
};
