const { Joi, Segments, celebrate } = require('celebrate');
const { commonValidation } = require('../../middleware/validation');

const contactRoles = [
  'tenant',
  'landlord',
  'buyer',
  'seller',
  'investor',
  'broker',
  'attorney',
  'lender',
  'contractor',
  'vendor',
  'other'
];

const leadStatuses = [
  'cold',
  'warm',
  'hot',
  'qualified',
  'converted',
  'lost',
  'inactive'
];

const contactTypes = ['individual', 'company'];

const createContactSchema = celebrate({
  [Segments.BODY]: Joi.object({
    type: Joi.string()
      .valid(...contactTypes)
      .default('individual')
      .messages({
        'any.only': `Contact type must be one of: ${contactTypes.join(', ')}`
      }),

    firstName: Joi.string()
      .trim()
      .min(1)
      .max(100)
      .when('type', {
        is: 'individual',
        then: Joi.required(),
        otherwise: Joi.optional().allow('', null)
      })
      .messages({
        'string.empty': 'First name is required for individual contacts',
        'string.max': 'First name must not exceed 100 characters',
        'any.required': 'First name is required for individual contacts'
      }),

    lastName: Joi.string()
      .trim()
      .min(1)
      .max(100)
      .when('type', {
        is: 'individual',
        then: Joi.required(),
        otherwise: Joi.optional().allow('', null)
      })
      .messages({
        'string.empty': 'Last name is required for individual contacts',
        'string.max': 'Last name must not exceed 100 characters',
        'any.required': 'Last name is required for individual contacts'
      }),

    companyName: Joi.string()
      .trim()
      .max(255)
      .when('type', {
        is: 'company',
        then: Joi.required(),
        otherwise: Joi.optional().allow('', null)
      })
      .messages({
        'string.empty': 'Company name is required for company contacts',
        'string.max': 'Company name must not exceed 255 characters',
        'any.required': 'Company name is required for company contacts'
      }),

    primaryEmail: commonValidation.email,

    secondaryEmail: commonValidation.optionalEmail,

    primaryPhone: commonValidation.phoneNumber,

    secondaryPhone: commonValidation.optionalPhoneNumber,

    contactRole: Joi.string()
      .valid(...contactRoles)
      .default('other')
      .messages({
        'any.only': `Contact role must be one of: ${contactRoles.join(', ')}`
      }),

    leadStatus: Joi.string()
      .valid(...leadStatuses)
      .default('cold')
      .messages({
        'any.only': `Lead status must be one of: ${leadStatuses.join(', ')}`
      }),

    address: Joi.string()
      .max(500)
      .allow('', null)
      .messages({
        'string.max': 'Address must not exceed 500 characters'
      }),

    city: Joi.string()
      .max(100)
      .allow('', null)
      .messages({
        'string.max': 'City must not exceed 100 characters'
      }),

    state: Joi.string()
      .length(2)
      .uppercase()
      .allow('', null)
      .messages({
        'string.length': 'State must be a 2-letter code'
      }),

    zipCode: Joi.string()
      .pattern(/^\d{5}(-\d{4})?$/)
      .allow('', null)
      .messages({
        'string.pattern.base': 'Zip code must be in format 12345 or 12345-6789'
      }),

    notes: Joi.string()
      .max(5000)
      .allow('', null)
      .messages({
        'string.max': 'Notes must not exceed 5000 characters'
      }),

    linkedInUrl: commonValidation.optionalUrl,
    twitterUrl: commonValidation.optionalUrl,
    facebookUrl: commonValidation.optionalUrl,

    assignedAgentId: commonValidation.optionalUuid,
    companyId: commonValidation.optionalUuid,

    preferences: Joi.object().unknown(true),
    tags: Joi.array().items(Joi.string().max(50))
  })
});

const updateContactSchema = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: commonValidation.uuid
  }),

  [Segments.BODY]: Joi.object({
    type: Joi.string()
      .valid(...contactTypes)
      .messages({
        'any.only': `Contact type must be one of: ${contactTypes.join(', ')}`
      }),

    firstName: Joi.string()
      .trim()
      .max(100)
      .allow('', null)
      .messages({
        'string.max': 'First name must not exceed 100 characters'
      }),

    lastName: Joi.string()
      .trim()
      .max(100)
      .allow('', null)
      .messages({
        'string.max': 'Last name must not exceed 100 characters'
      }),

    companyName: Joi.string()
      .trim()
      .max(255)
      .allow('', null)
      .messages({
        'string.max': 'Company name must not exceed 255 characters'
      }),

    primaryEmail: commonValidation.optionalEmail,
    secondaryEmail: commonValidation.optionalEmail,
    primaryPhone: commonValidation.optionalPhoneNumber,
    secondaryPhone: commonValidation.optionalPhoneNumber,

    contactRole: Joi.string()
      .valid(...contactRoles)
      .messages({
        'any.only': `Contact role must be one of: ${contactRoles.join(', ')}`
      }),

    leadStatus: Joi.string()
      .valid(...leadStatuses)
      .messages({
        'any.only': `Lead status must be one of: ${leadStatuses.join(', ')}`
      }),

    address: Joi.string()
      .max(500)
      .allow('', null)
      .messages({
        'string.max': 'Address must not exceed 500 characters'
      }),

    city: Joi.string()
      .max(100)
      .allow('', null)
      .messages({
        'string.max': 'City must not exceed 100 characters'
      }),

    state: Joi.string()
      .length(2)
      .uppercase()
      .allow('', null)
      .messages({
        'string.length': 'State must be a 2-letter code'
      }),

    zipCode: Joi.string()
      .pattern(/^\d{5}(-\d{4})?$/)
      .allow('', null)
      .messages({
        'string.pattern.base': 'Zip code must be in format 12345 or 12345-6789'
      }),

    notes: Joi.string()
      .max(5000)
      .allow('', null)
      .messages({
        'string.max': 'Notes must not exceed 5000 characters'
      }),

    linkedInUrl: commonValidation.optionalUrl,
    twitterUrl: commonValidation.optionalUrl,
    facebookUrl: commonValidation.optionalUrl,

    assignedAgentId: commonValidation.optionalUuid,
    companyId: commonValidation.optionalUuid,

    preferences: Joi.object().unknown(true),
    tags: Joi.array().items(Joi.string().max(50))
  }).min(1)
});

const getContactsSchema = celebrate({
  [Segments.QUERY]: Joi.object({
    page: commonValidation.pagination.page,
    limit: commonValidation.pagination.limit,
    search: commonValidation.searchQuery,
    contactRole: Joi.string().valid(...contactRoles),
    leadStatus: Joi.string().valid(...leadStatuses),
    type: Joi.string().valid(...contactTypes),
    sortBy: commonValidation.sortBy,
    sortOrder: commonValidation.sortOrder
  })
});

const getContactByIdSchema = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: commonValidation.uuid
  })
});

module.exports = {
  createContactSchema,
  updateContactSchema,
  getContactsSchema,
  getContactByIdSchema
};
