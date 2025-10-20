const geoip = require('geoip-lite');
const { appLogger, security: securityLogger } = require('../config/logger');
const { auditLogger } = require('./auditLogger');

const blockedCountries = process.env.BLOCKED_COUNTRIES 
  ? process.env.BLOCKED_COUNTRIES.split(',').map(c => c.trim().toUpperCase()) 
  : [];

const whitelistedIPs = process.env.WHITELISTED_IPS 
  ? process.env.WHITELISTED_IPS.split(',').map(ip => ip.trim()) 
  : [];

const geoIpFilter = (req, res, next) => {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  if (isDevelopment) {
    return next();
  }

  if (blockedCountries.length === 0) {
    return next();
  }

  const clientIp = req.ip || req.connection.remoteAddress;

  if (whitelistedIPs.includes(clientIp)) {
    appLogger.info('✅ Whitelisted IP access', { ip: clientIp });
    return next();
  }

  const geo = geoip.lookup(clientIp);

  if (!geo) {
    appLogger.warn('⚠️ Unable to determine location for IP', { 
      ip: clientIp,
      path: req.path 
    });
    return next();
  }

  const country = geo.country;

  if (blockedCountries.includes(country)) {
    appLogger.warn('🚫 Access blocked from restricted country', {
      ip: clientIp,
      country,
      path: req.path,
      method: req.method,
      userAgent: req.headers['user-agent']
    });

    securityLogger('Geo-IP access blocked', {
      ip: clientIp,
      country,
      path: req.path,
      method: req.method,
      userAgent: req.headers['user-agent']
    });

    auditLogger.logSecurityEvent('GEO_IP_BLOCKED', {
      ipAddress: clientIp,
      country,
      path: req.path,
      method: req.method,
      userAgent: req.headers['user-agent']
    });

    return res.status(403).json({ 
      error: 'Access denied from your location' 
    });
  }

  next();
};

module.exports = {
  geoIpFilter
};
