const winston = require('winston');
const { DANGEROUS_PATTERNS } = require('../utils/sqlValidator');

// Configure logger for security events
const securityLogger = winston.createLogger({
  level: 'warn',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'server/logs/security.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// SQL injection patterns to detect in user input
const SQL_INJECTION_PATTERNS = [
  /(\bOR\b|\bAND\b)\s+[\w\d]+\s*=\s*[\w\d]+/i,  // OR 1=1, AND 1=1
  /'\s*(OR|AND)\s+'?\d+/i,  // ' OR '1
  /--/,  // SQL comment
  /;.*DROP/i,  // Command chaining with DROP
  /;.*DELETE/i,  // Command chaining with DELETE
  /;.*INSERT/i,  // Command chaining with INSERT
  /;.*UPDATE/i,  // Command chaining with UPDATE
  /UNION.*SELECT/i,  // UNION-based injection
  /'\s*;\s*$/,  // Statement termination
  /xp_cmdshell/i,  // SQL Server command execution
  /exec\s*\(/i,  // EXEC command
  /INFORMATION_SCHEMA/i,  // Information disclosure
  /pg_sleep/i,  // Time-based injection (PostgreSQL)
  /waitfor\s+delay/i,  // Time-based injection (SQL Server)
  /benchmark\s*\(/i,  // Time-based injection (MySQL)
  /sleep\s*\(/i,  // MySQL sleep
  /\bCAST\s*\(/i,  // Type casting (often used in injections)
  /CHAR\s*\(/i,  // Character encoding bypass
  /ASCII\s*\(/i,  // ASCII encoding bypass
  /CONCAT\s*\(/i,  // String concatenation
  /0x[0-9a-f]+/i,  // Hexadecimal values (bypass quotes)
  /'\s*\+\s*'/,  // String concatenation in SQL
  /'\s*\|\|\s*'/,  // String concatenation (PostgreSQL/Oracle)
  /'\s*LIKE\s*'%/i,  // LIKE with wildcard
  /LOAD_FILE\s*\(/i,  // MySQL file reading
  /INTO\s+OUTFILE/i,  // MySQL file writing
  /LOAD\s+DATA/i,  // MySQL data loading
];

// Suspicious parameter names that might be used in SQL injection attacks
const SUSPICIOUS_PARAM_NAMES = [
  'query', 'sql', 'where', 'table', 'column', 'database', 'schema'
];

/**
 * Check if a value contains SQL injection patterns
 * @param {any} value - Value to check
 * @returns {Object} - { isSuspicious: boolean, patterns: string[] }
 */
const detectSQLInjection = (value) => {
  if (typeof value !== 'string') {
    return { isSuspicious: false, patterns: [] };
  }

  const matchedPatterns = [];

  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(value)) {
      matchedPatterns.push(pattern.source);
    }
  }

  return {
    isSuspicious: matchedPatterns.length > 0,
    patterns: matchedPatterns
  };
};

/**
 * Recursively scan an object for SQL injection patterns
 * @param {Object} obj - Object to scan
 * @param {string} path - Current path (for logging)
 * @returns {Array} - Array of suspicious findings
 */
const scanObject = (obj, path = '') => {
  const findings = [];

  if (obj === null || obj === undefined) {
    return findings;
  }

  if (typeof obj === 'string') {
    const detection = detectSQLInjection(obj);
    if (detection.isSuspicious) {
      findings.push({
        path,
        value: obj.substring(0, 100), // Limit logged value length
        patterns: detection.patterns
      });
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      findings.push(...scanObject(item, `${path}[${index}]`));
    });
  } else if (typeof obj === 'object') {
    Object.entries(obj).forEach(([key, value]) => {
      const currentPath = path ? `${path}.${key}` : key;
      
      // Flag suspicious parameter names
      if (SUSPICIOUS_PARAM_NAMES.includes(key.toLowerCase())) {
        findings.push({
          path: currentPath,
          value: typeof value === 'string' ? value.substring(0, 100) : value,
          patterns: ['SUSPICIOUS_PARAM_NAME'],
          severity: 'medium'
        });
      }
      
      findings.push(...scanObject(value, currentPath));
    });
  }

  return findings;
};

/**
 * Middleware to validate incoming requests for SQL injection attempts
 * This should be applied globally or to sensitive routes
 */
const queryValidationMiddleware = (req, res, next) => {
  const findings = [];

  // Scan query parameters
  if (req.query && Object.keys(req.query).length > 0) {
    findings.push(...scanObject(req.query, 'query'));
  }

  // Scan body parameters
  if (req.body && Object.keys(req.body).length > 0) {
    findings.push(...scanObject(req.body, 'body'));
  }

  // Scan URL parameters
  if (req.params && Object.keys(req.params).length > 0) {
    findings.push(...scanObject(req.params, 'params'));
  }

  // If suspicious patterns are found
  if (findings.length > 0) {
    const highSeverityFindings = findings.filter(f => 
      f.patterns.some(p => 
        p.includes('DROP') || 
        p.includes('DELETE') || 
        p.includes('UNION') ||
        p.includes('xp_cmdshell')
      )
    );

    // Log all findings
    securityLogger.warn('Potential SQL injection attempt detected', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      method: req.method,
      url: req.originalUrl,
      userId: req.user ? req.user.id : 'anonymous',
      findings,
      timestamp: new Date().toISOString()
    });

    // Block high-severity attacks
    if (highSeverityFindings.length > 0) {
      securityLogger.error('High-severity SQL injection attempt blocked', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        method: req.method,
        url: req.originalUrl,
        userId: req.user ? req.user.id : 'anonymous',
        findings: highSeverityFindings,
        timestamp: new Date().toISOString()
      });

      return res.status(400).json({
        error: 'Invalid request parameters detected',
        message: 'Your request contains potentially harmful content and has been blocked for security reasons.'
      });
    }

    // For lower-severity findings, log but allow (they might be false positives)
    // Add a warning header for monitoring
    res.set('X-Security-Warning', 'Request flagged for review');
  }

  next();
};

/**
 * Strict version of query validation that blocks on any suspicious pattern
 * Use this for highly sensitive endpoints (admin, database operations, etc.)
 */
const strictQueryValidation = (req, res, next) => {
  const findings = [];

  // Scan all inputs
  if (req.query) findings.push(...scanObject(req.query, 'query'));
  if (req.body) findings.push(...scanObject(req.body, 'body'));
  if (req.params) findings.push(...scanObject(req.params, 'params'));

  if (findings.length > 0) {
    securityLogger.error('Strict SQL injection validation failed', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      method: req.method,
      url: req.originalUrl,
      userId: req.user ? req.user.id : 'anonymous',
      findings,
      timestamp: new Date().toISOString()
    });

    return res.status(400).json({
      error: 'Invalid request parameters',
      message: 'Your request contains invalid characters and cannot be processed.'
    });
  }

  next();
};

/**
 * Middleware to sanitize string inputs by removing potentially dangerous characters
 * Use with caution - may break legitimate use cases
 */
const sanitizeInputs = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value !== 'string') {
      return value;
    }

    // Remove SQL comment markers
    let sanitized = value.replace(/--/g, '');
    
    // Remove semicolons (statement terminators)
    sanitized = sanitized.replace(/;/g, '');
    
    // Remove newlines that might be used in multiline injection
    sanitized = sanitized.replace(/[\r\n]/g, ' ');

    return sanitized;
  };

  const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return sanitizeValue(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized = {};
      Object.entries(obj).forEach(([key, value]) => {
        sanitized[key] = sanitizeObject(value);
      });
      return sanitized;
    }

    return obj;
  };

  // Sanitize all inputs
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.params) req.params = sanitizeObject(req.params);

  next();
};

module.exports = {
  queryValidationMiddleware,
  strictQueryValidation,
  sanitizeInputs,
  detectSQLInjection,
  scanObject,
  SQL_INJECTION_PATTERNS
};
