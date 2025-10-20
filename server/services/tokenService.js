const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { redisClient, isRedisAvailable } = require('../config/redis');
const { appLogger, security: securityLogger } = require('../config/logger');
const securityAlertService = require('./securityAlertService');

let secretsManager = null;
try {
  secretsManager = require('./secretsManager');
} catch (error) {
  appLogger.debug('SecretsManager not available, using environment variables');
}

const REDIS_KEYS = {
  REFRESH_TOKEN: (jti) => `auth:rt:${jti}`,
  SESSION_INDEX: (sid) => `auth:idx:sid:${sid}`,
  BLACKLIST: (jti) => `auth:bl:${jti}`
};

const TOKEN_CONFIG = {
  ACCESS_EXPIRY: '15m',
  REFRESH_EXPIRY: '7d',
  REFRESH_EXPIRY_SECONDS: 7 * 24 * 60 * 60
};

const hashJti = (jti) => {
  return crypto.createHash('sha256').update(jti).digest('hex');
};

const getJWTSecret = async () => {
  if (secretsManager && secretsManager.getMode() === 'doppler') {
    try {
      const secret = await secretsManager.get('JWT_SECRET', { required: true });
      return secret;
    } catch (error) {
      appLogger.warn('Failed to get JWT_SECRET from secretsManager, using env fallback', { error: error.message });
    }
  }
  
  const secret = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
  if (!process.env.JWT_SECRET) {
    appLogger.warn('⚠️  JWT_SECRET not set, using fallback. Set JWT_SECRET environment variable for production!');
  }
  return secret;
};

class TokenService {
  async issueTokens(user) {
    const secret = await getJWTSecret();

    const jti = uuidv4();
    const sid = uuidv4();

    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      secret,
      { expiresIn: TOKEN_CONFIG.ACCESS_EXPIRY }
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
        type: 'refresh',
        jti,
        sid
      },
      secret,
      { expiresIn: TOKEN_CONFIG.REFRESH_EXPIRY }
    );

    if (isRedisAvailable()) {
      try {
        const hashedJti = hashJti(jti);
        const tokenData = JSON.stringify({
          userId: user.id,
          sid,
          exp: Date.now() + TOKEN_CONFIG.REFRESH_EXPIRY_SECONDS * 1000
        });

        await redisClient.setex(
          REDIS_KEYS.REFRESH_TOKEN(hashedJti),
          TOKEN_CONFIG.REFRESH_EXPIRY_SECONDS,
          tokenData
        );

        await redisClient.sadd(REDIS_KEYS.SESSION_INDEX(sid), hashedJti);
        await redisClient.expire(
          REDIS_KEYS.SESSION_INDEX(sid),
          TOKEN_CONFIG.REFRESH_EXPIRY_SECONDS
        );

        appLogger.info(`Tokens issued for user ${user.id} with sid: ${sid}`);
      } catch (error) {
        appLogger.error('Error storing refresh token in Redis:', error);
      }
    }

    return { accessToken, refreshToken, jti, sid };
  }

  async rotateRefreshToken(oldToken) {
    const secret = await getJWTSecret();

    try {
      const decoded = jwt.verify(oldToken, secret);

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      if (!decoded.jti || !decoded.sid) {
        appLogger.info('Legacy token detected (no jti/sid) - issuing new token with rotation support');
        const { User } = require('../models');
        const user = await User.findByPk(decoded.id);
        
        if (!user || !user.isActive) {
          throw new Error('User not found or inactive');
        }

        return await this.issueTokens(user);
      }

      const hashedOldJti = hashJti(decoded.jti);

      if (await this.isRefreshRevoked(decoded.jti)) {
        appLogger.warn(`⚠️  Reuse detected! Revoking entire session family for sid: ${decoded.sid}`);
        
        const { User } = require('../models');
        const user = await User.findByPk(decoded.id);
        
        if (user) {
          await securityAlertService.logTokenReuse(
            user.id,
            user.email,
            null,
            decoded.jti
          );
        }
        
        await this.revokeTokenFamily(decoded.sid);
        throw new Error('Token reuse detected - session revoked for security');
      }

      await this.blacklistToken(decoded.jti, decoded.sid);

      const { User } = require('../models');
      const user = await User.findByPk(decoded.id);
      
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      const newJti = uuidv4();
      const sid = decoded.sid;

      const accessToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role
        },
        secret,
        { expiresIn: TOKEN_CONFIG.ACCESS_EXPIRY }
      );

      const refreshToken = jwt.sign(
        {
          id: user.id,
          type: 'refresh',
          jti: newJti,
          sid
        },
        secret,
        { expiresIn: TOKEN_CONFIG.REFRESH_EXPIRY }
      );

      if (isRedisAvailable()) {
        try {
          const hashedNewJti = hashJti(newJti);
          const tokenData = JSON.stringify({
            userId: user.id,
            sid,
            exp: Date.now() + TOKEN_CONFIG.REFRESH_EXPIRY_SECONDS * 1000
          });

          await redisClient.setex(
            REDIS_KEYS.REFRESH_TOKEN(hashedNewJti),
            TOKEN_CONFIG.REFRESH_EXPIRY_SECONDS,
            tokenData
          );

          await redisClient.sadd(REDIS_KEYS.SESSION_INDEX(sid), hashedNewJti);

          appLogger.info(`Token rotated for user ${user.id} - old jti blacklisted, new jti issued`);
        } catch (error) {
          appLogger.error('Error storing rotated token in Redis:', error);
        }
      }

      return { accessToken, refreshToken, jti: newJti, sid };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  async blacklistToken(jti, sid) {
    if (!isRedisAvailable()) {
      appLogger.warn('Redis unavailable - token blacklisting disabled');
      return;
    }

    try {
      const hashedJti = hashJti(jti);
      
      await redisClient.setex(
        REDIS_KEYS.BLACKLIST(hashedJti),
        TOKEN_CONFIG.REFRESH_EXPIRY_SECONDS,
        JSON.stringify({ sid, blacklistedAt: Date.now() })
      );

      await redisClient.del(REDIS_KEYS.REFRESH_TOKEN(hashedJti));

      appLogger.info(`Token blacklisted: jti ${jti.substring(0, 8)}...`);
    } catch (error) {
      appLogger.error('Error blacklisting token in Redis:', error);
    }
  }

  async isRefreshRevoked(jti) {
    if (!isRedisAvailable()) {
      return false;
    }

    try {
      const hashedJti = hashJti(jti);
      const isBlacklisted = await redisClient.exists(REDIS_KEYS.BLACKLIST(hashedJti));
      return isBlacklisted === 1;
    } catch (error) {
      appLogger.error('Error checking token blacklist in Redis:', error);
      return false;
    }
  }

  async revokeTokenFamily(sid) {
    if (!isRedisAvailable()) {
      appLogger.warn('Redis unavailable - cannot revoke token family');
      return;
    }

    try {
      const sessionKey = REDIS_KEYS.SESSION_INDEX(sid);
      const jtiList = await redisClient.smembers(sessionKey);

      if (jtiList && jtiList.length > 0) {
        for (const hashedJti of jtiList) {
          await redisClient.setex(
            REDIS_KEYS.BLACKLIST(hashedJti),
            TOKEN_CONFIG.REFRESH_EXPIRY_SECONDS,
            JSON.stringify({ sid, revokedAt: Date.now(), reason: 'family_revocation' })
          );
          
          await redisClient.del(REDIS_KEYS.REFRESH_TOKEN(hashedJti));
        }

        await redisClient.del(sessionKey);

        appLogger.warn(`⚠️  Token family revoked for sid: ${sid} (${jtiList.length} tokens blacklisted)`);
      }
    } catch (error) {
      appLogger.error('Error revoking token family in Redis:', error);
    }
  }

  async verifyAccessToken(token) {
    const secret = await getJWTSecret();
    
    try {
      const decoded = jwt.verify(token, secret);
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Access token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid access token');
      }
      throw error;
    }
  }
}

module.exports = new TokenService();
