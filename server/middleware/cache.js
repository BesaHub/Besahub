const { redisClient, isRedisAvailable } = require('../config/redis');
const { appLogger } = require('../config/logger');

// Cache middleware with TTL
const cacheMiddleware = (keyGenerator, ttlSeconds = 300) => {
  return async (req, res, next) => {
    // Skip caching if Redis is unavailable
    if (!redisClient || !isRedisAvailable()) {
      return next();
    }

    try {
      const cacheKey = typeof keyGenerator === 'function' 
        ? keyGenerator(req) 
        : `crm:${keyGenerator}:${JSON.stringify(req.query || {})}`;

      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        appLogger.debug(`Cache HIT: ${cacheKey}`);
        return res.json(JSON.parse(cachedData));
      }

      // Cache MISS - store original json method
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        // Cache the response
        redisClient.setex(cacheKey, ttlSeconds, JSON.stringify(data)).catch(err => {
          appLogger.warn('Cache write error:', err.message);
        });
        return originalJson(data);
      };

      next();
    } catch (error) {
      appLogger.warn('Cache middleware error:', error.message);
      next(); // Continue without caching on error
    }
  };
};

// Cache invalidation helper
const invalidateCache = async (pattern) => {
  if (!redisClient || !isRedisAvailable()) {
    return;
  }

  try {
    let cursor = '0';
    let deletedCount = 0;
    
    // Use SCAN instead of KEYS to avoid blocking
    do {
      const [newCursor, keys] = await redisClient.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      
      cursor = newCursor;
      
      if (keys.length > 0) {
        await redisClient.del(...keys);
        deletedCount += keys.length;
      }
    } while (cursor !== '0');
    
    if (deletedCount > 0) {
      appLogger.debug(`Invalidated cache: ${pattern} (${deletedCount} keys)`, {
        service: 'cre-crm-app'
      });
    }
  } catch (error) {
    appLogger.warn('Cache invalidation error:', { 
      service: 'cre-crm-app',
      error: error.message 
    });
  }
};

module.exports = {
  cacheMiddleware,
  invalidateCache
};
