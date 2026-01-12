const crypto = require('crypto');
const { appLogger } = require('../../config/logger');
const { getRedisClient } = require('../../config/redis');
const dealsResolver = require('./datasets/deals');
const tasksResolver = require('./datasets/tasks');
const propertiesResolver = require('./datasets/properties');
const contactsResolver = require('./datasets/contacts');
const campaignsResolver = require('./datasets/campaigns');
const agentsResolver = require('./datasets/agents');

const DATASET_RESOLVERS = {
  deals: dealsResolver,
  tasks: tasksResolver,
  properties: propertiesResolver,
  contacts: contactsResolver,
  campaigns: campaignsResolver,
  agents: agentsResolver
};

const CACHE_TTL = 600;

function validateQuery(query) {
  if (!query || typeof query !== 'object') {
    throw new Error('Query must be a valid object');
  }

  if (query.metrics && !Array.isArray(query.metrics)) {
    throw new Error('Metrics must be an array');
  }

  if (query.filters && typeof query.filters !== 'object') {
    throw new Error('Filters must be an object');
  }

  if (query.limit && (typeof query.limit !== 'number' || query.limit < 1 || query.limit > 10000)) {
    throw new Error('Limit must be a number between 1 and 10000');
  }

  if (query.offset && (typeof query.offset !== 'number' || query.offset < 0)) {
    throw new Error('Offset must be a non-negative number');
  }

  return true;
}

function generateCacheKey(dataset, query, userId, userRole) {
  const queryString = JSON.stringify({ dataset, query, userId, userRole });
  const hash = crypto.createHash('sha256').update(queryString).digest('hex');
  
  appLogger.debug('Generated cache key hash', {
    service: 'query-engine',
    dataset,
    userId,
    userRole,
    hash: hash.substring(0, 16) + '...'
  });
  
  return `query:${hash}`;
}

async function getCachedResult(cacheKey) {
  try {
    const redis = getRedisClient();
    if (!redis) return null;

    const cached = await redis.get(cacheKey);
    if (cached) {
      appLogger.info('Query result retrieved from cache', {
        service: 'query-engine',
        cacheKey
      });
      return JSON.parse(cached);
    }
  } catch (error) {
    appLogger.warn('Cache retrieval failed, continuing without cache', {
      service: 'query-engine',
      error: error.message
    });
  }
  return null;
}

async function setCachedResult(cacheKey, result) {
  try {
    const redis = getRedisClient();
    if (!redis) return;

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
    appLogger.info('Query result cached', {
      service: 'query-engine',
      cacheKey,
      ttl: CACHE_TTL
    });
  } catch (error) {
    appLogger.warn('Cache storage failed, continuing without cache', {
      service: 'query-engine',
      error: error.message
    });
  }
}

async function executeQuery(dataset, query, userId, userRole) {
  try {
    validateQuery(query);

    if (!DATASET_RESOLVERS[dataset]) {
      throw new Error(`Unknown dataset: ${dataset}`);
    }

    const cacheKey = generateCacheKey(dataset, query, userId, userRole);
    const cachedResult = await getCachedResult(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }

    appLogger.info('Executing query', {
      service: 'query-engine',
      dataset,
      userId,
      userRole,
      query: JSON.stringify(query)
    });

    const resolver = DATASET_RESOLVERS[dataset];
    const result = await resolver.resolve(query, userId, userRole);

    if (!result || typeof result !== 'object') {
      throw new Error('Resolver must return a valid result object');
    }

    const standardizedResult = {
      rows: result.rows || [],
      fields: result.fields || [],
      summary: result.summary || {},
      chartData: result.chartData || [],
      executedAt: new Date().toISOString()
    };

    await setCachedResult(cacheKey, standardizedResult);

    appLogger.info('Query executed successfully', {
      service: 'query-engine',
      dataset,
      rowCount: standardizedResult.rows.length
    });

    return standardizedResult;

  } catch (error) {
    appLogger.error('Query execution failed', {
      service: 'query-engine',
      dataset,
      userId,
      error: error.message,
      stack: error.stack
    });

    throw error;
  }
}

async function invalidateCache(dataset, userId = null) {
  try {
    const redis = getRedisClient();
    if (!redis) return;

    const pattern = userId ? `query:*${dataset}*${userId}*` : `query:*${dataset}*`;
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(...keys);
      appLogger.info('Cache invalidated', {
        service: 'query-engine',
        dataset,
        userId,
        keysDeleted: keys.length
      });
    }
  } catch (error) {
    appLogger.warn('Cache invalidation failed', {
      service: 'query-engine',
      error: error.message
    });
  }
}

module.exports = {
  executeQuery,
  invalidateCache,
  DATASET_RESOLVERS
};
