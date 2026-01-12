const { body, query, validationResult } = require('express-validator');
const { Deal, Property, Contact } = require('../models');
const { Op } = require('sequelize');

const validateDealData = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Deal name is required and must be 1-200 characters'),
  
  body('dealType')
    .isIn(['sale', 'lease', 'investment'])
    .withMessage('Deal type must be sale, lease, or investment'),
  
  body('stage')
    .optional()
    .isIn(['prospecting', 'qualification', 'proposal', 'negotiation', 'contract', 'due_diligence', 'closing', 'won', 'lost'])
    .withMessage('Invalid deal stage'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  
  body('value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Deal value must be a positive number'),
  
  body('probability')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Probability must be between 0 and 100'),
  
  body('commission')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Commission must be a positive number'),
  
  body('commissionPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Commission percentage must be between 0 and 100'),
  
  body('expectedCloseDate')
    .optional()
    .isISO8601()
    .withMessage('Expected close date must be a valid date'),
  
  body('actualCloseDate')
    .optional()
    .isISO8601()
    .withMessage('Actual close date must be a valid date'),
  
  body('propertyId')
    .optional()
    .isUUID()
    .withMessage('Invalid property ID format'),
  
  body('primaryContactId')
    .optional()
    .isUUID()
    .withMessage('Invalid contact ID format'),
  
  body('buyerAgentId')
    .optional()
    .isUUID()
    .withMessage('Invalid buyer agent ID format'),
  
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must be maximum 2000 characters'),
  
  body('internalNotes')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Internal notes must be maximum 5000 characters'),
  
  body('lostReason')
    .optional()
    .isIn(['price', 'timing', 'competition', 'financing', 'location', 'requirements', 'unresponsive', 'other'])
    .withMessage('Invalid lost reason'),
  
  body('lostReasonNotes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Lost reason notes must be maximum 1000 characters'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('keyTerms')
    .optional()
    .isObject()
    .withMessage('Key terms must be an object'),
  
  // Custom validation for deal value vs commission
  body('commission')
    .optional()
    .custom((value, { req }) => {
      if (value && req.body.value && value > req.body.value) {
        throw new Error('Commission cannot exceed deal value');
      }
      return true;
    }),
  
  // Custom validation for commission percentage calculation
  body('commissionPercentage')
    .optional()
    .custom((value, { req }) => {
      if (value && req.body.value && req.body.commission) {
        const calculatedPercentage = (req.body.commission / req.body.value) * 100;
        if (Math.abs(calculatedPercentage - value) > 0.01) {
          throw new Error('Commission percentage does not match commission amount and deal value');
        }
      }
      return true;
    }),
  
  // Custom validation for date logic
  body('actualCloseDate')
    .optional()
    .custom((value, { req }) => {
      if (value && req.body.expectedCloseDate) {
        const actualDate = new Date(value);
        const expectedDate = new Date(req.body.expectedCloseDate);
        if (actualDate < expectedDate.setDate(expectedDate.getDate() - 365)) { // Allow 1 year early
          throw new Error('Actual close date cannot be more than 1 year before expected date');
        }
      }
      return true;
    }),
  
  // Custom validation for lost reason requirement
  body('lostReason')
    .if(body('stage').equals('lost'))
    .notEmpty()
    .withMessage('Lost reason is required when deal stage is "lost"'),
  
  // Custom validation for actual close date requirement
  body('actualCloseDate')
    .if(body('stage').equals('won'))
    .notEmpty()
    .withMessage('Actual close date is required when deal stage is "won"'),
  
  // Async validation for property existence
  body('propertyId')
    .if(body('propertyId').exists())
    .custom(async (value) => {
      if (!value) return true;
      
      const property = await Property.findByPk(value);
      if (!property) {
        throw new Error('Property not found');
      }
      return true;
    }),
  
  // Async validation for contact existence
  body('primaryContactId')
    .if(body('primaryContactId').exists())
    .custom(async (value) => {
      if (!value) return true;
      
      const contact = await Contact.findByPk(value);
      if (!contact) {
        throw new Error('Primary contact not found');
      }
      return true;
    })
];

const validateDealUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Deal name must be 1-200 characters'),
  
  body('stage')
    .optional()
    .isIn(['prospecting', 'qualification', 'proposal', 'negotiation', 'contract', 'due_diligence', 'closing', 'won', 'lost'])
    .withMessage('Invalid deal stage'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  
  body('value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Deal value must be a positive number'),
  
  body('probability')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Probability must be between 0 and 100'),
  
  body('commission')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Commission must be a positive number'),
  
  body('commissionPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Commission percentage must be between 0 and 100'),
  
  body('expectedCloseDate')
    .optional()
    .isISO8601()
    .withMessage('Expected close date must be a valid date'),
  
  body('actualCloseDate')
    .optional()
    .isISO8601()
    .withMessage('Actual close date must be a valid date'),
  
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must be maximum 2000 characters'),
  
  body('internalNotes')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Internal notes must be maximum 5000 characters'),
  
  body('lostReason')
    .optional()
    .isIn(['price', 'timing', 'competition', 'financing', 'location', 'requirements', 'unresponsive', 'other'])
    .withMessage('Invalid lost reason'),
  
  body('lostReasonNotes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Lost reason notes must be maximum 1000 characters'),
  
  // Custom validations
  body('commission')
    .optional()
    .custom((value, { req }) => {
      if (value && req.body.value && value > req.body.value) {
        throw new Error('Commission cannot exceed deal value');
      }
      return true;
    }),
  
  body('lostReason')
    .if(body('stage').equals('lost'))
    .notEmpty()
    .withMessage('Lost reason is required when deal stage is "lost"'),
  
  body('actualCloseDate')
    .if(body('stage').equals('won'))
    .notEmpty()
    .withMessage('Actual close date is required when deal stage is "won"')
];

const validateDealSearch = [
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term too long'),
  
  query('stage')
    .optional()
    .isIn(['prospecting', 'qualification', 'proposal', 'negotiation', 'contract', 'due_diligence', 'closing', 'won', 'lost'])
    .withMessage('Invalid deal stage'),
  
  query('dealType')
    .optional()
    .isIn(['sale', 'lease', 'investment'])
    .withMessage('Invalid deal type'),
  
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  
  query('minValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum value must be a positive number'),
  
  query('maxValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum value must be a positive number'),
  
  query('minProbability')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Minimum probability must be between 0 and 100'),
  
  query('maxProbability')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Maximum probability must be between 0 and 100'),
  
  query('expectedCloseDateFrom')
    .optional()
    .isISO8601()
    .withMessage('Expected close date from must be a valid date'),
  
  query('expectedCloseDateTo')
    .optional()
    .isISO8601()
    .withMessage('Expected close date to must be a valid date'),
  
  query('listingAgentId')
    .optional()
    .isUUID()
    .withMessage('Invalid listing agent ID format'),
  
  query('buyerAgentId')
    .optional()
    .isUUID()
    .withMessage('Invalid buyer agent ID format'),
  
  query('propertyType')
    .optional()
    .isIn(['office', 'retail', 'industrial', 'warehouse', 'multifamily', 'hotel', 'mixed_use', 'land', 'other'])
    .withMessage('Invalid property type'),
  
  query('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must be maximum 100 characters'),
  
  query('state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State must be maximum 50 characters'),
  
  query('sortBy')
    .optional()
    .isIn(['name', 'value', 'probability', 'stage', 'priority', 'expectedCloseDate', 'actualCloseDate', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc', 'ASC', 'DESC'])
    .withMessage('Invalid sort order'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('includeClosed')
    .optional()
    .isBoolean()
    .withMessage('Include closed must be a boolean'),
  
  // Custom validation for value range
  query()
    .custom((value, { req }) => {
      const { minValue, maxValue } = req.query;
      if (minValue && maxValue && parseFloat(minValue) > parseFloat(maxValue)) {
        throw new Error('Minimum value cannot be greater than maximum value');
      }
      return true;
    }),
  
  // Custom validation for probability range
  query()
    .custom((value, { req }) => {
      const { minProbability, maxProbability } = req.query;
      if (minProbability && maxProbability && parseInt(minProbability) > parseInt(maxProbability)) {
        throw new Error('Minimum probability cannot be greater than maximum probability');
      }
      return true;
    }),
  
  // Custom validation for date range
  query()
    .custom((value, { req }) => {
      const { expectedCloseDateFrom, expectedCloseDateTo } = req.query;
      if (expectedCloseDateFrom && expectedCloseDateTo) {
        const fromDate = new Date(expectedCloseDateFrom);
        const toDate = new Date(expectedCloseDateTo);
        if (fromDate > toDate) {
          throw new Error('Expected close date from cannot be after expected close date to');
        }
      }
      return true;
    })
];

const validateStageUpdate = [
  body('stage')
    .isIn(['prospecting', 'qualification', 'proposal', 'negotiation', 'contract', 'due_diligence', 'closing', 'won', 'lost'])
    .withMessage('Invalid deal stage'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be maximum 1000 characters'),
  
  body('lostReason')
    .optional()
    .isIn(['price', 'timing', 'competition', 'financing', 'location', 'requirements', 'unresponsive', 'other'])
    .withMessage('Invalid lost reason'),
  
  body('lostReasonNotes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Lost reason notes must be maximum 1000 characters'),
  
  body('actualCloseDate')
    .optional()
    .isISO8601()
    .withMessage('Actual close date must be a valid date'),
  
  // Custom validation for lost reason requirement
  body('lostReason')
    .if(body('stage').equals('lost'))
    .notEmpty()
    .withMessage('Lost reason is required when moving deal to "lost" stage'),
  
  // Custom validation for actual close date requirement
  body('actualCloseDate')
    .if(body('stage').equals('won'))
    .notEmpty()
    .withMessage('Actual close date is required when moving deal to "won" stage')
];

const validateActivityData = [
  body('type')
    .isIn(['call', 'email', 'meeting', 'tour', 'proposal', 'negotiation', 'document', 'follow_up', 'contract_review', 'due_diligence'])
    .withMessage('Invalid activity type'),
  
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Activity title is required and must be 1-200 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must be maximum 2000 characters'),
  
  body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid date'),
  
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a positive integer (minutes)'),
  
  body('completed')
    .optional()
    .isBoolean()
    .withMessage('Completed must be a boolean'),
  
  body('outcome')
    .optional()
    .isIn(['successful', 'unsuccessful', 'follow_up_required', 'reschedule', 'cancelled'])
    .withMessage('Invalid activity outcome'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  
  body('location')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Location must be maximum 500 characters'),
  
  body('attendees')
    .optional()
    .isArray()
    .withMessage('Attendees must be an array'),
  
  body('followUpRequired')
    .optional()
    .isBoolean()
    .withMessage('Follow up required must be a boolean'),
  
  body('followUpDate')
    .optional()
    .isISO8601()
    .withMessage('Follow up date must be a valid date'),
  
  // Custom validation for follow up date
  body('followUpDate')
    .if(body('followUpRequired').equals(true))
    .notEmpty()
    .withMessage('Follow up date is required when follow up is required'),
  
  // Custom validation for completed activities
  body('outcome')
    .if(body('completed').equals(true))
    .notEmpty()
    .withMessage('Outcome is required for completed activities')
];

// Middleware to handle validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

module.exports = {
  validateDealData,
  validateDealUpdate,
  validateDealSearch,
  validateStageUpdate,
  validateActivityData,
  handleValidationErrors
};