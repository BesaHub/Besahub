const { Joi, Segments, celebrate } = require('celebrate');
const { commonValidation } = require('../../middleware/validation');
const { dealStages, dealTypes } = require('../../models/Deal');

const createDealSchema = celebrate({
  [Segments.BODY]: Joi.object({
    name: Joi.string()
      .trim()
      .min(1)
      .max(255)
      .required()
      .messages({
        'string.empty': 'Deal name is required',
        'string.max': 'Deal name must not exceed 255 characters',
        'any.required': 'Deal name is required'
      }),

    dealType: Joi.string()
      .valid(...dealTypes)
      .required()
      .messages({
        'any.only': `Deal type must be one of: ${dealTypes.join(', ')}`,
        'any.required': 'Deal type is required'
      }),

    stage: Joi.string()
      .valid(...dealStages)
      .default('prospecting')
      .messages({
        'any.only': `Deal stage must be one of: ${dealStages.join(', ')}`
      }),

    dealValue: Joi.number()
      .positive()
      .max(999999999999)
      .allow(null)
      .messages({
        'number.positive': 'Deal value must be a positive number',
        'number.max': 'Deal value is too large'
      }),

    probability: Joi.number()
      .min(0)
      .max(100)
      .default(50)
      .messages({
        'number.min': 'Probability must be between 0 and 100',
        'number.max': 'Probability must be between 0 and 100'
      }),

    expectedCloseDate: Joi.date()
      .iso()
      .allow(null)
      .messages({
        'date.base': 'Expected close date must be a valid date',
        'date.format': 'Expected close date must be in ISO 8601 format (YYYY-MM-DD)'
      }),

    actualCloseDate: Joi.date()
      .iso()
      .allow(null)
      .messages({
        'date.base': 'Actual close date must be a valid date',
        'date.format': 'Actual close date must be in ISO 8601 format (YYYY-MM-DD)'
      }),

    description: Joi.string()
      .max(5000)
      .allow('', null)
      .messages({
        'string.max': 'Description must not exceed 5000 characters'
      }),

    propertyId: commonValidation.optionalUuid,

    primaryContactId: commonValidation.optionalUuid,

    assignedAgentId: commonValidation.optionalUuid,

    commission: Joi.object({
      rate: Joi.number().min(0).max(100),
      amount: Joi.number().min(0),
      structure: Joi.string().valid('percentage', 'flat', 'tiered')
    }).allow(null),

    terms: Joi.object().unknown(true),
    notes: Joi.string().max(5000).allow('', null)
  })
});

const updateDealSchema = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: commonValidation.uuid
  }),

  [Segments.BODY]: Joi.object({
    name: Joi.string()
      .trim()
      .min(1)
      .max(255)
      .messages({
        'string.empty': 'Deal name cannot be empty',
        'string.max': 'Deal name must not exceed 255 characters'
      }),

    dealType: Joi.string()
      .valid(...dealTypes)
      .messages({
        'any.only': `Deal type must be one of: ${dealTypes.join(', ')}`
      }),

    stage: Joi.string()
      .valid(...dealStages)
      .messages({
        'any.only': `Deal stage must be one of: ${dealStages.join(', ')}`
      }),

    dealValue: Joi.number()
      .positive()
      .max(999999999999)
      .messages({
        'number.positive': 'Deal value must be a positive number',
        'number.max': 'Deal value is too large'
      }),

    probability: Joi.number()
      .min(0)
      .max(100)
      .messages({
        'number.min': 'Probability must be between 0 and 100',
        'number.max': 'Probability must be between 0 and 100'
      }),

    expectedCloseDate: Joi.date()
      .iso()
      .allow(null)
      .messages({
        'date.base': 'Expected close date must be a valid date',
        'date.format': 'Expected close date must be in ISO 8601 format'
      }),

    actualCloseDate: Joi.date()
      .iso()
      .allow(null)
      .messages({
        'date.base': 'Actual close date must be a valid date',
        'date.format': 'Actual close date must be in ISO 8601 format'
      }),

    description: Joi.string()
      .max(5000)
      .allow('', null)
      .messages({
        'string.max': 'Description must not exceed 5000 characters'
      }),

    propertyId: commonValidation.optionalUuid,
    primaryContactId: commonValidation.optionalUuid,
    assignedAgentId: commonValidation.optionalUuid,

    commission: Joi.object({
      rate: Joi.number().min(0).max(100),
      amount: Joi.number().min(0),
      structure: Joi.string().valid('percentage', 'flat', 'tiered')
    }).allow(null),

    terms: Joi.object().unknown(true),
    notes: Joi.string().max(5000).allow('', null)
  }).min(1)
});

const getDealsSchema = celebrate({
  [Segments.QUERY]: Joi.object({
    page: commonValidation.pagination.page,
    limit: commonValidation.pagination.limit,
    search: commonValidation.searchQuery,
    dealType: Joi.string().valid(...dealTypes),
    stage: Joi.string().valid(...dealStages),
    propertyId: commonValidation.optionalUuid,
    contactId: commonValidation.optionalUuid,
    minValue: Joi.number().positive(),
    maxValue: Joi.number().positive().min(Joi.ref('minValue')),
    sortBy: commonValidation.sortBy,
    sortOrder: commonValidation.sortOrder
  })
});

const getDealByIdSchema = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: commonValidation.uuid
  })
});

const bulkUpdateDealsSchema = celebrate({
  [Segments.BODY]: Joi.object({
    dealIds: Joi.array()
      .items(Joi.string().uuid())
      .min(1)
      .max(100)
      .required()
      .messages({
        'array.min': 'At least one deal ID required',
        'array.max': 'Maximum 100 deals can be updated at once'
      }),
    updates: Joi.object({
      stage: Joi.string().valid(...dealStages),
      listingAgentId: Joi.string().uuid(),
      buyerAgentId: Joi.string().uuid(),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
      probability: Joi.number().min(0).max(100),
      expectedCloseDate: Joi.date().iso().allow(null),
      dealValue: Joi.number().positive().max(999999999999),
      status: Joi.string().valid('active', 'inactive', 'archived')
    }).min(1).required()
  })
});

module.exports = {
  createDealSchema,
  updateDealSchema,
  getDealsSchema,
  getDealByIdSchema,
  bulkUpdateDealsSchema
};
