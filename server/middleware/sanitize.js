const xss = require('xss');
const sanitizeHtml = require('sanitize-html');
const validator = require('validator');

/*
 * SQL INJECTION PREVENTION:
 * 
 * This application uses Sequelize ORM with parameterized queries for all database operations.
 * Sequelize automatically prevents SQL injection by using parameterized queries (prepared statements).
 * 
 * CRITICAL SECURITY WARNING:
 * - NEVER use raw SQL queries with string concatenation or template literals
 * - NEVER use sequelize.query() with unescaped user input
 * - ALWAYS use Sequelize model methods (findAll, findOne, create, update, destroy)
 * - If raw queries are necessary, ALWAYS use parameterized queries with replacements
 * 
 * Example of SAFE raw query:
 *   sequelize.query('SELECT * FROM users WHERE id = :id', {
 *     replacements: { id: userId },
 *     type: QueryTypes.SELECT
 *   });
 * 
 * Example of UNSAFE query (NEVER DO THIS):
 *   sequelize.query(`SELECT * FROM users WHERE id = ${userId}`); // VULNERABLE!
 * 
 * All user input is already sanitized by this middleware before reaching database queries.
 */

const strictSanitize = (input) => {
  if (typeof input !== 'string') return input;
  
  const trimmed = input.trim();
  
  // Remove javascript: URLs and protocols
  let cleaned = trimmed.replace(/javascript:/gi, '');
  cleaned = cleaned.replace(/on\w+\s*=/gi, ''); // Remove event handlers like onclick=, onerror=, etc.
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''); // Remove script tags
  cleaned = cleaned.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, ''); // Remove iframes
  
  const xssFiltered = xss(cleaned, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'iframe'],
    onIgnoreTagAttr: function(tag, name, value) {
      // Remove all event handlers and javascript: protocols
      if (name.match(/^on\w+/i)) {
        return '';
      }
      if (value && typeof value === 'string' && value.match(/^javascript:/i)) {
        return '';
      }
      return undefined;
    }
  });
  
  return sanitizeHtml(xssFiltered, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {},
    allowedSchemesAppliedToAttributes: []
  }).replace(/javascript:/gi, '').replace(/on\w+\s*=/gi, ''); // Final cleanup pass
};

const moderateSanitize = (input) => {
  if (typeof input !== 'string') return input;
  
  const trimmed = input.trim();
  const xssFiltered = xss(trimmed);
  
  return sanitizeHtml(xssFiltered, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    allowedAttributes: {
      'a': ['href', 'title']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      a: ['http', 'https', 'mailto']
    },
    allowedSchemesAppliedToAttributes: ['href'],
    transformTags: {
      'a': (tagName, attribs) => {
        return {
          tagName: 'a',
          attribs: {
            ...attribs,
            rel: 'noopener noreferrer',
            target: '_blank'
          }
        };
      }
    },
    disallowedTagsMode: 'discard'
  });
};

const urlSanitize = (input) => {
  if (typeof input !== 'string') return input;
  
  const trimmed = input.trim();
  
  if (!validator.isURL(trimmed, {
    protocols: ['http', 'https'],
    require_protocol: false,
    require_valid_protocol: true,
    allow_underscores: true
  })) {
    return '';
  }
  
  return validator.normalizeEmail(trimmed) || trimmed;
};

const emailSanitize = (input) => {
  if (typeof input !== 'string') return input;
  
  const trimmed = input.trim();
  
  if (!validator.isEmail(trimmed)) {
    return trimmed;
  }
  
  return validator.normalizeEmail(trimmed, {
    gmail_remove_dots: false,
    gmail_remove_subaddress: false,
    outlookdotcom_remove_subaddress: false,
    yahoo_remove_subaddress: false,
    icloud_remove_subaddress: false
  }) || trimmed;
};

const sanitizeString = (input, level = 'strict') => {
  if (typeof input !== 'string') return input;
  
  switch (level) {
    case 'moderate':
      return moderateSanitize(input);
    case 'url':
      return urlSanitize(input);
    case 'email':
      return emailSanitize(input);
    case 'strict':
    default:
      return strictSanitize(input);
  }
};

const richTextFields = [
  'description',
  'notes',
  'bio',
  'summary',
  'content',
  'message',
  'comments',
  'details'
];

const emailFields = [
  'email',
  'primaryEmail',
  'secondaryEmail',
  'workEmail',
  'personalEmail'
];

const urlFields = [
  'url',
  'website',
  'websiteUrl',
  'linkedIn',
  'twitter',
  'facebook',
  'link'
];

const sanitizeObject = (obj, path = '') => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map((item, index) => sanitizeObject(item, `${path}[${index}]`));
  }
  
  if (obj instanceof Date) {
    return obj;
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = path ? `${path}.${key}` : key;
      
      if (value === null || value === undefined) {
        sanitized[key] = value;
      } else if (typeof value === 'string') {
        let sanitizationLevel = 'strict';
        
        if (richTextFields.includes(key)) {
          sanitizationLevel = 'moderate';
        } else if (emailFields.includes(key)) {
          sanitizationLevel = 'email';
        } else if (urlFields.includes(key)) {
          sanitizationLevel = 'url';
        }
        
        sanitized[key] = sanitizeString(value, sanitizationLevel);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (value instanceof Date) {
        sanitized[key] = value;
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value, fieldPath);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
  
  return obj;
};

const sanitizeInput = (req, res, next) => {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }
    
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  } catch (error) {
    console.error('Sanitization error:', error);
    res.status(500).json({ error: 'Input sanitization failed' });
  }
};

const createCustomSanitizer = (options = {}) => {
  const {
    strictFields = [],
    moderateFields = richTextFields,
    emailFields: customEmailFields = emailFields,
    urlFields: customUrlFields = urlFields
  } = options;
  
  return (req, res, next) => {
    try {
      const sanitizeWithCustomRules = (obj, path = '') => {
        if (obj === null || obj === undefined) {
          return obj;
        }
        
        if (Array.isArray(obj)) {
          return obj.map((item, index) => sanitizeWithCustomRules(item, `${path}[${index}]`));
        }
        
        if (obj instanceof Date) {
          return obj;
        }
        
        if (typeof obj === 'object') {
          const sanitized = {};
          
          for (const [key, value] of Object.entries(obj)) {
            const fieldPath = path ? `${path}.${key}` : key;
            
            if (value === null || value === undefined) {
              sanitized[key] = value;
            } else if (typeof value === 'string') {
              let sanitizationLevel = 'strict';
              
              if (moderateFields.includes(key)) {
                sanitizationLevel = 'moderate';
              } else if (customEmailFields.includes(key)) {
                sanitizationLevel = 'email';
              } else if (customUrlFields.includes(key)) {
                sanitizationLevel = 'url';
              }
              
              sanitized[key] = sanitizeString(value, sanitizationLevel);
            } else if (typeof value === 'number' || typeof value === 'boolean') {
              sanitized[key] = value;
            } else if (value instanceof Date) {
              sanitized[key] = value;
            } else if (typeof value === 'object') {
              sanitized[key] = sanitizeWithCustomRules(value, fieldPath);
            } else {
              sanitized[key] = value;
            }
          }
          
          return sanitized;
        }
        
        return obj;
      };
      
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeWithCustomRules(req.body);
      }
      
      if (req.query && typeof req.query === 'object') {
        req.query = sanitizeWithCustomRules(req.query);
      }
      
      if (req.params && typeof req.params === 'object') {
        req.params = sanitizeWithCustomRules(req.params);
      }
      
      next();
    } catch (error) {
      console.error('Custom sanitization error:', error);
      res.status(500).json({ error: 'Input sanitization failed' });
    }
  };
};

module.exports = {
  sanitizeInput,
  sanitizeString,
  sanitizeObject,
  strictSanitize,
  moderateSanitize,
  urlSanitize,
  emailSanitize,
  createCustomSanitizer
};
