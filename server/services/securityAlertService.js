const { SecurityAlert, User } = require('../models');
const { security: securityLogger } = require('../config/logger');
const { redisClient, isRedisAvailable } = require('../config/redis');
const { Op } = require('sequelize');

const ALERT_TYPES = {
  BRUTE_FORCE: 'BRUTE_FORCE',
  MULTIPLE_IPS: 'MULTIPLE_IPS',
  RATE_LIMIT: 'RATE_LIMIT',
  TOKEN_REUSE: 'TOKEN_REUSE',
  MFA_BYPASS: 'MFA_BYPASS',
  ADMIN_UNUSUAL_IP: 'ADMIN_UNUSUAL_IP'
};

const ALERT_THRESHOLDS = {
  BRUTE_FORCE_COUNT: 5,
  BRUTE_FORCE_WINDOW: 5 * 60 * 1000, // 5 minutes
  MULTIPLE_IPS_COUNT: 3,
  MULTIPLE_IPS_WINDOW: 60 * 60 * 1000, // 1 hour
  RATE_LIMIT_COUNT: 10,
  RATE_LIMIT_WINDOW: 60 * 60 * 1000, // 1 hour
  ALERT_RATE_LIMIT: 5 * 60 * 1000 // Max 1 alert per user per 5 minutes
};

class SecurityAlertService {
  async checkBruteForce(ip, userId = null, email = null) {
    try {
      const fiveMinutesAgo = new Date(Date.now() - ALERT_THRESHOLDS.BRUTE_FORCE_WINDOW);
      
      const where = {
        createdAt: { [Op.gte]: fiveMinutesAgo }
      };

      if (ip) where.ip = ip;

      const recentAttempts = await SecurityAlert.count({
        where: {
          ...where,
          alertType: ALERT_TYPES.BRUTE_FORCE
        }
      });

      if (recentAttempts >= ALERT_THRESHOLDS.BRUTE_FORCE_COUNT) {
        if (await this.shouldRateLimit(userId || ip, ALERT_TYPES.BRUTE_FORCE)) {
          return null;
        }

        return await this.createAlert({
          alertType: ALERT_TYPES.BRUTE_FORCE,
          severity: 'CRITICAL',
          userId,
          email,
          ip,
          message: `Potential brute force attack detected from IP ${ip}`,
          details: {
            count: recentAttempts + 1,
            window: '5 minutes'
          },
          recommendedAction: 'Review IP and consider blocking. Check if legitimate user needs assistance.'
        });
      }
    } catch (error) {
      console.error('Error checking brute force:', error);
    }
    return null;
  }

  async checkMultipleIPs(userId, email, currentIp) {
    try {
      if (!userId) return null;

      const oneHourAgo = new Date(Date.now() - ALERT_THRESHOLDS.MULTIPLE_IPS_WINDOW);
      
      if (isRedisAvailable()) {
        const key = `security:ips:${userId}`;
        await redisClient.sadd(key, currentIp);
        await redisClient.expire(key, 3600);
        
        const ips = await redisClient.smembers(key);
        
        if (ips.length >= ALERT_THRESHOLDS.MULTIPLE_IPS_COUNT) {
          if (await this.shouldRateLimit(userId, ALERT_TYPES.MULTIPLE_IPS)) {
            return null;
          }

          return await this.createAlert({
            alertType: ALERT_TYPES.MULTIPLE_IPS,
            severity: 'WARNING',
            userId,
            email,
            ip: currentIp,
            message: `User ${email} logged in from ${ips.length} different IPs in the last hour`,
            details: {
              ips: ips,
              count: ips.length,
              window: '1 hour'
            },
            recommendedAction: 'Verify with user if this is legitimate activity. May indicate account compromise.'
          });
        }
      }
    } catch (error) {
      console.error('Error checking multiple IPs:', error);
    }
    return null;
  }

  async checkRateLimitViolations(identifier, ip, userAgent) {
    try {
      const oneHourAgo = new Date(Date.now() - ALERT_THRESHOLDS.RATE_LIMIT_WINDOW);
      
      const violations = await SecurityAlert.count({
        where: {
          alertType: ALERT_TYPES.RATE_LIMIT,
          [Op.or]: [
            { ip },
            { email: identifier }
          ],
          createdAt: { [Op.gte]: oneHourAgo }
        }
      });

      if (violations >= ALERT_THRESHOLDS.RATE_LIMIT_COUNT) {
        if (await this.shouldRateLimit(ip, ALERT_TYPES.RATE_LIMIT)) {
          return null;
        }

        return await this.createAlert({
          alertType: ALERT_TYPES.RATE_LIMIT,
          severity: 'WARNING',
          email: identifier,
          ip,
          userAgent,
          message: `Excessive rate limit violations from ${ip}`,
          details: {
            count: violations + 1,
            window: '1 hour'
          },
          recommendedAction: 'Consider blocking IP or implementing stricter rate limits.'
        });
      }
    } catch (error) {
      console.error('Error checking rate limit violations:', error);
    }
    return null;
  }

  async logTokenReuse(userId, email, ip, jti) {
    try {
      return await this.createAlert({
        alertType: ALERT_TYPES.TOKEN_REUSE,
        severity: 'CRITICAL',
        userId,
        email,
        ip,
        message: `Token reuse detected for user ${email}`,
        details: {
          jti,
          action: 'Session revoked for security'
        },
        recommendedAction: 'User session has been revoked. Monitor for further suspicious activity.'
      });
    } catch (error) {
      console.error('Error logging token reuse:', error);
    }
    return null;
  }

  async checkAdminUnusualIP(userId, email, ip, userRole) {
    try {
      if (userRole !== 'admin') return null;

      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const knownIPs = await SecurityAlert.findAll({
        where: {
          userId,
          ip: { [Op.ne]: null },
          createdAt: { [Op.gte]: oneWeekAgo }
        },
        attributes: ['ip'],
        group: ['ip']
      });

      const knownIPList = knownIPs.map(a => a.ip);

      if (knownIPList.length > 0 && !knownIPList.includes(ip)) {
        return await this.createAlert({
          alertType: ALERT_TYPES.ADMIN_UNUSUAL_IP,
          severity: 'WARNING',
          userId,
          email,
          ip,
          message: `Admin user ${email} accessed from unusual IP ${ip}`,
          details: {
            knownIPs: knownIPList.slice(0, 5),
            newIP: ip
          },
          recommendedAction: 'Verify admin user activity is legitimate.'
        });
      }
    } catch (error) {
      console.error('Error checking admin unusual IP:', error);
    }
    return null;
  }

  async createAlert(alertData) {
    try {
      const alert = await SecurityAlert.create(alertData);
      
      securityLogger('Security alert created', {
        alertId: alert.id,
        alertType: alert.alertType,
        severity: alert.severity,
        userId: alert.userId,
        email: alert.email,
        ip: alert.ip
      });

      return alert;
    } catch (error) {
      console.error('Error creating security alert:', error);
      throw error;
    }
  }

  async shouldRateLimit(identifier, alertType) {
    if (!isRedisAvailable()) return false;

    try {
      const key = `alert:ratelimit:${alertType}:${identifier}`;
      const exists = await redisClient.exists(key);
      
      if (exists) {
        return true;
      }

      await redisClient.setex(key, ALERT_THRESHOLDS.ALERT_RATE_LIMIT / 1000, '1');
      return false;
    } catch (error) {
      console.error('Error checking alert rate limit:', error);
      return false;
    }
  }

  async getRecentAlerts(limit = 10, severity = null) {
    const where = {};
    if (severity) {
      where.severity = severity;
    }

    return await SecurityAlert.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit
    });
  }

  async resolveAlert(alertId, adminUserId, notes) {
    const alert = await SecurityAlert.findByPk(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    await alert.resolve(adminUserId, notes);
    
    securityLogger('Security alert resolved', {
      alertId,
      resolvedBy: adminUserId,
      notes
    });

    return alert;
  }

  async getAlertStats(timeWindow = '24h') {
    const windowMs = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const startDate = new Date(Date.now() - (windowMs[timeWindow] || windowMs['24h']));

    const [totalAlerts, criticalAlerts, unresolvedAlerts, alertsByType] = await Promise.all([
      SecurityAlert.count({
        where: { createdAt: { [Op.gte]: startDate } }
      }),
      SecurityAlert.count({
        where: { 
          severity: 'CRITICAL',
          createdAt: { [Op.gte]: startDate }
        }
      }),
      SecurityAlert.count({
        where: { 
          resolved: false,
          createdAt: { [Op.gte]: startDate }
        }
      }),
      SecurityAlert.findAll({
        where: { createdAt: { [Op.gte]: startDate } },
        attributes: [
          'alertType',
          [require('sequelize').fn('COUNT', '*'), 'count']
        ],
        group: ['alertType']
      })
    ]);

    return {
      totalAlerts,
      criticalAlerts,
      unresolvedAlerts,
      alertsByType: alertsByType.reduce((acc, item) => {
        acc[item.alertType] = parseInt(item.dataValues.count);
        return acc;
      }, {})
    };
  }
}

module.exports = new SecurityAlertService();
