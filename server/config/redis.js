const Redis = require('ioredis');
const { appLogger } = require('./logger');

// Redis client with fallback
let redisClient = null;
let isRedisAvailable = false;

const createRedisClient = () => {
  try {
    // Only attempt connection if REDIS_URL is provided
    if (!process.env.REDIS_URL) {
      appLogger.warn('⚠️  Redis URL not configured - caching disabled');
      return null;
    }

    const client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 3) {
          appLogger.warn('⚠️  Redis max retries exceeded - caching disabled');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000);
      }
    });

    client.on('connect', () => {
      appLogger.info('✅ Redis connected successfully');
      isRedisAvailable = true;
    });

    client.on('error', (err) => {
      appLogger.warn('⚠️  Redis connection error:', err.message);
      isRedisAvailable = false;
    });

    client.on('close', () => {
      appLogger.warn('⚠️  Redis connection closed');
      isRedisAvailable = false;
    });

    // Attempt initial connection
    client.connect().catch(err => {
      appLogger.warn('⚠️  Redis initial connection failed:', err.message);
      isRedisAvailable = false;
    });

    return client;
  } catch (error) {
    appLogger.warn('⚠️  Redis initialization failed:', error.message);
    return null;
  }
};

// Initialize Redis client
redisClient = createRedisClient();

// Health check
const checkRedisHealth = async () => {
  if (!redisClient || !isRedisAvailable) {
    return { status: 'unavailable', message: 'Redis not configured or unavailable' };
  }

  try {
    const startTime = Date.now();
    await redisClient.ping();
    const responseTime = Date.now() - startTime;
    return { status: 'healthy', responseTime };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
};

module.exports = {
  redisClient,
  isRedisAvailable: () => isRedisAvailable,
  checkRedisHealth
};
