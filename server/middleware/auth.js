const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { UnauthorizedError, ForbiddenError } = require('../utils/AppError');
const { createHash } = require('crypto');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedError('Invalid token format');
    }

    const secret = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
    const decoded = jwt.verify(token, secret);

    // Handle demo user case (when database might not be available)
    if (decoded.email === 'admin@demo.com' && decoded.id === '00000000-0000-0000-0000-000000000001') {
      try {
        const user = await User.findByPk(decoded.id);
        if (user) {
          // Database is available, use real user
          if (!user.isActive) {
            throw new UnauthorizedError('Account deactivated');
          }
          req.user = user;
          return next();
        }
      } catch (dbError) {
        console.log('Database not available, using demo user from token');
      }

      // Use demo user from token when database is not available
      const demoUser = {
        id: decoded.id,
        email: decoded.email,
        firstName: 'Demo',
        lastName: 'Admin',
        role: decoded.role || 'admin',
        title: 'System Administrator',
        department: 'IT',
        isActive: true,
        emailVerified: true,
        // Add hasPermission method for demo user (admin has all permissions)
        hasPermission: (resource, action) => true
      };

      req.user = demoUser;
      return next();
    }

    // Normal authentication for non-demo users
    const user = await User.findByPk(decoded.id);

    if (!user) {
      throw new UnauthorizedError('Invalid token - user not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account deactivated');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token expired'));
    }

    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid token'));
    }

    next(error);
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  next();
};

const managerMiddleware = (req, res, next) => {
  if (!['admin', 'manager'].includes(req.user.role)) {
    throw new ForbiddenError('Manager or admin access required');
  }
  next();
};

const permissionMiddleware = (resource, action) => {
  return (req, res, next) => {
    if (!req.user.hasPermission(resource, action)) {
      throw new ForbiddenError(`Insufficient permissions for ${action} on ${resource}`);
    }
    next();
  };
};

const ownershipMiddleware = (resourceField = 'userId') => {
  return async (req, res, next) => {
    try {
      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }
      
      const resourceId = req.params.id;
      if (!resourceId) {
        const { ValidationError } = require('../utils/AppError');
        throw new ValidationError('Resource ID required');
      }
      
      // This would need to be customized per model
      // For now, we'll allow managers to access team resources
      if (req.user.role === 'manager') {
        return next();
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

const rateLimitByRole = (req, res, next) => {
  // Different rate limits based on user role
  const limits = {
    admin: 10000,
    manager: 5000,
    agent: 2000,
    assistant: 1000
  };
  
  const userLimit = limits[req.user.role] || limits.assistant;
  
  // In a real implementation, you'd check against a rate limiting store
  // For now, we'll just attach the limit to the request
  req.rateLimit = userLimit;
  next();
};

// Token blacklist (in production, use Redis)
const tokenBlacklist = new Set();

// Enhanced token validation
const validateRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token required');
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw new UnauthorizedError('Invalid token type');
    }

    const user = await User.findByPk(decoded.id);
    
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    req.user = user;
    req.refreshToken = refreshToken;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid refresh token'));
    } else if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Refresh token has expired'));
    } else {
      next(error);
    }
  }
};

// API key authentication for integrations
const apiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.header('X-API-Key');
    
    if (!apiKey) {
      throw new UnauthorizedError('API key required');
    }

    // Validate API key (implement your API key validation logic)
    const validKeys = process.env.VALID_API_KEYS ? process.env.VALID_API_KEYS.split(',') : [];
    
    if (!validKeys.includes(apiKey)) {
      throw new UnauthorizedError('Invalid API key');
    }

    req.apiKey = apiKey;
    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return next();
    }

    const secret = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
    const decoded = jwt.verify(token, secret);
    const user = await User.findByPk(decoded.id);

    if (user && user.isActive) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

// Blacklist token (for logout)
const blacklistToken = (token) => {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  tokenBlacklist.add(tokenHash);
  
  // In production, store in Redis with TTL equal to token expiration
  // redis.setex(tokenHash, tokenTTL, 'blacklisted');
};

// Check if token is blacklisted
const isTokenBlacklisted = (token) => {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  return tokenBlacklist.has(tokenHash);
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  managerMiddleware,
  permissionMiddleware,
  ownershipMiddleware,
  rateLimitByRole,
  validateRefreshToken,
  apiKeyAuth,
  optionalAuth,
  blacklistToken,
  isTokenBlacklisted
};