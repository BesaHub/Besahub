const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { auditLogger, securityLogger } = require('../config/logger');

let lastHash = crypto.createHash('sha256').update('GENESIS').digest('hex');

const initializeHashChain = () => {
  const logsDir = path.join(__dirname, '../logs');
  
  try {
    if (!fs.existsSync(logsDir)) {
      console.log('🔗 Hash Chain: No logs directory found. Starting with GENESIS hash.');
      auditLogger.info('Hash chain initialized with GENESIS', {
        hash: lastHash,
        source: 'GENESIS'
      });
      return;
    }
    
    const allLogFiles = fs.readdirSync(logsDir)
      .filter(file => 
        file.startsWith('audit-') && (file.endsWith('.log') || file.endsWith('.log.gz'))
      )
      .map(file => {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          path: filePath,
          mtime: stats.mtime
        };
      })
      .sort((a, b) => b.mtime - a.mtime);
    
    let logContent = '';
    let sourceFile = '';
    
    for (const logFile of allLogFiles) {
      sourceFile = logFile.filename;
      
      if (logFile.filename.endsWith('.gz')) {
        const compressedContent = fs.readFileSync(logFile.path);
        logContent = zlib.gunzipSync(compressedContent).toString('utf-8');
        console.log(`📦 Hash Chain: Reading from compressed log (${logFile.filename})`);
      } else {
        logContent = fs.readFileSync(logFile.path, 'utf-8');
      }
      
      if (logContent && logContent.trim() !== '') {
        break;
      }
    }
    
    if (!logContent || logContent.trim() === '') {
      console.log('🔗 Hash Chain: No existing audit logs found. Starting with GENESIS hash.');
      auditLogger.info('Hash chain initialized with GENESIS', {
        hash: lastHash,
        source: 'GENESIS',
        reason: 'NO_LOGS_FOUND'
      });
      return;
    }
    
    const lines = logContent.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      console.log('🔗 Hash Chain: Audit log is empty. Starting with GENESIS hash.');
      auditLogger.info('Hash chain initialized with GENESIS', {
        hash: lastHash,
        source: 'GENESIS',
        reason: 'EMPTY_LOG'
      });
      return;
    }
    
    const lastLine = lines[lines.length - 1];
    const lastEntry = JSON.parse(lastLine);
    
    if (lastEntry.hash) {
      lastHash = lastEntry.hash;
      console.log(`✅ Hash Chain: Restored from previous log (${sourceFile}). Hash: ${lastHash.substring(0, 16)}...`);
      auditLogger.info('Hash chain initialized from previous log', {
        hash: lastHash,
        source: 'PREVIOUS_LOG',
        logFile: sourceFile,
        previousEntry: {
          timestamp: lastEntry.timestamp
        }
      });
    } else {
      console.log('⚠️  Hash Chain: Last log entry has no hash. Starting with GENESIS hash.');
      auditLogger.warn('Hash chain initialized with GENESIS (no hash in last entry)', {
        hash: lastHash,
        source: 'GENESIS',
        reason: 'NO_HASH_IN_LAST_ENTRY'
      });
    }
  } catch (error) {
    console.error('❌ Hash Chain: Error reading audit log. Starting with GENESIS hash.', error.message);
    auditLogger.error('Hash chain initialization error, using GENESIS', {
      hash: lastHash,
      source: 'GENESIS',
      error: error.message
    });
  }
};

initializeHashChain();

const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = [
    'password', 'newPassword', 'oldPassword', 'currentPassword',
    'token', 'refreshToken', 'accessToken', 'apiKey', 'secret',
    'mfaSecret', 'mfaCode', 'verificationCode', 'otp',
    'ssn', 'creditCard', 'cvv', 'pin'
  ];
  
  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  
  for (const key in sanitized) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }
  
  return sanitized;
};

const generateHash = (data, previousHash) => {
  const content = JSON.stringify(data) + previousHash;
  return crypto.createHash('sha256').update(content).digest('hex');
};

const determineEventType = (method, path, user) => {
  if (path.includes('/auth/login')) return 'USER_LOGIN';
  if (path.includes('/auth/logout')) return 'USER_LOGOUT';
  if (path.includes('/auth/change-password')) return 'PASSWORD_CHANGE';
  if (path.includes('/auth/reset-password')) return 'PASSWORD_RESET';
  if (path.includes('/auth/mfa')) return 'MFA_OPERATION';
  if (path.includes('/admin/users') && method === 'PUT') return 'USER_UPDATE';
  if (path.includes('/admin/users') && method === 'DELETE') return 'USER_DELETE';
  if (path.includes('/admin/users') && method === 'POST') return 'USER_CREATE';
  if (path.includes('/properties') && method === 'POST') return 'PROPERTY_CREATE';
  if (path.includes('/properties') && method === 'PUT') return 'PROPERTY_UPDATE';
  if (path.includes('/properties') && method === 'DELETE') return 'PROPERTY_DELETE';
  if (path.includes('/deals') && method === 'POST') return 'DEAL_CREATE';
  if (path.includes('/deals') && method === 'PUT') return 'DEAL_UPDATE';
  if (path.includes('/deals') && method === 'DELETE') return 'DEAL_DELETE';
  if (path.includes('/admin')) return 'ADMIN_ACTION';
  
  return 'API_REQUEST';
};

const determineLogLevel = (eventType, statusCode) => {
  const criticalEvents = [
    'PASSWORD_CHANGE', 'PASSWORD_RESET', 'USER_DELETE', 
    'MFA_OPERATION', 'ADMIN_ACTION', 'USER_CREATE', 'USER_UPDATE'
  ];
  
  if (criticalEvents.includes(eventType)) return 'warn';
  if (statusCode >= 500) return 'error';
  if (statusCode >= 400) return 'warn';
  return 'info';
};

const shouldAuditRoute = (path) => {
  const excludedPaths = [
    '/health',
    '/uploads',
    '/api/auth/refresh',
    '/api/dashboard/stats',
    '/favicon.ico'
  ];
  
  return !excludedPaths.some(excluded => path.startsWith(excluded));
};

const auditMiddleware = (req, res, next) => {
  if (!shouldAuditRoute(req.path)) {
    return next();
  }

  const correlationId = uuidv4();
  req.correlationId = correlationId;
  
  const startTime = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    res.send = originalSend;
    
    if (req.user) {
      const duration = Date.now() - startTime;
      const eventType = determineEventType(req.method, req.path, req.user);
      const logLevel = determineLogLevel(eventType, res.statusCode);
      
      const auditEntry = {
        correlationId,
        timestamp: new Date().toISOString(),
        eventType,
        user: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role
        },
        request: {
          method: req.method,
          url: req.originalUrl,
          path: req.path,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          body: sanitizeData(req.body),
          query: req.query
        },
        response: {
          statusCode: res.statusCode,
          duration: `${duration}ms`
        }
      };
      
      const entryHash = generateHash(auditEntry, lastHash);
      auditEntry.hash = entryHash;
      auditEntry.previousHash = lastHash;
      lastHash = entryHash;
      
      auditLogger.log(logLevel, 'Audit Log Entry', auditEntry);
      
      if (['USER_LOGIN', 'PASSWORD_CHANGE', 'MFA_OPERATION', 'ADMIN_ACTION'].includes(eventType)) {
        securityLogger.log(logLevel, `Security Event: ${eventType}`, {
          correlationId,
          eventType,
          userId: req.user.id,
          email: req.user.email,
          role: req.user.role,
          ip: req.ip,
          timestamp: new Date().toISOString(),
          success: res.statusCode < 400
        });
      }
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

const logCriticalEvent = (eventType, data, user = null) => {
  const correlationId = uuidv4();
  const logLevel = ['PASSWORD_CHANGE', 'PASSWORD_RESET', 'USER_DELETE', 'MFA_ENABLE', 'MFA_DISABLE'].includes(eventType) ? 'warn' : 'info';
  
  const auditEntry = {
    correlationId,
    timestamp: new Date().toISOString(),
    eventType,
    user: user ? {
      id: user.id,
      email: user.email,
      role: user.role
    } : null,
    data: sanitizeData(data)
  };
  
  const entryHash = generateHash(auditEntry, lastHash);
  auditEntry.hash = entryHash;
  auditEntry.previousHash = lastHash;
  lastHash = entryHash;
  
  auditLogger.log(logLevel, `Critical Event: ${eventType}`, auditEntry);
  
  if (user && ['USER_LOGIN', 'USER_LOGOUT', 'PASSWORD_CHANGE', 'PASSWORD_RESET', 'MFA_ENABLE', 'MFA_DISABLE'].includes(eventType)) {
    securityLogger.log(logLevel, `Security Event: ${eventType}`, {
      correlationId,
      eventType,
      userId: user.id,
      email: user.email,
      role: user.role,
      timestamp: new Date().toISOString(),
      data: sanitizeData(data)
    });
  }
};

const logAuthEvent = (eventType, userId, email, role, ipAddress, success = true, metadata = {}) => {
  const correlationId = uuidv4();
  const logLevel = success ? 'info' : 'warn';
  
  const auditEntry = {
    correlationId,
    timestamp: new Date().toISOString(),
    eventType,
    user: {
      id: userId,
      email,
      role
    },
    ipAddress,
    success,
    metadata: sanitizeData(metadata)
  };
  
  const entryHash = generateHash(auditEntry, lastHash);
  auditEntry.hash = entryHash;
  auditEntry.previousHash = lastHash;
  lastHash = entryHash;
  
  auditLogger.log(logLevel, `Auth Event: ${eventType}`, auditEntry);
  securityLogger.log(logLevel, `Auth Event: ${eventType}`, {
    correlationId,
    eventType,
    userId,
    email,
    role,
    ipAddress,
    success,
    timestamp: new Date().toISOString()
  });
};

const logDataModification = (eventType, entityType, entityId, changes, user, metadata = {}) => {
  const correlationId = uuidv4();
  
  const auditEntry = {
    correlationId,
    timestamp: new Date().toISOString(),
    eventType,
    entityType,
    entityId,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    },
    changes: sanitizeData(changes),
    metadata: sanitizeData(metadata)
  };
  
  const entryHash = generateHash(auditEntry, lastHash);
  auditEntry.hash = entryHash;
  auditEntry.previousHash = lastHash;
  lastHash = entryHash;
  
  auditLogger.info(`Data Modification: ${eventType}`, auditEntry);
};

const logAdminAction = (action, targetUser, changes, adminUser, metadata = {}) => {
  const correlationId = uuidv4();
  
  const auditEntry = {
    correlationId,
    timestamp: new Date().toISOString(),
    eventType: 'ADMIN_ACTION',
    action,
    admin: {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role
    },
    targetUser: targetUser ? {
      id: targetUser.id || targetUser,
      email: targetUser.email,
      role: targetUser.role
    } : null,
    changes: sanitizeData(changes),
    metadata: sanitizeData(metadata)
  };
  
  const entryHash = generateHash(auditEntry, lastHash);
  auditEntry.hash = entryHash;
  auditEntry.previousHash = lastHash;
  lastHash = entryHash;
  
  auditLogger.warn(`Admin Action: ${action}`, auditEntry);
  securityLogger.warn(`Admin Action: ${action}`, {
    correlationId,
    action,
    adminId: adminUser.id,
    adminEmail: adminUser.email,
    targetUserId: targetUser?.id,
    timestamp: new Date().toISOString()
  });
};


module.exports = {
  auditMiddleware,
  logCriticalEvent,
  logAuthEvent,
  logDataModification,
  logAdminAction,
  sanitizeData
};
