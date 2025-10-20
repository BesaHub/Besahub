import Papa from 'papaparse';

// Property field mappings for CSV import
export const PROPERTY_FIELD_MAPPINGS = {
  name: ['name', 'property_name', 'title', 'property_title'],
  address: ['address', 'street_address', 'street', 'location'],
  city: ['city'],
  state: ['state', 'region'],
  zipCode: ['zip_code', 'zipcode', 'zip', 'postal_code'],
  propertyType: ['property_type', 'type', 'category'],
  status: ['status'],
  listingType: ['listing_type', 'listing', 'sale_type'],
  listPrice: ['list_price', 'price', 'asking_price', 'sale_price'],
  leaseRate: ['lease_rate', 'rent', 'rental_rate', 'lease_price'],
  totalSquareFootage: ['total_square_footage', 'sqft', 'square_feet', 'total_sqft', 'size'],
  buildingClass: ['building_class', 'class', 'grade'],
  yearBuilt: ['year_built', 'built_year', 'construction_year'],
  description: ['description', 'notes', 'details'],
  zoning: ['zoning'],
  parkingSpaces: ['parking_spaces', 'parking', 'parking_spots'],
  marketingStatus: ['marketing_status', 'listing_status'],
  pricePerSquareFoot: ['price_per_square_foot', 'price_per_sqft', 'psf']
};

// Contact field mappings for CSV import
export const CONTACT_FIELD_MAPPINGS = {
  firstName: ['first_name', 'firstname', 'fname', 'given_name'],
  lastName: ['last_name', 'lastname', 'lname', 'surname', 'family_name'],
  email: ['email', 'email_address', 'e_mail'],
  phone: ['phone', 'phone_number', 'mobile', 'telephone', 'cell'],
  company: ['company', 'organization', 'business', 'employer'],
  title: ['title', 'job_title', 'position', 'role'],
  type: ['type', 'contact_type', 'category'],
  source: ['source', 'lead_source', 'origin'],
  address: ['address', 'street_address', 'street'],
  city: ['city'],
  state: ['state', 'region'],
  zipCode: ['zip_code', 'zipcode', 'zip', 'postal_code'],
  country: ['country'],
  website: ['website', 'web', 'url', 'homepage'],
  notes: ['notes', 'description', 'comments', 'remarks']
};

// Valid options for enum fields
export const PROPERTY_ENUM_VALUES = {
  propertyType: ['office', 'retail', 'industrial', 'warehouse', 'multifamily', 'hotel', 'mixed_use', 'land', 'other'],
  status: ['available', 'under_contract', 'sold', 'leased', 'off_market'],
  listingType: ['sale', 'lease'],
  buildingClass: ['A', 'B', 'C'],
  marketingStatus: ['draft', 'published', 'archived']
};

export const CONTACT_ENUM_VALUES = {
  type: ['lead', 'prospect', 'client', 'investor', 'vendor', 'broker'],
  source: ['website', 'referral', 'cold_call', 'email', 'social_media', 'event', 'advertisement', 'other']
};

/**
 * Parse CSV file and return parsed data with headers
 * @param {File} file - CSV file to parse
 * @returns {Promise} - Promise resolving to parsed CSV data
 */
export const parseCSVFile = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
      transform: (value) => value.trim(),
      complete: (result) => {
        if (result.errors.length > 0) {
          reject(new Error(`CSV parsing errors: ${result.errors.map(e => e.message).join(', ')}`));
        } else {
          resolve({
            data: result.data,
            headers: result.meta.fields,
            totalRows: result.data.length
          });
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

/**
 * Map CSV headers to database fields using field mappings
 * @param {Array} csvHeaders - Headers from CSV file
 * @param {Object} fieldMappings - Field mapping object (PROPERTY_FIELD_MAPPINGS or CONTACT_FIELD_MAPPINGS)
 * @returns {Object} - Mapping of CSV headers to database fields
 */
export const mapCSVHeaders = (csvHeaders, fieldMappings) => {
  const mapping = {};
  const unmappedHeaders = [];

  csvHeaders.forEach(header => {
    let mapped = false;
    for (const [dbField, possibleHeaders] of Object.entries(fieldMappings)) {
      if (possibleHeaders.includes(header)) {
        mapping[header] = dbField;
        mapped = true;
        break;
      }
    }
    if (!mapped) {
      unmappedHeaders.push(header);
    }
  });

  return { mapping, unmappedHeaders };
};

/**
 * Validate and transform a single row of data
 * @param {Object} row - Raw CSV row data
 * @param {Object} headerMapping - Header to field mapping
 * @param {string} dataType - 'property' or 'contact'
 * @returns {Object} - Validation result with transformed data and errors
 */
export const validateAndTransformRow = (row, headerMapping, dataType) => {
  const transformedRow = {};
  const errors = [];
  const warnings = [];

  // Apply header mappings
  for (const [csvHeader, value] of Object.entries(row)) {
    if (headerMapping[csvHeader] && value) {
      const dbField = headerMapping[csvHeader];
      transformedRow[dbField] = value;
    }
  }

  // Data type specific validation
  if (dataType === 'property') {
    validatePropertyRow(transformedRow, errors, warnings);
  } else if (dataType === 'contact') {
    validateContactRow(transformedRow, errors, warnings);
  }

  return {
    data: transformedRow,
    errors,
    warnings,
    isValid: errors.length === 0
  };
};

/**
 * Validate property row data
 * @param {Object} row - Property row data
 * @param {Array} errors - Array to collect errors
 * @param {Array} warnings - Array to collect warnings
 */
const validatePropertyRow = (row, errors, warnings) => {
  // Required fields
  if (!row.name && !row.address) {
    errors.push('Property must have either a name or address');
  }

  // Property type validation
  if (row.propertyType && !PROPERTY_ENUM_VALUES.propertyType.includes(row.propertyType)) {
    warnings.push(`Invalid property type: ${row.propertyType}. Will default to 'other'`);
    row.propertyType = 'other';
  }

  // Status validation
  if (row.status && !PROPERTY_ENUM_VALUES.status.includes(row.status)) {
    warnings.push(`Invalid status: ${row.status}. Will default to 'available'`);
    row.status = 'available';
  }

  // Listing type validation
  if (row.listingType && !PROPERTY_ENUM_VALUES.listingType.includes(row.listingType)) {
    warnings.push(`Invalid listing type: ${row.listingType}. Will default to 'sale'`);
    row.listingType = 'sale';
  }

  // Building class validation
  if (row.buildingClass && !PROPERTY_ENUM_VALUES.buildingClass.includes(row.buildingClass)) {
    warnings.push(`Invalid building class: ${row.buildingClass}. Will be cleared`);
    delete row.buildingClass;
  }

  // Marketing status validation
  if (row.marketingStatus && !PROPERTY_ENUM_VALUES.marketingStatus.includes(row.marketingStatus)) {
    warnings.push(`Invalid marketing status: ${row.marketingStatus}. Will default to 'draft'`);
    row.marketingStatus = 'draft';
  }

  // Numeric field validation and conversion
  const numericFields = ['listPrice', 'leaseRate', 'totalSquareFootage', 'yearBuilt', 'parkingSpaces', 'pricePerSquareFoot'];
  numericFields.forEach(field => {
    if (row[field]) {
      const numValue = parseFloat(row[field].replace(/[$,]/g, ''));
      if (isNaN(numValue)) {
        warnings.push(`Invalid numeric value for ${field}: ${row[field]}. Will be cleared`);
        delete row[field];
      } else {
        row[field] = field === 'yearBuilt' || field === 'parkingSpaces' || field === 'totalSquareFootage'
          ? parseInt(numValue)
          : numValue;
      }
    }
  });

  // Year built validation
  if (row.yearBuilt && (row.yearBuilt < 1800 || row.yearBuilt > new Date().getFullYear() + 5)) {
    warnings.push(`Unusual year built: ${row.yearBuilt}`);
  }

  // Set defaults
  if (!row.propertyType) row.propertyType = 'other';
  if (!row.status) row.status = 'available';
  if (!row.listingType) row.listingType = 'sale';
  if (!row.marketingStatus) row.marketingStatus = 'draft';
};

/**
 * Validate contact row data
 * @param {Object} row - Contact row data
 * @param {Array} errors - Array to collect errors
 * @param {Array} warnings - Array to collect warnings
 */
const validateContactRow = (row, errors, warnings) => {
  // Required fields
  if (!row.firstName && !row.lastName && !row.email) {
    errors.push('Contact must have at least a first name, last name, or email');
  }

  // Email validation
  if (row.email && !/\S+@\S+\.\S+/.test(row.email)) {
    errors.push(`Invalid email format: ${row.email}`);
  }

  // Type validation
  if (row.type && !CONTACT_ENUM_VALUES.type.includes(row.type)) {
    warnings.push(`Invalid contact type: ${row.type}. Will default to 'lead'`);
    row.type = 'lead';
  }

  // Source validation
  if (row.source && !CONTACT_ENUM_VALUES.source.includes(row.source)) {
    warnings.push(`Invalid source: ${row.source}. Will default to 'other'`);
    row.source = 'other';
  }

  // Phone number cleanup
  if (row.phone) {
    row.phone = row.phone.replace(/\D/g, '');
    if (row.phone.length < 10) {
      warnings.push(`Phone number seems too short: ${row.phone}`);
    }
  }

  // Website URL validation
  if (row.website && !row.website.startsWith('http')) {
    row.website = 'https://' + row.website;
    warnings.push(`Added https:// to website URL: ${row.website}`);
  }

  // Set defaults
  if (!row.type) row.type = 'lead';
  if (!row.source) row.source = 'other';
  if (!row.country) row.country = 'US';
};

/**
 * Process entire CSV data for import
 * @param {Array} csvData - Array of CSV row objects
 * @param {Object} headerMapping - Header to field mapping
 * @param {string} dataType - 'property' or 'contact'
 * @returns {Object} - Processing results with valid/invalid data
 */
export const processCsvData = (csvData, headerMapping, dataType) => {
  const validRows = [];
  const invalidRows = [];
  const allWarnings = [];

  csvData.forEach((row, index) => {
    const result = validateAndTransformRow(row, headerMapping, dataType);

    if (result.isValid) {
      validRows.push({
        ...result.data,
        _originalRow: index + 1,
        _warnings: result.warnings
      });
    } else {
      invalidRows.push({
        ...row,
        _originalRow: index + 1,
        _errors: result.errors,
        _warnings: result.warnings
      });
    }

    allWarnings.push(...result.warnings);
  });

  return {
    validRows,
    invalidRows,
    totalRows: csvData.length,
    validCount: validRows.length,
    invalidCount: invalidRows.length,
    warnings: allWarnings
  };
};

/**
 * Generate CSV template for download
 * @param {string} dataType - 'property' or 'contact'
 * @returns {string} - CSV template string
 */
export const generateCSVTemplate = (dataType) => {
  let headers, sampleData;

  if (dataType === 'property') {
    headers = [
      'name', 'address', 'city', 'state', 'zip_code', 'property_type',
      'status', 'listing_type', 'list_price', 'lease_rate', 'total_square_footage',
      'building_class', 'year_built', 'description', 'zoning', 'parking_spaces',
      'marketing_status', 'price_per_square_foot'
    ];
    sampleData = [
      'Downtown Office Building', '123 Main St', 'New York', 'NY', '10001', 'office',
      'available', 'sale', '2500000', '', '15000', 'A', '2020',
      'Modern office space with city views', 'Commercial', '50', 'published', '167'
    ];
  } else {
    headers = [
      'first_name', 'last_name', 'email', 'phone', 'company', 'title',
      'type', 'source', 'address', 'city', 'state', 'zip_code',
      'country', 'website', 'notes'
    ];
    sampleData = [
      'John', 'Smith', 'john.smith@email.com', '555-123-4567', 'ABC Corp', 'CEO',
      'client', 'referral', '456 Business Ave', 'New York', 'NY', '10002',
      'US', 'https://abccorp.com', 'VIP client interested in office space'
    ];
  }

  const csvContent = [
    headers.join(','),
    sampleData.join(',')
  ].join('\n');

  return csvContent;
};

/**
 * Download CSV template file
 * @param {string} dataType - 'property' or 'contact'
 * @param {string} filename - Optional filename
 */
export const downloadCSVTemplate = (dataType, filename) => {
  const csvContent = generateCSVTemplate(dataType);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `${dataType}_import_template.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export default {
  parseCSVFile,
  mapCSVHeaders,
  validateAndTransformRow,
  processCsvData,
  generateCSVTemplate,
  downloadCSVTemplate,
  PROPERTY_FIELD_MAPPINGS,
  CONTACT_FIELD_MAPPINGS,
  PROPERTY_ENUM_VALUES,
  CONTACT_ENUM_VALUES
};