const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ExcelJS = require('exceljs');
const { sanitizeCSVRow, sanitizeCSVCell } = require('./csvSanitizer');

const csvFieldMapping = {
  'Property Name': 'name',
  'Property Type': 'propertyType',
  'Building Class': 'buildingClass',
  'Status': 'status',
  'Listing Type': 'listingType',
  'Address': 'address',
  'City': 'city',
  'State': 'state',
  'ZIP Code': 'zipCode',
  'County': 'county',
  'Country': 'country',
  'Total Square Footage': 'totalSquareFootage',
  'Available Square Footage': 'availableSquareFootage',
  'Lot Size': 'lotSize',
  'Lot Size Unit': 'lotSizeUnit',
  'Year Built': 'yearBuilt',
  'Number of Floors': 'floors',
  'Number of Units': 'units',
  'Parking Spaces': 'parkingSpaces',
  'Parking Ratio': 'parkingRatio',
  'Ceiling Height': 'ceilingHeight',
  'Clear Height': 'clearHeight',
  'Loading Docks': 'loadingDocks',
  'Drive-in Doors': 'driveInDoors',
  'Lot Dimensions': 'lotDimensions',
  'List Price': 'listPrice',
  'Price per Square Foot': 'pricePerSquareFoot',
  'Lease Rate': 'leaseRate',
  'Lease Rate Unit': 'leaseRateUnit',
  'Lease Type': 'leaseType',
  'Operating Expenses': 'operatingExpenses',
  'Taxes': 'taxes',
  'Cap Rate': 'capRate',
  'Net Operating Income': 'netOperatingIncome',
  'Occupancy Percentage': 'occupancyPercentage',
  'Vacancy Percentage': 'vacancyPercentage',
  'Zoning': 'zoning',
  'Description': 'description',
  'Marketing Remarks': 'marketingRemarks',
  'Highlights': 'highlights',
  'Landlord Name': 'landlordName',
  'Availability Date': 'availabilityDate',
  'Internal Property ID': 'internalPropertyId',
  'Notes': 'notes',
  'Tags': 'tags',
  'MLS Number': 'mlsNumber'
};

const exportFields = [
  'name',
  'propertyType',
  'buildingClass',
  'status',
  'listingType',
  'address',
  'city',
  'state',
  'zipCode',
  'county',
  'country',
  'totalSquareFootage',
  'availableSquareFootage',
  'lotSize',
  'lotSizeUnit',
  'yearBuilt',
  'floors',
  'units',
  'parkingSpaces',
  'parkingRatio',
  'ceilingHeight',
  'clearHeight',
  'loadingDocks',
  'driveInDoors',
  'lotDimensions',
  'listPrice',
  'pricePerSquareFoot',
  'leaseRate',
  'leaseRateUnit',
  'leaseType',
  'operatingExpenses',
  'taxes',
  'capRate',
  'netOperatingIncome',
  'occupancyPercentage',
  'vacancyPercentage',
  'zoning',
  'description',
  'marketingRemarks',
  'highlights',
  'landlordName',
  'availabilityDate',
  'internalPropertyId',
  'notes',
  'tags',
  'mlsNumber'
];

const parseCSVFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    let rowIndex = 0;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        rowIndex++;
        try {
          const sanitizedData = sanitizeCSVRow(data);
          const property = {};
          
          Object.keys(sanitizedData).forEach(csvField => {
            const dbField = csvFieldMapping[csvField];
            if (dbField && sanitizedData[csvField] !== '') {
              let value = sanitizedData[csvField];
              
              if (['totalSquareFootage', 'availableSquareFootage', 'yearBuilt', 'floors', 'units', 'parkingSpaces', 'loadingDocks', 'driveInDoors'].includes(dbField)) {
                value = parseInt(value);
              } else if (['lotSize', 'parkingRatio', 'ceilingHeight', 'clearHeight', 'listPrice', 'pricePerSquareFoot', 'leaseRate', 'operatingExpenses', 'taxes', 'capRate', 'netOperatingIncome', 'occupancyPercentage', 'vacancyPercentage'].includes(dbField)) {
                value = parseFloat(value);
              } else if (dbField === 'tags' && value) {
                value = value.split(',').map(tag => tag.trim());
              } else if (dbField === 'availabilityDate' && value) {
                value = new Date(value);
              }
              
              property[dbField] = value;
            }
          });
          
          const validationErrors = validateProperty(property, rowIndex);
          if (validationErrors.length > 0) {
            errors.push(...validationErrors);
          } else {
            results.push(property);
          }
        } catch (error) {
          errors.push({
            row: rowIndex,
            message: `Error parsing row: ${error.message}`
          });
        }
      })
      .on('end', () => {
        resolve({ properties: results, errors });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

const parseExcelFile = async (filePath) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  const worksheet = workbook.getWorksheet(1);
  const properties = [];
  const errors = [];
  
  const headers = [];
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber] = cell.value;
  });
  
  for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
    const row = worksheet.getRow(rowIndex);
    const property = {};
    
    try {
      row.eachCell((cell, colNumber) => {
        const csvField = headers[colNumber];
        const dbField = csvFieldMapping[csvField];
        
        if (dbField && cell.value !== null && cell.value !== '') {
          let value = sanitizeCSVCell(cell.value);
          
          if (['totalSquareFootage', 'availableSquareFootage', 'yearBuilt', 'floors', 'units', 'parkingSpaces', 'loadingDocks', 'driveInDoors'].includes(dbField)) {
            value = parseInt(value);
          } else if (['lotSize', 'parkingRatio', 'ceilingHeight', 'clearHeight', 'listPrice', 'pricePerSquareFoot', 'leaseRate', 'operatingExpenses', 'taxes', 'capRate', 'netOperatingIncome', 'occupancyPercentage', 'vacancyPercentage'].includes(dbField)) {
            value = parseFloat(value);
          } else if (dbField === 'tags' && value) {
            value = value.toString().split(',').map(tag => tag.trim());
          } else if (dbField === 'availabilityDate' && value) {
            value = new Date(value);
          }
          
          property[dbField] = value;
        }
      });
      
      if (Object.keys(property).length > 0) {
        const validationErrors = validateProperty(property, rowIndex);
        if (validationErrors.length > 0) {
          errors.push(...validationErrors);
        } else {
          properties.push(property);
        }
      }
    } catch (error) {
      errors.push({
        row: rowIndex,
        message: `Error parsing row: ${error.message}`
      });
    }
  }
  
  return { properties, errors };
};

const validateProperty = (property, rowIndex) => {
  const errors = [];
  const requiredFields = ['name', 'propertyType', 'address', 'city', 'state', 'zipCode', 'listingType'];
  
  requiredFields.forEach(field => {
    if (!property[field]) {
      errors.push({
        row: rowIndex,
        field: field,
        message: `Required field '${field}' is missing`
      });
    }
  });
  
  if (property.propertyType && !['office', 'retail', 'industrial', 'warehouse', 'multifamily', 'hotel', 'land', 'mixed_use', 'medical', 'restaurant', 'other'].includes(property.propertyType)) {
    errors.push({
      row: rowIndex,
      field: 'propertyType',
      message: 'Invalid property type'
    });
  }
  
  if (property.listingType && !['sale', 'lease', 'both'].includes(property.listingType)) {
    errors.push({
      row: rowIndex,
      field: 'listingType',
      message: 'Invalid listing type'
    });
  }
  
  if (property.zipCode && !/^\d{5}(-\d{4})?$/.test(property.zipCode)) {
    errors.push({
      row: rowIndex,
      field: 'zipCode',
      message: 'Invalid ZIP code format'
    });
  }
  
  if (property.listingType === 'sale' && !property.listPrice) {
    errors.push({
      row: rowIndex,
      field: 'listPrice',
      message: 'List price is required for sale listings'
    });
  }
  
  if ((property.listingType === 'lease' || property.listingType === 'both') && !property.leaseRate) {
    errors.push({
      row: rowIndex,
      field: 'leaseRate',
      message: 'Lease rate is required for lease listings'
    });
  }
  
  return errors;
};

const exportToCSV = (properties, selectedFields = null) => {
  const fieldsToExport = selectedFields || exportFields;
  const headers = fieldsToExport.map(field => {
    const label = Object.keys(csvFieldMapping).find(key => csvFieldMapping[key] === field);
    return {
      id: field,
      title: label || field
    };
  });
  
  // Convert to CSV string manually
  const csvRows = [];
  csvRows.push(headers.map(h => h.title).join(','));
  
  properties.forEach(property => {
    const row = fieldsToExport.map(field => {
      let value = property[field];
      if (Array.isArray(value)) {
        value = value.join('; ');
      } else if (value instanceof Date) {
        value = value.toISOString().split('T')[0];
      }
      // SECURITY: Sanitize BEFORE formatting to prevent CSV formula injection bypass
      // This prevents formulas with commas like =HYPERLINK("url", "text") from bypassing protection
      value = sanitizeCSVCell(value ?? '');
      // Format after sanitization
      if (typeof value === 'string' && value.includes(',')) {
        value = `"${value}"`;
      }
      return value;
    });
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
};

const exportToExcel = async (properties, selectedFields = null) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Properties');
  
  const fieldsToExport = selectedFields || exportFields;
  const headers = fieldsToExport.map(field => {
    return Object.keys(csvFieldMapping).find(key => csvFieldMapping[key] === field) || field;
  });
  
  worksheet.addRow(headers);
  
  properties.forEach(property => {
    const row = fieldsToExport.map(field => {
      let value = property[field];
      if (Array.isArray(value)) {
        value = value.join(', ');
      } else if (value instanceof Date) {
        value = value.toISOString().split('T')[0];
      }
      // SECURITY: Sanitize BEFORE adding to Excel to prevent CSV formula injection
      value = sanitizeCSVCell(value ?? '');
      return value;
    });
    worksheet.addRow(row);
  });
  
  worksheet.getRow(1).font = { bold: true };
  worksheet.columns.forEach(column => {
    column.width = 15;
  });
  
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

const generateTemplate = (format = 'csv') => {
  const headers = Object.keys(csvFieldMapping);
  const sampleData = {
    'Property Name': 'Sample Office Building',
    'Property Type': 'office',
    'Building Class': 'A',
    'Status': 'available',
    'Listing Type': 'sale',
    'Address': '123 Main St',
    'City': 'New York',
    'State': 'NY',
    'ZIP Code': '10001',
    'Total Square Footage': '50000',
    'List Price': '5000000',
    'Lease Rate': '45',
    'Lease Type': 'NNN',
    'Year Built': '2020',
    'Zoning': 'C-1',
    'Description': 'Modern office building in prime location'
  };
  
  if (format === 'excel') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Property Template');
    
    worksheet.addRow(headers);
    worksheet.addRow(headers.map(header => sampleData[header] || ''));
    
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(2).font = { italic: true };
    
    worksheet.columns.forEach(column => {
      column.width = 20;
    });
    
    return workbook.xlsx.writeBuffer();
  } else {
    const csvData = [
      headers,
      headers.map(header => sampleData[header] || '')
    ];
    
    return csvData.map(row => row.join(',')).join('\n');
  }
};

module.exports = {
  parseCSVFile,
  parseExcelFile,
  exportToCSV,
  exportToExcel,
  generateTemplate,
  validateProperty,
  csvFieldMapping,
  exportFields
};