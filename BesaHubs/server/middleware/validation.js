const { Joi } = require('celebrate');

const commonValidation = {
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .max(255)
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required'
    }),

  optionalEmail: Joi.string()
    .email()
    .lowercase()
    .trim()
    .max(255)
    .allow('', null)
    .messages({
      'string.email': 'Please provide a valid email address'
    }),

  password: Joi.string()
    .min(12)
    .max(128)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.min': 'Password must be at least 12 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    }),

  simplePassword: Joi.string()
    .min(12)
    .max(128)
    .required()
    .messages({
      'string.min': 'Password must be at least 12 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    }),

  uuid: Joi.string()
    .uuid({ version: ['uuidv4'] })
    .required()
    .messages({
      'string.guid': 'Invalid ID format',
      'any.required': 'ID is required'
    }),

  optionalUuid: Joi.string()
    .uuid({ version: ['uuidv4'] })
    .allow('', null)
    .messages({
      'string.guid': 'Invalid ID format'
    }),

  pagination: {
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
      }),

    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      }),

    offset: Joi.number()
      .integer()
      .min(0)
      .default(0)
      .messages({
        'number.base': 'Offset must be a number',
        'number.integer': 'Offset must be an integer',
        'number.min': 'Offset must be at least 0'
      })
  },

  dateRange: {
    startDate: Joi.date()
      .iso()
      .messages({
        'date.base': 'Start date must be a valid date',
        'date.format': 'Start date must be in ISO 8601 format'
      }),

    endDate: Joi.date()
      .iso()
      .min(Joi.ref('startDate'))
      .messages({
        'date.base': 'End date must be a valid date',
        'date.format': 'End date must be in ISO 8601 format',
        'date.min': 'End date must be after start date'
      })
  },

  phoneNumber: Joi.string()
    .pattern(/^[\d\s\-\+\(\)\.]+$/)
    .min(7)
    .max(20)
    .messages({
      'string.pattern.base': 'Phone number contains invalid characters. Allowed formats: "555-1234", "(555) 123-4567", "+1-555-123-4567"',
      'string.min': 'Phone number must be at least 7 characters (including formatting)',
      'string.max': 'Phone number must not exceed 20 characters'
    }),

  optionalPhoneNumber: Joi.string()
    .pattern(/^[\d\s\-\+\(\)\.]+$/)
    .min(7)
    .max(20)
    .allow('', null)
    .messages({
      'string.pattern.base': 'Phone number contains invalid characters. Allowed formats: "555-1234", "(555) 123-4567", "+1-555-123-4567"',
      'string.min': 'Phone number must be at least 7 characters (including formatting)',
      'string.max': 'Phone number must not exceed 20 characters'
    }),

  url: Joi.string()
    .uri()
    .max(2048)
    .messages({
      'string.uri': 'Please provide a valid URL',
      'string.max': 'URL must not exceed 2048 characters'
    }),

  optionalUrl: Joi.string()
    .uri()
    .max(2048)
    .allow('', null)
    .messages({
      'string.uri': 'Please provide a valid URL',
      'string.max': 'URL must not exceed 2048 characters'
    }),

  sortBy: Joi.string()
    .max(50)
    .default('createdAt')
    .messages({
      'string.base': 'Sort field must be a string',
      'string.max': 'Sort field name too long'
    }),

  sortOrder: Joi.string()
    .valid('ASC', 'DESC', 'asc', 'desc')
    .default('DESC')
    .messages({
      'any.only': 'Sort order must be either ASC or DESC'
    }),

  searchQuery: Joi.string()
    .max(255)
    .allow('', null)
    .messages({
      'string.max': 'Search query must not exceed 255 characters'
    })
};

module.exports = {
  commonValidation
};
