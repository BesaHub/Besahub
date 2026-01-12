const { body, validationResult } = require('express-validator');
const { Contact } = require('../models');
const { Op } = require('sequelize');

const validateContactData = [
  body('type')
    .isIn(['individual', 'company'])
    .withMessage('Type must be individual or company'),
  
  body('firstName')
    .if(body('type').equals('individual'))
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be 1-50 characters'),
  
  body('lastName')
    .if(body('type').equals('individual'))
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be 1-50 characters'),
  
  body('companyName')
    .if(body('type').equals('company'))
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Company name is required and must be 1-100 characters'),
  
  body('primaryEmail')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  
  body('secondaryEmail')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid secondary email format'),
  
  body('primaryPhone')
    .optional()
    .isMobilePhone()
    .withMessage('Invalid phone number format'),
  
  body('mobilePhone')
    .optional()
    .isMobilePhone()
    .withMessage('Invalid mobile phone format'),
  
  body('contactRole')
    .isIn(['tenant', 'landlord', 'buyer', 'seller', 'investor', 'broker', 'attorney', 'lender', 'contractor', 'vendor', 'other'])
    .withMessage('Invalid contact role'),
  
  body('leadStatus')
    .optional()
    .isIn(['cold', 'warm', 'hot', 'qualified', 'converted', 'lost', 'inactive'])
    .withMessage('Invalid lead status'),
  
  body('budgetMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget minimum must be a positive number'),
  
  body('budgetMax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget maximum must be a positive number')
    .custom((value, { req }) => {
      if (req.body.budgetMin && value < req.body.budgetMin) {
        throw new Error('Budget maximum must be greater than minimum');
      }
      return true;
    }),
  
  body('netWorth')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Net worth must be a positive number'),
  
  body('liquidity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Liquidity must be a positive number'),
  
  body('creditRating')
    .optional()
    .isIn(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-'])
    .withMessage('Invalid credit rating'),
  
  body('propertyTypeInterest')
    .optional()
    .isArray()
    .withMessage('Property type interest must be an array'),
  
  body('propertyTypeInterest.*')
    .optional()
    .isIn(['office', 'retail', 'industrial', 'warehouse', 'multifamily', 'hotel', 'mixed_use', 'land', 'other'])
    .withMessage('Invalid property type'),
  
  body('preferredLocations')
    .optional()
    .isArray()
    .withMessage('Preferred locations must be an array'),
  
  body('timeframe')
    .optional()
    .isIn(['immediate', '30_days', '3_months', '6_months', '1_year', 'flexible'])
    .withMessage('Invalid timeframe'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('website')
    .optional()
    .isURL()
    .withMessage('Invalid website URL'),
  
  body('linkedInUrl')
    .optional()
    .isURL()
    .withMessage('Invalid LinkedIn URL')
    .custom((value) => {
      if (value && !value.includes('linkedin.com')) {
        throw new Error('LinkedIn URL must be from linkedin.com');
      }
      return true;
    }),

  // Custom validation for uniqueness
  body('primaryEmail')
    .if(body('primaryEmail').exists())
    .custom(async (value, { req }) => {
      if (!value) return true;
      
      const whereCondition = { primaryEmail: value };
      if (req.params.id) {
        whereCondition.id = { [Op.ne]: req.params.id };
      }
      
      const existingContact = await Contact.findOne({ where: whereCondition });
      if (existingContact) {
        throw new Error('Contact with this email already exists');
      }
      return true;
    })
];

const validateContactUpdate = [
  body('primaryEmail')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  
  body('secondaryEmail')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid secondary email format'),
  
  body('primaryPhone')
    .optional()
    .isMobilePhone()
    .withMessage('Invalid phone number format'),
  
  body('leadStatus')
    .optional()
    .isIn(['cold', 'warm', 'hot', 'qualified', 'converted', 'lost', 'inactive'])
    .withMessage('Invalid lead status'),
  
  body('budgetMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget minimum must be a positive number'),
  
  body('budgetMax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget maximum must be a positive number')
    .custom((value, { req }) => {
      if (req.body.budgetMin && value < req.body.budgetMin) {
        throw new Error('Budget maximum must be greater than minimum');
      }
      return true;
    }),
  
  body('contactRole')
    .optional()
    .isIn(['tenant', 'landlord', 'buyer', 'seller', 'investor', 'broker', 'attorney', 'lender', 'contractor', 'vendor', 'other'])
    .withMessage('Invalid contact role'),
  
  // Custom validation for uniqueness on update
  body('primaryEmail')
    .if(body('primaryEmail').exists())
    .custom(async (value, { req }) => {
      if (!value) return true;
      
      const existingContact = await Contact.findOne({
        where: {
          primaryEmail: value,
          id: { [Op.ne]: req.params.id }
        }
      });
      
      if (existingContact) {
        throw new Error('Another contact with this email already exists');
      }
      return true;
    })
];

const validateContactSearch = [
  body('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term too long'),
  
  body('contactRole')
    .optional()
    .isIn(['tenant', 'landlord', 'buyer', 'seller', 'investor', 'broker', 'attorney', 'lender', 'contractor', 'vendor', 'other'])
    .withMessage('Invalid contact role'),
  
  body('leadStatus')
    .optional()
    .isIn(['cold', 'warm', 'hot', 'qualified', 'converted', 'lost', 'inactive'])
    .withMessage('Invalid lead status'),
  
  body('type')
    .optional()
    .isIn(['individual', 'company'])
    .withMessage('Invalid contact type')
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
  validateContactData,
  validateContactUpdate,
  validateContactSearch,
  handleValidationErrors
};