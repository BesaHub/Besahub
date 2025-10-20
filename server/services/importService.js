const csv = require('csv-parser');
const fs = require('fs');
const { Property, Contact } = require('../models');
const { appLogger } = require('../config/logger');
const { sanitizeCSVRow } = require('../utils/csvSanitizer');

class ImportService {
  async importProperties(filePath, userId) {
    const results = [];
    const errors = [];
    let rowNumber = 0;

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rowNumber++;
          try {
            const sanitizedRow = sanitizeCSVRow(row);
            
            if (!sanitizedRow.address || !sanitizedRow.city || !sanitizedRow.state || !sanitizedRow.propertyType) {
              errors.push({ row: rowNumber, error: 'Missing required fields (address, city, state, propertyType)' });
              return;
            }

            results.push({
              address: sanitizedRow.address,
              city: sanitizedRow.city,
              state: sanitizedRow.state,
              zipCode: sanitizedRow.zipCode || null,
              propertyType: sanitizedRow.propertyType,
              listPrice: sanitizedRow.price ? parseFloat(sanitizedRow.price) : null,
              squareFootage: sanitizedRow.squareFootage ? parseInt(sanitizedRow.squareFootage) : null,
              yearBuilt: sanitizedRow.yearBuilt ? parseInt(sanitizedRow.yearBuilt) : null,
              status: sanitizedRow.status || 'available',
              description: sanitizedRow.description || null,
              listingAgentId: userId
            });
          } catch (error) {
            errors.push({ row: rowNumber, error: error.message });
          }
        })
        .on('end', async () => {
          try {
            if (results.length > 0) {
              const created = await Property.bulkCreate(results, {
                validate: true,
                individualHooks: false
              });
              appLogger.info('Properties imported', {
                service: 'import-service',
                count: created.length,
                userId
              });
              resolve({ success: created.length, errors, total: rowNumber });
            } else {
              resolve({ success: 0, errors, total: rowNumber });
            }
          } catch (error) {
            appLogger.error('Error bulk creating properties', {
              service: 'import-service',
              error: error.message
            });
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  async importContacts(filePath, userId) {
    const results = [];
    const errors = [];
    let rowNumber = 0;

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rowNumber++;
          try {
            const sanitizedRow = sanitizeCSVRow(row);
            
            if (!sanitizedRow.firstName || !sanitizedRow.lastName || !sanitizedRow.email) {
              errors.push({ row: rowNumber, error: 'Missing required fields (firstName, lastName, email)' });
              return;
            }

            results.push({
              firstName: sanitizedRow.firstName,
              lastName: sanitizedRow.lastName,
              email: sanitizedRow.email,
              phone: sanitizedRow.phone || null,
              type: sanitizedRow.type || 'lead',
              status: sanitizedRow.status || 'active',
              company: sanitizedRow.company || null,
              title: sanitizedRow.title || null,
              address: sanitizedRow.address || null,
              city: sanitizedRow.city || null,
              state: sanitizedRow.state || null,
              zipCode: sanitizedRow.zipCode || null,
              assignedAgentId: userId
            });
          } catch (error) {
            errors.push({ row: rowNumber, error: error.message });
          }
        })
        .on('end', async () => {
          try {
            if (results.length > 0) {
              const created = await Contact.bulkCreate(results, {
                validate: true,
                individualHooks: false
              });
              appLogger.info('Contacts imported', {
                service: 'import-service',
                count: created.length,
                userId
              });
              resolve({ success: created.length, errors, total: rowNumber });
            } else {
              resolve({ success: 0, errors, total: rowNumber });
            }
          } catch (error) {
            appLogger.error('Error bulk creating contacts', {
              service: 'import-service',
              error: error.message
            });
            reject(error);
          }
        })
        .on('error', reject);
    });
  }
}

module.exports = new ImportService();
