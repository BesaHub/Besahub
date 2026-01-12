const { body, query, validationResult } = require('express-validator');
const { Property } = require('../models');
const { Op } = require('sequelize');

const validatePropertyData = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Property name is required and must be 1-200 characters'),
  
  body('propertyType')
    .isIn(['office', 'retail', 'industrial', 'warehouse', 'multifamily', 'hotel', 'mixed_use', 'land', 'medical', 'restaurant', 'other'])
    .withMessage('Invalid property type'),
  
  body('status')
    .isIn(['available', 'under_contract', 'sold', 'leased', 'off_market', 'coming_soon'])
    .withMessage('Invalid property status'),
  
  body('listingType')
    .isIn(['sale', 'lease', 'both'])
    .withMessage('Invalid listing type'),
  
  body('address')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Address is required and must be 1-500 characters'),
  
  body('city')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('City is required and must be 1-100 characters'),
  
  body('state')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('State is required and must be 2-50 characters'),
  
  body('zipCode')
    .trim()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Invalid ZIP code format'),
  
  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country must be 1-100 characters'),
  
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('totalSquareFootage')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total square footage must be a positive number'),
  
  body('rentableSquareFootage')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Rentable square footage must be a positive number'),
  
  body('lotSize')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Lot size must be a positive number'),
  
  body('yearBuilt')
    .optional()
    .isInt({ min: 1800, max: new Date().getFullYear() + 5 })
    .withMessage('Year built must be between 1800 and 5 years from now'),
  
  body('yearRenovated')
    .optional()
    .isInt({ min: 1800, max: new Date().getFullYear() + 5 })
    .withMessage('Year renovated must be between 1800 and 5 years from now'),
  
  body('floors')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Floors must be a positive integer'),
  
  body('parkingSpaces')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Parking spaces must be a non-negative integer'),
  
  body('listPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('List price must be a positive number'),
  
  body('leaseRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Lease rate must be a positive number'),
  
  body('leaseRateUnit')
    .optional()
    .isIn(['monthly', 'annual', 'per_sqft_monthly', 'per_sqft_annual'])
    .withMessage('Invalid lease rate unit'),
  
  body('operatingExpenses')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Operating expenses must be a positive number'),
  
  body('taxes')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Taxes must be a positive number'),
  
  body('insurance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Insurance must be a positive number'),
  
  body('capRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Cap rate must be between 0 and 100'),
  
  body('netOperatingIncome')
    .optional()
    .isFloat()
    .withMessage('Net operating income must be a number'),
  
  body('grossRentMultiplier')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Gross rent multiplier must be a positive number'),
  
  body('occupancyRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Occupancy rate must be between 0 and 100'),
  
  body('zoning')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Zoning must be 1-100 characters'),
  
  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array'),
  
  body('amenities.*')
    .optional()
    .isIn(['parking', 'elevator', 'loading_dock', 'security', 'hvac', 'fiber_internet', 'conference_rooms', 'kitchen', 'gym', 'rooftop', 'outdoor_space', 'on_site_management', 'other'])
    .withMessage('Invalid amenity'),
  
  body('utilities')
    .optional()
    .isArray()
    .withMessage('Utilities must be an array'),
  
  body('utilities.*')
    .optional()
    .isIn(['electric', 'gas', 'water', 'sewer', 'internet', 'cable', 'phone'])
    .withMessage('Invalid utility'),
  
  body('transportation')
    .optional()
    .isObject()
    .withMessage('Transportation must be an object'),
  
  body('environmental')
    .optional()
    .isObject()
    .withMessage('Environmental must be an object'),
  
  body('marketingDescription')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Marketing description must be maximum 5000 characters'),
  
  body('internalNotes')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Internal notes must be maximum 2000 characters'),
  
  body('website')
    .optional()
    .isURL()
    .withMessage('Invalid website URL'),
  
  body('virtualTourUrl')
    .optional()
    .isURL()
    .withMessage('Invalid virtual tour URL'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  // Custom validation for lease terms
  body()
    .custom((value, { req }) => {
      if (req.body.listingType === 'lease' || req.body.listingType === 'both') {
        if (!req.body.leaseRate) {
          throw new Error('Lease rate is required for lease listings');
        }
        if (!req.body.leaseRateUnit) {
          throw new Error('Lease rate unit is required for lease listings');
        }
      }
      return true;
    }),
  
  // Custom validation for sale price
  body()
    .custom((value, { req }) => {
      if (req.body.listingType === 'sale' || req.body.listingType === 'both') {
        if (!req.body.listPrice) {
          throw new Error('List price is required for sale listings');
        }
      }
      return true;
    }),
  
  // Custom validation for square footage
  body('rentableSquareFootage')
    .optional()
    .custom((value, { req }) => {
      if (value && req.body.totalSquareFootage && value > req.body.totalSquareFootage) {
        throw new Error('Rentable square footage cannot exceed total square footage');
      }
      return true;
    }),
  
  // Custom validation for year renovated
  body('yearRenovated')
    .optional()
    .custom((value, { req }) => {
      if (value && req.body.yearBuilt && value < req.body.yearBuilt) {
        throw new Error('Year renovated cannot be before year built');
      }
      return true;
    })
];

const validatePropertyUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Property name must be 1-200 characters'),
  
  body('propertyType')
    .optional()
    .isIn(['office', 'retail', 'industrial', 'warehouse', 'multifamily', 'hotel', 'mixed_use', 'land', 'medical', 'restaurant', 'other'])
    .withMessage('Invalid property type'),
  
  body('status')
    .optional()
    .isIn(['available', 'under_contract', 'sold', 'leased', 'off_market', 'coming_soon'])
    .withMessage('Invalid property status'),
  
  body('listingType')
    .optional()
    .isIn(['sale', 'lease', 'both'])
    .withMessage('Invalid listing type'),
  
  body('listPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('List price must be a positive number'),
  
  body('leaseRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Lease rate must be a positive number'),
  
  body('leaseRateUnit')
    .optional()
    .isIn(['monthly', 'annual', 'per_sqft_monthly', 'per_sqft_annual'])
    .withMessage('Invalid lease rate unit'),
  
  body('occupancyRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Occupancy rate must be between 0 and 100'),
  
  body('capRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Cap rate must be between 0 and 100'),
  
  body('marketingDescription')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Marketing description must be maximum 5000 characters'),
  
  body('internalNotes')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Internal notes must be maximum 2000 characters')
];

const validatePropertySearch = [
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term too long'),
  
  query('propertyType')
    .optional()
    .isIn(['office', 'retail', 'industrial', 'warehouse', 'multifamily', 'hotel', 'mixed_use', 'land', 'medical', 'restaurant', 'other'])
    .withMessage('Invalid property type'),
  
  query('status')
    .optional()
    .isIn(['available', 'under_contract', 'sold', 'leased', 'off_market', 'coming_soon'])
    .withMessage('Invalid property status'),
  
  query('listingType')
    .optional()
    .isIn(['sale', 'lease', 'both'])
    .withMessage('Invalid listing type'),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  
  query('minSquareFootage')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum square footage must be a positive number'),
  
  query('maxSquareFootage')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum square footage must be a positive number'),
  
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
  
  query('zipCode')
    .optional()
    .trim()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Invalid ZIP code format'),
  
  query('radius')
    .optional()
    .isFloat({ min: 0, max: 500 })
    .withMessage('Radius must be between 0 and 500 miles'),
  
  query('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  query('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  query('amenities')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        return value.split(',').every(amenity => 
          ['parking', 'elevator', 'loading_dock', 'security', 'hvac', 'fiber_internet', 'conference_rooms', 'kitchen', 'gym', 'rooftop', 'outdoor_space', 'on_site_management', 'other'].includes(amenity.trim())
        );
      }
      return true;
    })
    .withMessage('Invalid amenities'),
  
  query('sortBy')
    .optional()
    .isIn(['name', 'listPrice', 'leaseRate', 'totalSquareFootage', 'capRate', 'createdAt', 'updatedAt'])
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
  
  // Custom validation for price range
  query()
    .custom((value, { req }) => {
      const { minPrice, maxPrice } = req.query;
      if (minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice)) {
        throw new Error('Minimum price cannot be greater than maximum price');
      }
      return true;
    }),
  
  // Custom validation for square footage range
  query()
    .custom((value, { req }) => {
      const { minSquareFootage, maxSquareFootage } = req.query;
      if (minSquareFootage && maxSquareFootage && parseFloat(minSquareFootage) > parseFloat(maxSquareFootage)) {
        throw new Error('Minimum square footage cannot be greater than maximum square footage');
      }
      return true;
    })
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
  validatePropertyData,
  validatePropertyUpdate,
  validatePropertySearch,
  handleValidationErrors
};