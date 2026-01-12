const { body, validationResult } = require('express-validator');

const propertyValidationRules = () => {
  return [
    body('name').notEmpty().withMessage('Property name is required').isLength({ max: 200 }).withMessage('Property name cannot exceed 200 characters'),
    
    body('propertyType').isIn(['office', 'retail', 'industrial', 'warehouse', 'multifamily', 'hotel', 'land', 'mixed_use', 'medical', 'restaurant', 'other']).withMessage('Invalid property type'),
    
    body('buildingClass').optional().isIn(['A', 'B', 'C']).withMessage('Building class must be A, B, or C'),
    
    body('address').notEmpty().withMessage('Address is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('state').isLength({ min: 2, max: 2 }).withMessage('State must be 2 characters'),
    body('zipCode').matches(/^\d{5}(-\d{4})?$/).withMessage('ZIP code must be in format 12345 or 12345-6789'),
    body('country').optional().isLength({ max: 50 }),
    
    body('totalSquareFootage').optional().isInt({ min: 0 }).withMessage('Total square footage must be a positive integer'),
    body('availableSquareFootage').optional().isInt({ min: 0 }).withMessage('Available square footage must be a positive integer'),
    body('lotSize').optional().isFloat({ min: 0 }).withMessage('Lot size must be a positive number'),
    body('lotSizeUnit').optional().isIn(['sqft', 'acres', 'hectares']).withMessage('Invalid lot size unit'),
    
    body('yearBuilt').optional().isInt({ min: 1800, max: new Date().getFullYear() + 5 }).withMessage('Year built must be between 1800 and 5 years from now'),
    body('floors').optional().isInt({ min: 1 }).withMessage('Number of floors must be at least 1'),
    body('units').optional().isInt({ min: 0 }).withMessage('Number of units must be non-negative'),
    body('parkingSpaces').optional().isInt({ min: 0 }).withMessage('Parking spaces must be non-negative'),
    body('parkingRatio').optional().isFloat({ min: 0 }).withMessage('Parking ratio must be non-negative'),
    
    body('ceilingHeight').optional().isFloat({ min: 0 }).withMessage('Ceiling height must be non-negative'),
    body('clearHeight').optional().isFloat({ min: 0 }).withMessage('Clear height must be non-negative'),
    body('loadingDocks').optional().isInt({ min: 0 }).withMessage('Loading docks must be non-negative'),
    body('driveInDoors').optional().isInt({ min: 0 }).withMessage('Drive-in doors must be non-negative'),
    
    body('listPrice').optional().isFloat({ min: 0 }).withMessage('List price must be non-negative'),
    body('pricePerSquareFoot').optional().isFloat({ min: 0 }).withMessage('Price per square foot must be non-negative'),
    body('leaseRate').optional().isFloat({ min: 0 }).withMessage('Lease rate must be non-negative'),
    body('leaseRateUnit').optional().isIn(['monthly', 'annual', 'per_sqft_monthly', 'per_sqft_annual']).withMessage('Invalid lease rate unit'),
    body('leaseType').optional().isIn(['NNN', 'Gross', 'Modified', 'Full Service']).withMessage('Invalid lease type'),
    
    body('operatingExpenses').optional().isFloat({ min: 0 }).withMessage('Operating expenses must be non-negative'),
    body('taxes').optional().isFloat({ min: 0 }).withMessage('Taxes must be non-negative'),
    body('capRate').optional().isFloat({ min: 0, max: 1 }).withMessage('Cap rate must be between 0 and 1'),
    body('netOperatingIncome').optional().isFloat().withMessage('NOI must be a valid number'),
    
    body('occupancyPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Occupancy percentage must be between 0 and 100'),
    body('vacancyPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Vacancy percentage must be between 0 and 100'),
    
    body('status').optional().isIn(['available', 'under_contract', 'sold', 'leased', 'off_market', 'coming_soon']).withMessage('Invalid status'),
    body('listingType').isIn(['sale', 'lease', 'both']).withMessage('Listing type must be sale, lease, or both'),
    
    body('virtualTourUrl').optional().isURL().withMessage('Virtual tour URL must be a valid URL'),
    
    body('availabilityDate').optional().isISO8601().withMessage('Availability date must be a valid date'),
    
    body('amenities').optional().isArray().withMessage('Amenities must be an array'),
    body('keyFeatures').optional().isArray().withMessage('Key features must be an array'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('images').optional().isArray().withMessage('Images must be an array'),
    body('floorPlans').optional().isArray().withMessage('Floor plans must be an array'),
    body('sitePlans').optional().isArray().withMessage('Site plans must be an array'),
    body('documents').optional().isArray().withMessage('Documents must be an array'),
    body('linkedDeals').optional().isArray().withMessage('Linked deals must be an array')
  ];
};

const bulkImportValidationRules = () => {
  return [
    body().isArray().withMessage('Request body must be an array of properties'),
    body('*.name').notEmpty().withMessage('Property name is required for all properties'),
    body('*.propertyType').isIn(['office', 'retail', 'industrial', 'warehouse', 'multifamily', 'hotel', 'land', 'mixed_use', 'medical', 'restaurant', 'other']).withMessage('Invalid property type'),
    body('*.address').notEmpty().withMessage('Address is required for all properties'),
    body('*.city').notEmpty().withMessage('City is required for all properties'),
    body('*.state').isLength({ min: 2, max: 2 }).withMessage('State must be 2 characters for all properties'),
    body('*.zipCode').matches(/^\d{5}(-\d{4})?$/).withMessage('ZIP code must be in format 12345 or 12345-6789 for all properties'),
    body('*.listingType').isIn(['sale', 'lease', 'both']).withMessage('Listing type must be sale, lease, or both for all properties')
  ];
};

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

const validateRequiredFields = (req, res, next) => {
  const { name, propertyType, address, city, state, zipCode, listingType } = req.body;
  
  const missingFields = [];
  
  if (!name) missingFields.push('name');
  if (!propertyType) missingFields.push('propertyType');
  if (!address) missingFields.push('address');
  if (!city) missingFields.push('city');
  if (!state) missingFields.push('state');
  if (!zipCode) missingFields.push('zipCode');
  if (!listingType) missingFields.push('listingType');
  
  if (listingType === 'sale' && !req.body.listPrice) {
    missingFields.push('listPrice (required for sale listings)');
  }
  
  if ((listingType === 'lease' || listingType === 'both') && !req.body.leaseRate) {
    missingFields.push('leaseRate (required for lease listings)');
  }
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
      missingFields: missingFields
    });
  }
  
  next();
};

const validateOccupancyVacancy = (req, res, next) => {
  const { occupancyPercentage, vacancyPercentage } = req.body;
  
  if (occupancyPercentage !== undefined && vacancyPercentage !== undefined) {
    const total = parseFloat(occupancyPercentage) + parseFloat(vacancyPercentage);
    if (Math.abs(total - 100) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Occupancy and vacancy percentages must add up to 100%',
        occupancy: occupancyPercentage,
        vacancy: vacancyPercentage,
        total: total
      });
    }
  }
  
  next();
};

module.exports = {
  propertyValidationRules,
  bulkImportValidationRules,
  validate,
  validateRequiredFields,
  validateOccupancyVacancy
};