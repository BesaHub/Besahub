const { redisClient, isRedisAvailable } = require('../config/redis');
const { appLogger, security: securityLogger } = require('../config/logger');
const { User } = require('../models');
const securityAlertService = require('./securityAlertService');

const REDIS_KEYS = {
  LOGIN_FAIL_USER: (userId) => `auth:login:fail:${userId}`,
  LOGIN_FAIL_EMAIL: (email) => `auth:login:fail:email:${email}`,
  LOCK_USER: (userId) => `auth:lock:user:${userId}`
};

const LOCKOUT_CONFIG = {
  MAX_ATTEMPTS: 5,
  LOCKOUT_DURATION: 30 * 60,
  ATTEMPT_TTL: 30 * 60
};

class AuthService {
  async recordLoginAttempt(identifier, isEmail = false) {
    if (!isRedisAvailable()) {
      appLogger.warn('Redis unavailable - using DB-only login tracking');
      return;
    }

    try {
      const key = isEmail 
        ? REDIS_KEYS.LOGIN_FAIL_EMAIL(identifier)
        : REDIS_KEYS.LOGIN_FAIL_USER(identifier);

      const attempts = await redisClient.incr(key);
      
      await redisClient.expire(key, LOCKOUT_CONFIG.ATTEMPT_TTL);

      appLogger.info(`Login attempt recorded for ${isEmail ? 'email' : 'userId'}: ${identifier} (${attempts} attempts)`);

      return attempts;
    } catch (error) {
      appLogger.error('Error recording login attempt in Redis:', error);
    }
  }

  async checkLockout(userId, email) {
    const lockStatus = {
      isLocked: false,
      lockedUntil: null,
      attempts: 0,
      source: null
    };

    try {
      const user = await User.findByPk(userId);
      if (user && user.isLocked()) {
        lockStatus.isLocked = true;
        lockStatus.lockedUntil = user.lockUntil;
        lockStatus.source = 'database';
        return lockStatus;
      }
    } catch (dbError) {
      // If database is not available, skip database lockout check
      appLogger.warn('Database unavailable for lockout check, skipping:', dbError.message);
    }

    if (!isRedisAvailable()) {
      return lockStatus;
    }

    try {
      const redisLockKey = REDIS_KEYS.LOCK_USER(userId);
      const isRedisLocked = await redisClient.exists(redisLockKey);
      
      if (isRedisLocked) {
        const ttl = await redisClient.ttl(redisLockKey);
        lockStatus.isLocked = true;
        lockStatus.lockedUntil = new Date(Date.now() + ttl * 1000);
        lockStatus.source = 'redis';
        return lockStatus;
      }

      const userAttempts = await redisClient.get(REDIS_KEYS.LOGIN_FAIL_USER(userId)) || 0;
      const emailAttempts = await redisClient.get(REDIS_KEYS.LOGIN_FAIL_EMAIL(email)) || 0;
      
      lockStatus.attempts = Math.max(parseInt(userAttempts), parseInt(emailAttempts));

      return lockStatus;
    } catch (error) {
      appLogger.error('Error checking lockout status in Redis:', error);
      return lockStatus;
    }
  }

  async lockAccount(userId, email) {
    appLogger.warn(`Locking account for userId: ${userId}, email: ${email}`);

    const user = await User.findByPk(userId);
    if (user) {
      const lockUntil = new Date(Date.now() + LOCKOUT_CONFIG.LOCKOUT_DURATION * 1000);
      await user.update({ 
        lockUntil,
        loginAttempts: LOCKOUT_CONFIG.MAX_ATTEMPTS
      });
    }

    if (!isRedisAvailable()) {
      return;
    }

    try {
      const lockKey = REDIS_KEYS.LOCK_USER(userId);
      await redisClient.setex(lockKey, LOCKOUT_CONFIG.LOCKOUT_DURATION, 'locked');

      await redisClient.del(REDIS_KEYS.LOGIN_FAIL_USER(userId));
      await redisClient.del(REDIS_KEYS.LOGIN_FAIL_EMAIL(email));

      appLogger.info(`Account locked in Redis and DB for userId: ${userId}`);
    } catch (error) {
      appLogger.error('Error locking account in Redis:', error);
    }
  }

  async resetLoginAttempts(userId, email) {
    const user = await User.findByPk(userId);
    if (user) {
      await user.resetLoginAttempts();
    }

    if (!isRedisAvailable()) {
      return;
    }

    try {
      await redisClient.del(REDIS_KEYS.LOGIN_FAIL_USER(userId));
      await redisClient.del(REDIS_KEYS.LOGIN_FAIL_EMAIL(email));
      await redisClient.del(REDIS_KEYS.LOCK_USER(userId));

      appLogger.info(`Login attempts reset for userId: ${userId}`);
    } catch (error) {
      appLogger.error('Error resetting login attempts in Redis:', error);
    }
  }

  async handleFailedLogin(userId, email, ip = null, userAgent = null) {
    const userAttempts = await this.recordLoginAttempt(userId, false);
    const emailAttempts = await this.recordLoginAttempt(email, true);

    const maxAttempts = Math.max(
      parseInt(userAttempts) || 0,
      parseInt(emailAttempts) || 0
    );

    securityLogger('Failed login attempt', {
      userId,
      email,
      ip,
      userAgent,
      attempts: maxAttempts
    });

    await securityAlertService.checkBruteForce(ip, userId, email);

    if (maxAttempts >= LOCKOUT_CONFIG.MAX_ATTEMPTS) {
      await this.lockAccount(userId, email);
      return {
        locked: true,
        attemptsRemaining: 0
      };
    }

    return {
      locked: false,
      attemptsRemaining: LOCKOUT_CONFIG.MAX_ATTEMPTS - maxAttempts
    };
  }

  async handleSuccessfulLogin(userId, email, ip = null, userRole = null) {
    await this.resetLoginAttempts(userId, email);
    
    const user = await User.findByPk(userId);
    if (user) {
      await user.update({ lastLogin: new Date() });
    }

    if (ip) {
      await securityAlertService.checkMultipleIPs(userId, email, ip);
      await securityAlertService.checkAdminUnusualIP(userId, email, ip, userRole);
    }
  }
}

module.exports = new AuthService();
