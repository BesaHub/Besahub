process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost/test';

// Global teardown
afterAll(async () => {
  // Close Sequelize connection
  const { sequelize } = require('../config/database');
  if (sequelize) {
    await sequelize.close();
  }
  
  // Close Redis connection if it exists
  try {
    const { redis } = require('../config/redis');
    if (redis && redis.quit) {
      await redis.quit();
    }
  } catch (err) {
    // Redis might not be configured in test environment
  }
  
  // Give a moment for connections to close
  await new Promise(resolve => setTimeout(resolve, 500));
});
