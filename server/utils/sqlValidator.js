const { Sequelize } = require('sequelize');
const winston = require('winston');

// Configure logger for SQL auditing
const sqlLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'server/logs/sql-audit.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Dangerous SQL patterns that indicate potential SQL injection
const DANGEROUS_PATTERNS = [
  /;\s*(DROP|DELETE|TRUNCATE|ALTER|CREATE|GRANT|REVOKE)\s+/i,
  /UNION\s+SELECT/i,
  /--\s*$/m,
  /\/\*.*\*\//,
  /xp_cmdshell/i,
  /exec\s*\(/i,
  /execute\s*\(/i,
  /INFORMATION_SCHEMA/i,
  /pg_sleep/i,
  /waitfor\s+delay/i,
  /benchmark\s*\(/i
];

// Patterns that suggest string interpolation (potential vulnerability)
const INTERPOLATION_PATTERNS = [
  /\$\{[^}]*\}/,  // Template literal interpolation
  /['"]?\s*\+\s*['"]?/,  // String concatenation
];

/**
 * Validates that a query string doesn't contain dangerous patterns
 * @param {string} query - The SQL query to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
const validateQueryString = (query) => {
  const errors = [];
  
  if (!query || typeof query !== 'string') {
    errors.push('Query must be a non-empty string');
    return { isValid: false, errors };
  }

  // Check for dangerous SQL patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(query)) {
      errors.push(`Query contains potentially dangerous pattern: ${pattern.source}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates that bind parameters are provided for queries with placeholders
 * @param {string} query - The SQL query
 * @param {Object} options - Query options (should contain replacements or bind)
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
const validateBindParameters = (query, options = {}) => {
  const errors = [];
  
  // Check for placeholder patterns
  const hasNamedPlaceholders = /:[\w]+/.test(query);
  const hasPositionalPlaceholders = /\$\d+/.test(query);
  const hasQuestionMarks = /\?/.test(query);
  
  const hasAnyPlaceholder = hasNamedPlaceholders || hasPositionalPlaceholders || hasQuestionMarks;
  
  if (hasAnyPlaceholder) {
    // Verify that bind parameters are provided
    if (!options.replacements && !options.bind) {
      errors.push('Query contains placeholders but no bind parameters provided');
    }
  }

  // Check for string interpolation patterns (vulnerability indicator)
  for (const pattern of INTERPOLATION_PATTERNS) {
    if (pattern.test(query)) {
      errors.push(`Query appears to use string interpolation - use bind parameters instead`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Safe wrapper for sequelize.query() that validates and logs all queries
 * @param {Object} sequelize - Sequelize instance
 * @param {string} query - The SQL query to execute
 * @param {Object} options - Query options (type, replacements, bind, etc.)
 * @returns {Promise} - Query result
 */
const safeQuery = async (sequelize, query, options = {}) => {
  const startTime = Date.now();
  
  try {
    // Validate query string
    const stringValidation = validateQueryString(query);
    if (!stringValidation.isValid) {
      const error = new Error('Query validation failed: ' + stringValidation.errors.join(', '));
      error.validationErrors = stringValidation.errors;
      
      // Log the security violation
      sqlLogger.error('SQL query validation failed', {
        query,
        errors: stringValidation.errors,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }

    // Validate bind parameters
    const bindValidation = validateBindParameters(query, options);
    if (!bindValidation.isValid) {
      const error = new Error('Bind parameter validation failed: ' + bindValidation.errors.join(', '));
      error.validationErrors = bindValidation.errors;
      
      // Log the security violation
      sqlLogger.error('SQL bind parameter validation failed', {
        query,
        errors: bindValidation.errors,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }

    // Log the query for audit trail
    sqlLogger.info('SQL query executed', {
      query,
      options: {
        type: options.type,
        hasReplacements: !!options.replacements,
        hasBind: !!options.bind
      },
      timestamp: new Date().toISOString()
    });

    // Execute the query
    const result = await sequelize.query(query, options);
    
    // Log successful execution
    const executionTime = Date.now() - startTime;
    sqlLogger.info('SQL query completed', {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      executionTime,
      timestamp: new Date().toISOString()
    });

    return result;
  } catch (error) {
    // Log the error
    const executionTime = Date.now() - startTime;
    sqlLogger.error('SQL query error', {
      query,
      error: error.message,
      executionTime,
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
};

/**
 * Helper to create parameterized WHERE conditions using Sequelize operators
 * @param {Object} filters - Key-value pairs for filtering
 * @param {Object} Op - Sequelize operators
 * @returns {Object} - Safe WHERE clause object
 */
const buildSafeWhereClause = (filters, Op) => {
  const where = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }
    
    // Handle different filter types safely
    if (typeof value === 'object' && value.operator && value.value !== undefined) {
      // Custom operator specified
      switch (value.operator) {
        case 'like':
          where[key] = { [Op.like]: `%${value.value}%` };
          break;
        case 'ilike':
          where[key] = { [Op.iLike]: `%${value.value}%` };
          break;
        case 'gt':
          where[key] = { [Op.gt]: value.value };
          break;
        case 'gte':
          where[key] = { [Op.gte]: value.value };
          break;
        case 'lt':
          where[key] = { [Op.lt]: value.value };
          break;
        case 'lte':
          where[key] = { [Op.lte]: value.value };
          break;
        case 'ne':
          where[key] = { [Op.ne]: value.value };
          break;
        case 'in':
          where[key] = { [Op.in]: Array.isArray(value.value) ? value.value : [value.value] };
          break;
        case 'notIn':
          where[key] = { [Op.notIn]: Array.isArray(value.value) ? value.value : [value.value] };
          break;
        case 'between':
          if (Array.isArray(value.value) && value.value.length === 2) {
            where[key] = { [Op.between]: value.value };
          }
          break;
        default:
          where[key] = value.value;
      }
    } else {
      // Simple equality
      where[key] = value;
    }
  });
  
  return where;
};

/**
 * Sanitize user input to prevent SQL injection in LIKE clauses
 * @param {string} input - User input string
 * @returns {string} - Sanitized string safe for LIKE clauses
 */
const sanitizeLikeInput = (input) => {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Escape special characters in LIKE patterns
  return input
    .replace(/\\/g, '\\\\')  // Escape backslashes
    .replace(/%/g, '\\%')    // Escape percent signs
    .replace(/_/g, '\\_')    // Escape underscores
    .replace(/\[/g, '\\[')   // Escape brackets
    .trim();
};

/**
 * Create a safe query options object with bind parameters
 * @param {Array} replacements - Array of replacement values
 * @returns {Object} - Safe query options
 */
const createSafeQueryOptions = (replacements = []) => {
  return {
    type: Sequelize.QueryTypes.SELECT,
    replacements: Array.isArray(replacements) ? replacements : [replacements]
  };
};

module.exports = {
  safeQuery,
  validateQueryString,
  validateBindParameters,
  buildSafeWhereClause,
  sanitizeLikeInput,
  createSafeQueryOptions,
  DANGEROUS_PATTERNS,
  INTERPOLATION_PATTERNS
};
