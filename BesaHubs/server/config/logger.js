const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const { maskSensitivePatterns, maskObjectFields } = require('../utils/dataMasking');

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Enhanced sanitization format for Winston logs
 * 
 * SECURITY: Masks sensitive data including:
 * - Authentication: passwords, tokens, API keys, secrets
 * - PII: SSN, tax IDs, credit cards, emails (in sensitive contexts)
 * - Communication: phone numbers (in sensitive contexts)
 * 
 * Uses data masking utilities to preserve format while hiding sensitive info
 */
const sanitizeSecrets = winston.format((info) => {
  // Comprehensive list of sensitive field patterns
  const sensitiveKeys = [
    // Authentication & Secrets
    'password', 'newPassword', 'oldPassword', 'currentPassword', 'confirmPassword',
    'token', 'accessToken', 'refreshToken', 'idToken',
    'secret', 'apiSecret', 'clientSecret',
    'api_key', 'apiKey', 'apikey', 'key',
    'authorization', 'auth',
    'jwt', 'bearer',
    'mfaSecret', 'mfaCode', 'totpSecret', 'otpSecret',
    'privateKey', 'private_key', 'publicKey', 'public_key',
    
    // Financial & PII
    'ssn', 'taxId', 'tax_id', 'ein',
    'creditCard', 'credit_card', 'cardNumber', 'card_number',
    'cvv', 'cvc', 'securityCode',
    'pin', 'pinCode',
    'routingNumber', 'accountNumber',
    
    // Sensitive communication (context-dependent)
    'emailPassword', 'smtpPassword',
    'verificationCode', 'resetToken', 'confirmationToken'
  ];

  /**
   * Recursively sanitize objects and arrays
   * Applies field-based redaction and pattern-based masking
   */
  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();
      
      // Check if field name matches sensitive patterns
      if (sensitiveKeys.some(sensitiveKey => lowerKey.includes(sensitiveKey))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'string') {
        // For string values, also check for sensitive patterns in content
        // Only mask PII patterns in specific fields to avoid over-masking
        const shouldMaskPatterns = [
          'ssn', 'taxid', 'tax_id', 'creditcard', 'credit_card',
          'phone', 'mobile', 'email'
        ].some(pattern => lowerKey.includes(pattern));
        
        if (shouldMaskPatterns) {
          sanitized[key] = maskSensitivePatterns(sanitized[key]);
        }
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = sanitizeObject(sanitized[key]);
      }
    }

    return sanitized;
  };

  // Sanitize the entire log entry
  const sanitizedInfo = sanitizeObject(info);
  
  // Also sanitize message strings for inline sensitive data
  if (typeof sanitizedInfo.message === 'string') {
    // Redact sensitive key-value pairs in strings
    sensitiveKeys.forEach(key => {
      // Match patterns like: password: "value", password="value", password=value
      const regex = new RegExp(`(${key}["\']?\\s*[:=]\\s*["\']?)([^"',\\s}]+)`, 'gi');
      sanitizedInfo.message = sanitizedInfo.message.replace(regex, '$1[REDACTED]');
    });
    
    // Mask PII patterns in log messages (credit cards, SSN, etc.)
    // Note: Email and phone masking is conservative to avoid false positives
    sanitizedInfo.message = maskSensitivePatterns(sanitizedInfo.message);
  }

  return sanitizedInfo;
});

const logFormat = winston.format.combine(
  sanitizeSecrets(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

/**
 * Audit Logger - Immutable append-only audit trail
 * 
 * RETENTION POLICY:
 * - Daily rotation (YYYY-MM-DD pattern)
 * - Minimum 90-day retention (maxFiles: '90d')
 * - Automatic compression after rotation (zippedArchive: true)
 * - Maximum 10MB per file before rotation
 * 
 * IMMUTABILITY:
 * - File-based append-only storage
 * - Hash chain verification (see auditLogger middleware)
 * - No DELETE/UPDATE operations via API
 */
const auditLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'cre-crm-audit' },
  transports: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'audit-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: '10m',
      maxFiles: '90d', // 90-day minimum retention for compliance
      zippedArchive: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '10m',
      maxFiles: '90d',
      zippedArchive: true
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  auditLogger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

const appLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'cre-crm-app' },
  transports: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '14d',
      zippedArchive: true
    }),
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '10m',
      maxFiles: '30d',
      zippedArchive: true
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  appLogger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

const securityLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'cre-crm-security' },
  transports: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '90d',
      zippedArchive: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  securityLogger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'info'
  }));
}

const structuredLoggers = {
  security: (event, data = {}) => {
    const logData = {
      event,
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId || data.requestId,
      userId: data.userId,
      email: data.email,
      ip: data.ip,
      userAgent: data.userAgent,
      resource: data.resource,
      action: data.action,
      ...data
    };
    securityLogger.info(event, logData);
  },

  audit: (event, data = {}) => {
    const logData = {
      event,
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId || data.requestId,
      userId: data.userId,
      email: data.email,
      resource: data.resource,
      action: data.action,
      ...data
    };
    auditLogger.info(event, logData);
  },

  performance: (metric, data = {}) => {
    const logData = {
      metric,
      timestamp: new Date().toISOString(),
      correlationId: data.correlationId || data.requestId,
      duration: data.duration,
      resource: data.resource,
      action: data.action,
      ...data
    };
    appLogger.info(metric, logData);
  }
};

module.exports = {
  auditLogger,
  appLogger,
  securityLogger,
  ...structuredLoggers
};
