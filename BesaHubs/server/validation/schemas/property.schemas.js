const { Joi, Segments, celebrate } = require('celebrate');
const { commonValidation } = require('../../middleware/validation');

const propertyTypes = [
  'office',
  'retail',
  'industrial',
  'warehouse',
  'multifamily',
  'land',
  'mixed-use',
  'hospitality',
  'healthcare',
  'special-purpose'
];

const propertyStatuses = [
  'available',
  'under-contract',
  'sold',
  'leased',
  'off-market',
  'coming-soon'
];

const listingTypes = ['sale', 'lease', 'both'];

const leaseRateUnits = [
  'per_sqft_annual',
  'per_sqft_monthly',
  'monthly',
  'annual'
];

const marketingStatuses = ['draft', 'published', 'expired', 'suspended'];

const buildingClasses = ['A', 'B', 'C'];

const createPropertySchema = celebrate({
  [Segments.BODY]: Joi.object({
    name: Joi.string()
      .trim()
      .min(1)
      .max(255)
      .required()
      .messages({
        'string.empty': 'Property name is required',
        'string.max': 'Property name must not exceed 255 characters',
        'any.required': 'Property name is required'
      }),

    propertyType: Joi.string()
      .valid(...propertyTypes)
      .required()
      .messages({
        'any.only': `Property type must be one of: ${propertyTypes.join(', ')}`,
        'any.required': 'Property type is required'
      }),

    status: Joi.string()
      .valid(...propertyStatuses)
      .default('available')
      .messages({
        'any.only': `Status must be one of: ${propertyStatuses.join(', ')}`
      }),

    listingType: Joi.string()
      .valid(...listingTypes)
      .required()
      .messages({
        'any.only': `Listing type must be one of: ${listingTypes.join(', ')}`,
        'any.required': 'Listing type is required'
      }),

    address: Joi.string()
      .trim()
      .min(1)
      .max(500)
      .required()
      .messages({
        'string.empty': 'Address is required',
        'string.max': 'Address must not exceed 500 characters',
        'any.required': 'Address is required'
      }),

    city: Joi.string()
      .trim()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.empty': 'City is required',
        'string.max': 'City must not exceed 100 characters',
        'any.required': 'City is required'
      }),

    state: Joi.string()
      .trim()
      .length(2)
      .uppercase()
      .required()
      .messages({
        'string.length': 'State must be a 2-letter code',
        'string.empty': 'State is required',
        'any.required': 'State is required'
      }),

    zipCode: Joi.string()
      .trim()
      .pattern(/^\d{5}(-\d{4})?$/)
      .required()
      .messages({
        'string.pattern.base': 'Zip code must be in format 12345 or 12345-6789',
        'string.empty': 'Zip code is required',
        'any.required': 'Zip code is required'
      }),

    listPrice: Joi.number()
      .positive()
      .max(999999999999)
      .allow(null)
      .messages({
        'number.positive': 'List price must be a positive number',
        'number.max': 'List price is too large'
      }),

    leaseRate: Joi.number()
      .positive()
      .max(999999999999)
      .allow('', null)
      .messages({
        'number.positive': 'Lease rate must be a positive number',
        'number.max': 'Lease rate is too large'
      }),

    leaseRateUnit: Joi.string()
      .valid(...leaseRateUnits)
      .allow('', null)
      .messages({
        'any.only': `Lease rate unit must be one of: ${leaseRateUnits.join(', ')}`
      }),

    leaseType: Joi.string()
      .max(100)
      .allow('', null)
      .messages({
        'string.max': 'Lease type must not exceed 100 characters'
      }),

    leaseTerms: Joi.object({
      minTerm: Joi.alternatives().try(
        Joi.number().positive(),
        Joi.string().allow('')
      ).allow(null),
      maxTerm: Joi.alternatives().try(
        Joi.number().positive(),
        Joi.string().allow('')
      ).allow(null),
      renewalOptions: Joi.string().max(500).allow('', null),
      securityDeposit: Joi.alternatives().try(
        Joi.number().positive(),
        Joi.string().allow('')
      ).allow(null),
      personalGuaranteeRequired: Joi.boolean().default(false)
    }).allow(null),

    availabilityDate: Joi.alternatives()
      .try(
        Joi.date().iso(),
        Joi.string().allow('')
      )
      .allow(null)
      .messages({
        'date.format': 'Availability date must be a valid date'
      }),

    totalSquareFootage: Joi.number()
      .positive()
      .max(99999999)
      .allow(null)
      .messages({
        'number.positive': 'Square footage must be a positive number',
        'number.max': 'Square footage is too large'
      }),

    buildingClass: Joi.string()
      .valid(...buildingClasses)
      .allow('', null)
      .messages({
        'any.only': `Building class must be one of: ${buildingClasses.join(', ')}`
      }),

    yearBuilt: Joi.number()
      .integer()
      .min(1800)
      .max(new Date().getFullYear() + 5)
      .allow(null)
      .messages({
        'number.min': 'Year built must be 1800 or later',
        'number.max': 'Year built cannot be more than 5 years in the future'
      }),

    description: Joi.string()
      .max(5000)
      .allow('', null)
      .messages({
        'string.max': 'Description must not exceed 5000 characters'
      }),

    zoning: Joi.string()
      .max(100)
      .allow('', null)
      .messages({
        'string.max': 'Zoning must not exceed 100 characters'
      }),

    parkingSpaces: Joi.number()
      .integer()
      .positive()
      .max(99999)
      .allow('', null)
      .messages({
        'number.positive': 'Parking spaces must be a positive number',
        'number.integer': 'Parking spaces must be a whole number',
        'number.max': 'Parking spaces value is too large'
      }),

    amenities: Joi.array()
      .items(Joi.string().max(200))
      .allow(null)
      .messages({
        'array.base': 'Amenities must be an array',
        'string.max': 'Each amenity must not exceed 200 characters'
      }),

    marketingStatus: Joi.string()
      .valid(...marketingStatuses)
      .allow('', null)
      .messages({
        'any.only': `Marketing status must be one of: ${marketingStatuses.join(', ')}`
      }),

    pricePerSquareFoot: Joi.number()
      .positive()
      .max(999999)
      .allow('', null)
      .messages({
        'number.positive': 'Price per square foot must be a positive number',
        'number.max': 'Price per square foot is too large'
      }),

    mlsNumber: Joi.string()
      .trim()
      .max(50)
      .allow('', null)
      .messages({
        'string.max': 'MLS number must not exceed 50 characters'
      }),

    ownerId: commonValidation.optionalUuid,
    listingAgentId: commonValidation.optionalUuid,

    features: Joi.object().unknown(true),
    coordinates: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    }).allow(null),

    images: Joi.array().items(Joi.string()).allow(null),
    documents: Joi.array().items(Joi.object().unknown(true)).allow(null)
  })
});

const updatePropertySchema = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: commonValidation.uuid
  }),

  [Segments.BODY]: Joi.object({
    name: Joi.string()
      .trim()
      .min(1)
      .max(255)
      .messages({
        'string.empty': 'Property name cannot be empty',
        'string.max': 'Property name must not exceed 255 characters'
      }),

    propertyType: Joi.string()
      .valid(...propertyTypes)
      .messages({
        'any.only': `Property type must be one of: ${propertyTypes.join(', ')}`
      }),

    status: Joi.string()
      .valid(...propertyStatuses)
      .messages({
        'any.only': `Status must be one of: ${propertyStatuses.join(', ')}`
      }),

    listingType: Joi.string()
      .valid(...listingTypes)
      .messages({
        'any.only': `Listing type must be one of: ${listingTypes.join(', ')}`
      }),

    address: Joi.string()
      .trim()
      .max(500)
      .messages({
        'string.max': 'Address must not exceed 500 characters'
      }),

    city: Joi.string()
      .trim()
      .max(100)
      .messages({
        'string.max': 'City must not exceed 100 characters'
      }),

    state: Joi.string()
      .trim()
      .length(2)
      .uppercase()
      .messages({
        'string.length': 'State must be a 2-letter code'
      }),

    zipCode: Joi.string()
      .trim()
      .pattern(/^\d{5}(-\d{4})?$/)
      .messages({
        'string.pattern.base': 'Zip code must be in format 12345 or 12345-6789'
      }),

    listPrice: Joi.number()
      .positive()
      .max(999999999999)
      .allow(null)
      .messages({
        'number.positive': 'List price must be a positive number',
        'number.max': 'List price is too large'
      }),

    leaseRate: Joi.number()
      .positive()
      .max(999999999999)
      .allow('', null)
      .messages({
        'number.positive': 'Lease rate must be a positive number',
        'number.max': 'Lease rate is too large'
      }),

    leaseRateUnit: Joi.string()
      .valid(...leaseRateUnits)
      .allow('', null)
      .messages({
        'any.only': `Lease rate unit must be one of: ${leaseRateUnits.join(', ')}`
      }),

    leaseType: Joi.string()
      .max(100)
      .allow('', null)
      .messages({
        'string.max': 'Lease type must not exceed 100 characters'
      }),

    leaseTerms: Joi.object({
      minTerm: Joi.alternatives().try(
        Joi.number().positive(),
        Joi.string().allow('')
      ).allow(null),
      maxTerm: Joi.alternatives().try(
        Joi.number().positive(),
        Joi.string().allow('')
      ).allow(null),
      renewalOptions: Joi.string().max(500).allow('', null),
      securityDeposit: Joi.alternatives().try(
        Joi.number().positive(),
        Joi.string().allow('')
      ).allow(null),
      personalGuaranteeRequired: Joi.boolean().default(false)
    }).allow(null),

    availabilityDate: Joi.alternatives()
      .try(
        Joi.date().iso(),
        Joi.string().allow('')
      )
      .allow(null)
      .messages({
        'date.format': 'Availability date must be a valid date'
      }),

    totalSquareFootage: Joi.number()
      .positive()
      .max(99999999)
      .allow(null)
      .messages({
        'number.positive': 'Square footage must be a positive number',
        'number.max': 'Square footage is too large'
      }),

    buildingClass: Joi.string()
      .valid(...buildingClasses)
      .allow('', null)
      .messages({
        'any.only': `Building class must be one of: ${buildingClasses.join(', ')}`
      }),

    yearBuilt: Joi.number()
      .integer()
      .min(1800)
      .max(new Date().getFullYear() + 5)
      .allow(null)
      .messages({
        'number.min': 'Year built must be 1800 or later',
        'number.max': 'Year built cannot be more than 5 years in the future'
      }),

    description: Joi.string()
      .max(5000)
      .allow('', null)
      .messages({
        'string.max': 'Description must not exceed 5000 characters'
      }),

    zoning: Joi.string()
      .max(100)
      .allow('', null)
      .messages({
        'string.max': 'Zoning must not exceed 100 characters'
      }),

    parkingSpaces: Joi.number()
      .integer()
      .positive()
      .max(99999)
      .allow('', null)
      .messages({
        'number.positive': 'Parking spaces must be a positive number',
        'number.integer': 'Parking spaces must be a whole number',
        'number.max': 'Parking spaces value is too large'
      }),

    amenities: Joi.array()
      .items(Joi.string().max(200))
      .allow(null)
      .messages({
        'array.base': 'Amenities must be an array',
        'string.max': 'Each amenity must not exceed 200 characters'
      }),

    marketingStatus: Joi.string()
      .valid(...marketingStatuses)
      .allow('', null)
      .messages({
        'any.only': `Marketing status must be one of: ${marketingStatuses.join(', ')}`
      }),

    pricePerSquareFoot: Joi.number()
      .positive()
      .max(999999)
      .allow('', null)
      .messages({
        'number.positive': 'Price per square foot must be a positive number',
        'number.max': 'Price per square foot is too large'
      }),

    mlsNumber: Joi.string()
      .trim()
      .max(50)
      .allow('', null)
      .messages({
        'string.max': 'MLS number must not exceed 50 characters'
      }),

    ownerId: commonValidation.optionalUuid,
    listingAgentId: commonValidation.optionalUuid,

    features: Joi.object().unknown(true),
    coordinates: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    }).allow(null),

    images: Joi.array().items(Joi.string()).allow(null),
    documents: Joi.array().items(Joi.object().unknown(true)).allow(null)
  }).min(1)
});

const getPropertiesSchema = celebrate({
  [Segments.QUERY]: Joi.object({
    page: commonValidation.pagination.page,
    limit: commonValidation.pagination.limit,
    search: commonValidation.searchQuery,
    propertyType: Joi.string().valid(...propertyTypes),
    status: Joi.string().valid(...propertyStatuses),
    listingType: Joi.string().valid(...listingTypes),
    minPrice: Joi.number().positive(),
    maxPrice: Joi.number().positive().min(Joi.ref('minPrice')),
    city: Joi.string().max(100),
    state: Joi.string().length(2).uppercase(),
    sortBy: commonValidation.sortBy,
    sortOrder: commonValidation.sortOrder
  })
});

const getPropertyByIdSchema = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: commonValidation.uuid
  })
});

module.exports = {
  createPropertySchema,
  updatePropertySchema,
  getPropertiesSchema,
  getPropertyByIdSchema
};
