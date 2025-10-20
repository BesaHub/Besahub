const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const { SecurityAlert, User } = require('../models');
const { Op } = require('sequelize');

class SecurityMonitoringService {
  async parseSecurityLogs(timeWindow = '24h') {
    const windowMs = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const startTime = Date.now() - (windowMs[timeWindow] || windowMs['24h']);
    const logsDir = path.join(__dirname, '../logs');
    const securityLogPattern = /security-\d{4}-\d{2}-\d{2}\.log$/;

    const failedLogins = [];
    const rateLimitViolations = [];
    
    try {
      const files = await fs.readdir(logsDir);
      const securityLogs = files.filter(f => securityLogPattern.test(f));

      for (const file of securityLogs) {
        const filePath = path.join(logsDir, file);
        const lines = await this.readLogFile(filePath);

        for (const line of lines) {
          try {
            const log = JSON.parse(line);
            const logTime = new Date(log.timestamp).getTime();

            if (logTime < startTime) continue;

            if (log.message && log.message.includes('failed') && log.message.includes('login')) {
              failedLogins.push({
                timestamp: log.timestamp,
                userId: log.userId,
                email: log.email,
                ip: log.ip,
                userAgent: log.userAgent,
                reason: log.reason || 'Unknown'
              });
            }

            if (log.message && log.message.includes('Rate limit exceeded')) {
              rateLimitViolations.push({
                timestamp: log.timestamp,
                ip: log.ip,
                path: log.path,
                userAgent: log.userAgent,
                user: log.user
              });
            }
          } catch (e) {
            continue;
          }
        }
      }

      return { failedLogins, rateLimitViolations };
    } catch (error) {
      console.error('Error parsing security logs:', error);
      return { failedLogins: [], rateLimitViolations: [] };
    }
  }

  async readLogFile(filePath) {
    const lines = [];
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      return fileContent.split('\n').filter(line => line.trim());
    } catch (error) {
      console.error(`Error reading log file ${filePath}:`, error);
      return [];
    }
  }

  async getFailedLoginAttempts(options = {}) {
    const {
      timeWindow = '24h',
      page = 1,
      limit = 50,
      ip = null,
      email = null
    } = options;

    const { failedLogins } = await this.parseSecurityLogs(timeWindow);
    
    let filtered = failedLogins;
    
    if (ip) {
      filtered = filtered.filter(log => log.ip === ip);
    }
    
    if (email) {
      filtered = filtered.filter(log => log.email === email);
    }

    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const total = filtered.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = filtered.slice(start, end);

    return {
      data: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getRateLimitViolations(options = {}) {
    const {
      timeWindow = '24h',
      page = 1,
      limit = 50,
      ip = null
    } = options;

    const { rateLimitViolations } = await this.parseSecurityLogs(timeWindow);
    
    let filtered = rateLimitViolations;
    
    if (ip) {
      filtered = filtered.filter(log => log.ip === ip);
    }

    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const total = filtered.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = filtered.slice(start, end);

    return {
      data: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async detectSuspiciousActivity(timeWindow = '24h') {
    const windowMs = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const startDate = new Date(Date.now() - (windowMs[timeWindow] || windowMs['24h']));

    const alerts = await SecurityAlert.findAll({
      where: {
        createdAt: { [Op.gte]: startDate },
        severity: { [Op.in]: ['WARNING', 'CRITICAL'] }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const { failedLogins, rateLimitViolations } = await this.parseSecurityLogs(timeWindow);

    const ipPatterns = this.analyzeIPPatterns(failedLogins);
    const userPatterns = this.analyzeUserPatterns(failedLogins);

    return {
      alerts,
      patterns: {
        suspiciousIPs: ipPatterns.filter(p => p.count >= 5),
        suspiciousUsers: userPatterns.filter(p => p.count >= 3)
      },
      recentFailedLogins: failedLogins.slice(0, 10),
      recentRateLimitViolations: rateLimitViolations.slice(0, 10)
    };
  }

  analyzeIPPatterns(failedLogins) {
    const ipCounts = {};
    
    failedLogins.forEach(login => {
      if (login.ip) {
        ipCounts[login.ip] = ipCounts[login.ip] || { count: 0, users: new Set() };
        ipCounts[login.ip].count++;
        if (login.email) {
          ipCounts[login.ip].users.add(login.email);
        }
      }
    });

    return Object.entries(ipCounts).map(([ip, data]) => ({
      ip,
      count: data.count,
      uniqueUsers: data.users.size,
      users: Array.from(data.users)
    })).sort((a, b) => b.count - a.count);
  }

  analyzeUserPatterns(failedLogins) {
    const userCounts = {};
    
    failedLogins.forEach(login => {
      if (login.email) {
        userCounts[login.email] = userCounts[login.email] || { count: 0, ips: new Set() };
        userCounts[login.email].count++;
        if (login.ip) {
          userCounts[login.email].ips.add(login.ip);
        }
      }
    });

    return Object.entries(userCounts).map(([email, data]) => ({
      email,
      count: data.count,
      uniqueIPs: data.ips.size,
      ips: Array.from(data.ips)
    })).sort((a, b) => b.count - a.count);
  }

  async getAccountLockouts() {
    const now = new Date();
    
    const lockedUsers = await User.findAll({
      where: {
        lockUntil: {
          [Op.gt]: now
        }
      },
      attributes: ['id', 'email', 'firstName', 'lastName', 'lockUntil', 'loginAttempts']
    });

    const totalLockouts = await User.count({
      where: {
        lockUntil: {
          [Op.not]: null
        }
      }
    });

    return {
      active: lockedUsers,
      activeCount: lockedUsers.length,
      totalCount: totalLockouts
    };
  }

  async getMFAEnrollmentRate() {
    const [totalUsers, mfaEnabledUsers] = await Promise.all([
      User.count({
        where: { isActive: true }
      }),
      User.count({
        where: { 
          isActive: true,
          mfaEnabled: true
        }
      })
    ]);

    return {
      total: totalUsers,
      enrolled: mfaEnabledUsers,
      rate: totalUsers > 0 ? (mfaEnabledUsers / totalUsers * 100).toFixed(2) : 0
    };
  }

  async getDashboardStats(timeWindow = '24h') {
    const windowMs = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const startDate = new Date(Date.now() - (windowMs[timeWindow] || windowMs['24h']));

    const { failedLogins, rateLimitViolations } = await this.parseSecurityLogs(timeWindow);
    const lockouts = await this.getAccountLockouts();
    const mfaStats = await this.getMFAEnrollmentRate();

    const criticalAlerts = await SecurityAlert.count({
      where: {
        severity: 'CRITICAL',
        resolved: false,
        createdAt: { [Op.gte]: startDate }
      }
    });

    const recentAlerts = await SecurityAlert.findAll({
      where: {
        createdAt: { [Op.gte]: startDate }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    return {
      failedLogins: {
        count: failedLogins.length,
        recent: failedLogins.slice(0, 5)
      },
      rateLimitViolations: {
        count: rateLimitViolations.length,
        recent: rateLimitViolations.slice(0, 5)
      },
      accountLockouts: lockouts,
      mfaEnrollment: mfaStats,
      criticalAlerts,
      recentAlerts
    };
  }
}

module.exports = new SecurityMonitoringService();
