const axios = require('axios');
const NodeCache = require('node-cache');
const { appLogger, security: securityLogger } = require('../config/logger');
const { auditLogger } = require('./auditLogger');

const tokenCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const VERIFICATION_TIMEOUT = 5000;

const verifyCaptcha = async (req, res, next) => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (isDevelopment && !secretKey) {
    appLogger.info('🔧 Captcha verification skipped in development (TURNSTILE_SECRET_KEY not set)');
    return next();
  }

  if (!secretKey) {
    appLogger.error('❌ TURNSTILE_SECRET_KEY not configured in production');
    return res.status(500).json({ 
      error: 'Server configuration error' 
    });
  }

  const { captchaToken } = req.body;

  if (!captchaToken) {
    appLogger.warn('⚠️ Captcha token missing from request', {
      ip: req.ip,
      path: req.path,
      userAgent: req.headers['user-agent']
    });
    
    securityLogger('Captcha token missing', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.headers['user-agent']
    });

    return res.status(400).json({ 
      error: 'Captcha verification required' 
    });
  }

  if (tokenCache.get(captchaToken)) {
    appLogger.info('✅ Captcha token verified from cache');
    return next();
  }

  try {
    const verifyResponse = await axios.post(
      TURNSTILE_VERIFY_URL,
      {
        secret: secretKey,
        response: captchaToken,
        remoteip: req.ip
      },
      {
        timeout: VERIFICATION_TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const { success, 'error-codes': errorCodes } = verifyResponse.data;

    if (!success) {
      appLogger.warn('❌ Captcha verification failed', {
        ip: req.ip,
        path: req.path,
        errorCodes,
        userAgent: req.headers['user-agent']
      });

      securityLogger('Captcha verification failed', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        errorCodes,
        userAgent: req.headers['user-agent']
      });

      auditLogger.logSecurityEvent('CAPTCHA_VERIFICATION_FAILED', {
        ipAddress: req.ip,
        path: req.path,
        errorCodes,
        userAgent: req.headers['user-agent']
      });

      return res.status(400).json({ 
        error: 'Captcha verification failed. Please try again.' 
      });
    }

    tokenCache.set(captchaToken, true);

    appLogger.info('✅ Captcha verification successful', {
      ip: req.ip,
      path: req.path
    });

    next();
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      appLogger.error('⏱️ Captcha verification timeout', {
        ip: req.ip,
        error: error.message
      });
      return res.status(503).json({ 
        error: 'Captcha verification service temporarily unavailable. Please try again.' 
      });
    }

    appLogger.error('❌ Captcha verification error', {
      ip: req.ip,
      error: error.message,
      stack: error.stack
    });

    securityLogger('Captcha verification error', {
      ip: req.ip,
      path: req.path,
      error: error.message
    });

    return res.status(500).json({ 
      error: 'Captcha verification error. Please try again.' 
    });
  }
};

module.exports = {
  verifyCaptcha
};
