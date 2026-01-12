const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const archiver = require('archiver');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { appLogger } = require('../config/logger');
const { User, Property, Contact, Deal, Company } = require('../models');
const { sanitizeCSVRow } = require('../utils/csvSanitizer');

const execAsync = promisify(exec);

const BACKUP_DIR = path.join(__dirname, '../backups');
const EXPORTS_DIR = path.join(__dirname, '../exports');

const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const formatTimestamp = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}-${hours}-${minutes}`;
};

const createDatabaseBackup = async () => {
  try {
    ensureDirectoryExists(BACKUP_DIR);

    const timestamp = formatTimestamp();
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable not set');
    }

    const pgDumpCommand = `pg_dump "${dbUrl}" -f "${filepath}" --no-owner --no-acl`;

    appLogger.info('Starting database backup', { service: 'backup-service', filename });

    await execAsync(pgDumpCommand);

    const stats = fs.statSync(filepath);
    const fileInfo = {
      filename,
      filepath,
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),
      timestamp: new Date(),
      type: 'database_backup'
    };

    appLogger.info('Database backup completed successfully', { 
      service: 'backup-service', 
      ...fileInfo 
    });

    return fileInfo;
  } catch (error) {
    appLogger.error('Database backup failed', { 
      service: 'backup-service', 
      error: error.message 
    });
    throw new Error(`Database backup failed: ${error.message}`);
  }
};

const exportUsersToCSV = async () => {
  try {
    ensureDirectoryExists(EXPORTS_DIR);

    const timestamp = formatTimestamp();
    const filename = `users-export-${timestamp}.csv`;
    const filepath = path.join(EXPORTS_DIR, filename);

    const users = await User.findAll({
      attributes: { exclude: ['password', 'passwordResetToken', 'emailVerificationToken', 'refreshToken', 'mfaSecret', 'mfaBackupCodes'] },
      order: [['createdAt', 'DESC']]
    });

    const csvWriter = createCsvWriter({
      path: filepath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'firstName', title: 'First Name' },
        { id: 'lastName', title: 'Last Name' },
        { id: 'email', title: 'Email' },
        { id: 'phone', title: 'Phone' },
        { id: 'role', title: 'Role' },
        { id: 'title', title: 'Title' },
        { id: 'department', title: 'Department' },
        { id: 'licenseNumber', title: 'License Number' },
        { id: 'licenseState', title: 'License State' },
        { id: 'commissionRate', title: 'Commission Rate' },
        { id: 'isActive', title: 'Active' },
        { id: 'emailVerified', title: 'Email Verified' },
        { id: 'lastLogin', title: 'Last Login' },
        { id: 'createdAt', title: 'Created At' },
        { id: 'updatedAt', title: 'Updated At' }
      ]
    });

    // SECURITY: Sanitize all cell values to prevent CSV formula injection on export
    const sanitizedUsers = users.map(u => sanitizeCSVRow(u.toJSON()));
    await csvWriter.writeRecords(sanitizedUsers);

    const stats = fs.statSync(filepath);
    
    appLogger.info('Users exported to CSV', { 
      service: 'backup-service', 
      filename, 
      count: users.length 
    });

    return {
      filename,
      filepath,
      count: users.length,
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),
      timestamp: new Date(),
      type: 'users_export'
    };
  } catch (error) {
    appLogger.error('Users export failed', { 
      service: 'backup-service', 
      error: error.message 
    });
    throw new Error(`Users export failed: ${error.message}`);
  }
};

const exportPropertiesToCSV = async () => {
  try {
    ensureDirectoryExists(EXPORTS_DIR);

    const timestamp = formatTimestamp();
    const filename = `properties-export-${timestamp}.csv`;
    const filepath = path.join(EXPORTS_DIR, filename);

    const properties = await Property.findAll({
      include: [{
        model: User,
        as: 'listingAgent',
        attributes: ['firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    const csvWriter = createCsvWriter({
      path: filepath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'mlsNumber', title: 'MLS Number' },
        { id: 'name', title: 'Name' },
        { id: 'propertyType', title: 'Property Type' },
        { id: 'buildingClass', title: 'Building Class' },
        { id: 'status', title: 'Status' },
        { id: 'marketingStatus', title: 'Marketing Status' },
        { id: 'listingType', title: 'Listing Type' },
        { id: 'address', title: 'Address' },
        { id: 'city', title: 'City' },
        { id: 'state', title: 'State' },
        { id: 'zipCode', title: 'Zip Code' },
        { id: 'county', title: 'County' },
        { id: 'country', title: 'Country' },
        { id: 'latitude', title: 'Latitude' },
        { id: 'longitude', title: 'Longitude' },
        { id: 'totalSquareFootage', title: 'Total Square Footage' },
        { id: 'availableSquareFootage', title: 'Available Square Footage' },
        { id: 'lotSize', title: 'Lot Size' },
        { id: 'lotSizeUnit', title: 'Lot Size Unit' },
        { id: 'yearBuilt', title: 'Year Built' },
        { id: 'floors', title: 'Floors' },
        { id: 'units', title: 'Units' },
        { id: 'parkingSpaces', title: 'Parking Spaces' },
        { id: 'listPrice', title: 'List Price' },
        { id: 'pricePerSquareFoot', title: 'Price Per Square Foot' },
        { id: 'leaseRate', title: 'Lease Rate' },
        { id: 'leaseRateUnit', title: 'Lease Rate Unit' },
        { id: 'leaseType', title: 'Lease Type' },
        { id: 'operatingExpenses', title: 'Operating Expenses' },
        { id: 'taxes', title: 'Taxes' },
        { id: 'capRate', title: 'Cap Rate' },
        { id: 'netOperatingIncome', title: 'Net Operating Income' },
        { id: 'zoning', title: 'Zoning' },
        { id: 'occupancyPercentage', title: 'Occupancy Percentage' },
        { id: 'vacancyPercentage', title: 'Vacancy Percentage' },
        { id: 'daysOnMarket', title: 'Days On Market' },
        { id: 'views', title: 'Views' },
        { id: 'inquiries', title: 'Inquiries' },
        { id: 'showings', title: 'Showings' },
        { id: 'listingAgent', title: 'Listing Agent' },
        { id: 'description', title: 'Description' },
        { id: 'isActive', title: 'Active' },
        { id: 'createdAt', title: 'Created At' },
        { id: 'updatedAt', title: 'Updated At' }
      ]
    });

    const records = properties.map(p => {
      const json = p.toJSON();
      return {
        ...json,
        listingAgent: json.listingAgent ? `${json.listingAgent.firstName} ${json.listingAgent.lastName} (${json.listingAgent.email})` : ''
      };
    });

    // SECURITY: Sanitize all cell values to prevent CSV formula injection on export
    const sanitizedRecords = records.map(r => sanitizeCSVRow(r));
    await csvWriter.writeRecords(sanitizedRecords);

    const stats = fs.statSync(filepath);
    
    appLogger.info('Properties exported to CSV', { 
      service: 'backup-service', 
      filename, 
      count: properties.length 
    });

    return {
      filename,
      filepath,
      count: properties.length,
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),
      timestamp: new Date(),
      type: 'properties_export'
    };
  } catch (error) {
    appLogger.error('Properties export failed', { 
      service: 'backup-service', 
      error: error.message 
    });
    throw new Error(`Properties export failed: ${error.message}`);
  }
};

const exportContactsToCSV = async () => {
  try {
    ensureDirectoryExists(EXPORTS_DIR);

    const timestamp = formatTimestamp();
    const filename = `contacts-export-${timestamp}.csv`;
    const filepath = path.join(EXPORTS_DIR, filename);

    const contacts = await Contact.findAll({
      include: [{
        model: User,
        as: 'assignedAgent',
        attributes: ['firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    const csvWriter = createCsvWriter({
      path: filepath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'type', title: 'Type' },
        { id: 'firstName', title: 'First Name' },
        { id: 'lastName', title: 'Last Name' },
        { id: 'companyName', title: 'Company Name' },
        { id: 'title', title: 'Title' },
        { id: 'primaryEmail', title: 'Primary Email' },
        { id: 'secondaryEmail', title: 'Secondary Email' },
        { id: 'primaryPhone', title: 'Primary Phone' },
        { id: 'secondaryPhone', title: 'Secondary Phone' },
        { id: 'mobilePhone', title: 'Mobile Phone' },
        { id: 'fax', title: 'Fax' },
        { id: 'website', title: 'Website' },
        { id: 'mailingAddress', title: 'Mailing Address' },
        { id: 'mailingCity', title: 'Mailing City' },
        { id: 'mailingState', title: 'Mailing State' },
        { id: 'mailingZipCode', title: 'Mailing Zip Code' },
        { id: 'contactRole', title: 'Contact Role' },
        { id: 'leadSource', title: 'Lead Source' },
        { id: 'leadStatus', title: 'Lead Status' },
        { id: 'creditRating', title: 'Credit Rating' },
        { id: 'netWorth', title: 'Net Worth' },
        { id: 'liquidity', title: 'Liquidity' },
        { id: 'budgetMin', title: 'Budget Min' },
        { id: 'budgetMax', title: 'Budget Max' },
        { id: 'squareFootageMin', title: 'Square Footage Min' },
        { id: 'squareFootageMax', title: 'Square Footage Max' },
        { id: 'timeframe', title: 'Timeframe' },
        { id: 'assignedAgent', title: 'Assigned Agent' },
        { id: 'preferredContactMethod', title: 'Preferred Contact Method' },
        { id: 'communicationFrequency', title: 'Communication Frequency' },
        { id: 'lastContactDate', title: 'Last Contact Date' },
        { id: 'nextFollowUpDate', title: 'Next Follow Up Date' },
        { id: 'notes', title: 'Notes' },
        { id: 'isActive', title: 'Active' },
        { id: 'createdAt', title: 'Created At' },
        { id: 'updatedAt', title: 'Updated At' }
      ]
    });

    const records = contacts.map(c => {
      const json = c.toJSON();
      return {
        ...json,
        assignedAgent: json.assignedAgent ? `${json.assignedAgent.firstName} ${json.assignedAgent.lastName} (${json.assignedAgent.email})` : ''
      };
    });

    // SECURITY: Sanitize all cell values to prevent CSV formula injection on export
    const sanitizedRecords = records.map(r => sanitizeCSVRow(r));
    await csvWriter.writeRecords(sanitizedRecords);

    const stats = fs.statSync(filepath);
    
    appLogger.info('Contacts exported to CSV', { 
      service: 'backup-service', 
      filename, 
      count: contacts.length 
    });

    return {
      filename,
      filepath,
      count: contacts.length,
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),
      timestamp: new Date(),
      type: 'contacts_export'
    };
  } catch (error) {
    appLogger.error('Contacts export failed', { 
      service: 'backup-service', 
      error: error.message 
    });
    throw new Error(`Contacts export failed: ${error.message}`);
  }
};

const exportDealsToCSV = async () => {
  try {
    ensureDirectoryExists(EXPORTS_DIR);

    const timestamp = formatTimestamp();
    const filename = `deals-export-${timestamp}.csv`;
    const filepath = path.join(EXPORTS_DIR, filename);

    const deals = await Deal.findAll({
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['name', 'address', 'city', 'state']
        },
        {
          model: Contact,
          as: 'primaryContact',
          attributes: ['firstName', 'lastName', 'companyName', 'primaryEmail']
        },
        {
          model: User,
          as: 'listingAgent',
          attributes: ['firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'buyerAgent',
          attributes: ['firstName', 'lastName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const csvWriter = createCsvWriter({
      path: filepath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'name', title: 'Name' },
        { id: 'dealType', title: 'Deal Type' },
        { id: 'stage', title: 'Stage' },
        { id: 'value', title: 'Value' },
        { id: 'commission', title: 'Commission' },
        { id: 'commissionRate', title: 'Commission Rate' },
        { id: 'leaseTermMonths', title: 'Lease Term (Months)' },
        { id: 'monthlyRent', title: 'Monthly Rent' },
        { id: 'annualRent', title: 'Annual Rent' },
        { id: 'securityDeposit', title: 'Security Deposit' },
        { id: 'property', title: 'Property' },
        { id: 'primaryContact', title: 'Primary Contact' },
        { id: 'listingAgent', title: 'Listing Agent' },
        { id: 'buyerAgent', title: 'Buyer Agent' },
        { id: 'expectedCloseDate', title: 'Expected Close Date' },
        { id: 'actualCloseDate', title: 'Actual Close Date' },
        { id: 'contractDate', title: 'Contract Date' },
        { id: 'leaseStartDate', title: 'Lease Start Date' },
        { id: 'leaseEndDate', title: 'Lease End Date' },
        { id: 'probability', title: 'Probability' },
        { id: 'priority', title: 'Priority' },
        { id: 'leadSource', title: 'Lead Source' },
        { id: 'referralSource', title: 'Referral Source' },
        { id: 'lostReason', title: 'Lost Reason' },
        { id: 'description', title: 'Description' },
        { id: 'isActive', title: 'Active' },
        { id: 'createdAt', title: 'Created At' },
        { id: 'updatedAt', title: 'Updated At' }
      ]
    });

    const records = deals.map(d => {
      const json = d.toJSON();
      return {
        ...json,
        property: json.property ? `${json.property.name} - ${json.property.address}, ${json.property.city}, ${json.property.state}` : '',
        primaryContact: json.primaryContact ? `${json.primaryContact.firstName || ''} ${json.primaryContact.lastName || ''} ${json.primaryContact.companyName ? '(' + json.primaryContact.companyName + ')' : ''} - ${json.primaryContact.primaryEmail || ''}`.trim() : '',
        listingAgent: json.listingAgent ? `${json.listingAgent.firstName} ${json.listingAgent.lastName} (${json.listingAgent.email})` : '',
        buyerAgent: json.buyerAgent ? `${json.buyerAgent.firstName} ${json.buyerAgent.lastName} (${json.buyerAgent.email})` : ''
      };
    });

    // SECURITY: Sanitize all cell values to prevent CSV formula injection on export
    const sanitizedRecords = records.map(r => sanitizeCSVRow(r));
    await csvWriter.writeRecords(sanitizedRecords);

    const stats = fs.statSync(filepath);
    
    appLogger.info('Deals exported to CSV', { 
      service: 'backup-service', 
      filename, 
      count: deals.length 
    });

    return {
      filename,
      filepath,
      count: deals.length,
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),
      timestamp: new Date(),
      type: 'deals_export'
    };
  } catch (error) {
    appLogger.error('Deals export failed', { 
      service: 'backup-service', 
      error: error.message 
    });
    throw new Error(`Deals export failed: ${error.message}`);
  }
};

const exportCompaniesToCSV = async () => {
  try {
    ensureDirectoryExists(EXPORTS_DIR);

    const timestamp = formatTimestamp();
    const filename = `companies-export-${timestamp}.csv`;
    const filepath = path.join(EXPORTS_DIR, filename);

    const companies = await Company.findAll({
      include: [
        {
          model: Contact,
          as: 'primaryContact',
          attributes: ['firstName', 'lastName', 'primaryEmail']
        },
        {
          model: User,
          as: 'assignedAgent',
          attributes: ['firstName', 'lastName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const csvWriter = createCsvWriter({
      path: filepath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'name', title: 'Name' },
        { id: 'legalName', title: 'Legal Name' },
        { id: 'dbaName', title: 'DBA Name' },
        { id: 'companyType', title: 'Company Type' },
        { id: 'industry', title: 'Industry' },
        { id: 'primaryEmail', title: 'Primary Email' },
        { id: 'primaryPhone', title: 'Primary Phone' },
        { id: 'fax', title: 'Fax' },
        { id: 'website', title: 'Website' },
        { id: 'address', title: 'Address' },
        { id: 'city', title: 'City' },
        { id: 'state', title: 'State' },
        { id: 'zipCode', title: 'Zip Code' },
        { id: 'country', title: 'Country' },
        { id: 'taxId', title: 'Tax ID' },
        { id: 'dunsNumber', title: 'DUNS Number' },
        { id: 'licenseNumber', title: 'License Number' },
        { id: 'incorporationDate', title: 'Incorporation Date' },
        { id: 'incorporationState', title: 'Incorporation State' },
        { id: 'annualRevenue', title: 'Annual Revenue' },
        { id: 'employeeCount', title: 'Employee Count' },
        { id: 'creditRating', title: 'Credit Rating' },
        { id: 'netWorth', title: 'Net Worth' },
        { id: 'portfolioValue', title: 'Portfolio Value' },
        { id: 'primaryContact', title: 'Primary Contact' },
        { id: 'assignedAgent', title: 'Assigned Agent' },
        { id: 'leadSource', title: 'Lead Source' },
        { id: 'leadStatus', title: 'Lead Status' },
        { id: 'lastContactDate', title: 'Last Contact Date' },
        { id: 'nextFollowUpDate', title: 'Next Follow Up Date' },
        { id: 'description', title: 'Description' },
        { id: 'notes', title: 'Notes' },
        { id: 'isActive', title: 'Active' },
        { id: 'createdAt', title: 'Created At' },
        { id: 'updatedAt', title: 'Updated At' }
      ]
    });

    const records = companies.map(c => {
      const json = c.toJSON();
      return {
        ...json,
        primaryContact: json.primaryContact ? `${json.primaryContact.firstName || ''} ${json.primaryContact.lastName || ''} - ${json.primaryContact.primaryEmail || ''}`.trim() : '',
        assignedAgent: json.assignedAgent ? `${json.assignedAgent.firstName} ${json.assignedAgent.lastName} (${json.assignedAgent.email})` : ''
      };
    });

    // SECURITY: Sanitize all cell values to prevent CSV formula injection on export
    const sanitizedRecords = records.map(r => sanitizeCSVRow(r));
    await csvWriter.writeRecords(sanitizedRecords);

    const stats = fs.statSync(filepath);
    
    appLogger.info('Companies exported to CSV', { 
      service: 'backup-service', 
      filename, 
      count: companies.length 
    });

    return {
      filename,
      filepath,
      count: companies.length,
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),
      timestamp: new Date(),
      type: 'companies_export'
    };
  } catch (error) {
    appLogger.error('Companies export failed', { 
      service: 'backup-service', 
      error: error.message 
    });
    throw new Error(`Companies export failed: ${error.message}`);
  }
};

const exportAllData = async (username) => {
  try {
    ensureDirectoryExists(EXPORTS_DIR);

    const timestamp = formatTimestamp();
    const zipFilename = `complete-export-${timestamp}.zip`;
    const zipFilepath = path.join(EXPORTS_DIR, zipFilename);

    appLogger.info('Starting complete data export', { service: 'backup-service', timestamp });

    const [usersExport, propertiesExport, contactsExport, dealsExport, companiesExport] = await Promise.all([
      exportUsersToCSV(),
      exportPropertiesToCSV(),
      exportContactsToCSV(),
      exportDealsToCSV(),
      exportCompaniesToCSV()
    ]);

    const metadataFilename = `export-metadata-${timestamp}.json`;
    const metadataFilepath = path.join(EXPORTS_DIR, metadataFilename);
    
    const metadata = {
      exportDate: new Date().toISOString(),
      exportedBy: username,
      files: [
        { type: 'users', filename: usersExport.filename, count: usersExport.count },
        { type: 'properties', filename: propertiesExport.filename, count: propertiesExport.count },
        { type: 'contacts', filename: contactsExport.filename, count: contactsExport.count },
        { type: 'deals', filename: dealsExport.filename, count: dealsExport.count },
        { type: 'companies', filename: companiesExport.filename, count: companiesExport.count }
      ],
      totalRecords: usersExport.count + propertiesExport.count + contactsExport.count + dealsExport.count + companiesExport.count,
      version: '1.0'
    };

    fs.writeFileSync(metadataFilepath, JSON.stringify(metadata, null, 2));

    const output = fs.createWriteStream(zipFilepath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        const stats = fs.statSync(zipFilepath);
        
        const result = {
          filename: zipFilename,
          filepath: zipFilepath,
          size: stats.size,
          sizeFormatted: formatBytes(stats.size),
          timestamp: new Date(),
          type: 'complete_export',
          metadata,
          filesIncluded: [
            usersExport.filename,
            propertiesExport.filename,
            contactsExport.filename,
            dealsExport.filename,
            companiesExport.filename,
            metadataFilename
          ]
        };

        [usersExport, propertiesExport, contactsExport, dealsExport, companiesExport].forEach(exp => {
          try {
            fs.unlinkSync(exp.filepath);
          } catch (err) {
            appLogger.warn('Failed to delete temporary export file', { 
              service: 'backup-service', 
              file: exp.filename 
            });
          }
        });

        try {
          fs.unlinkSync(metadataFilepath);
        } catch (err) {
          appLogger.warn('Failed to delete metadata file', { 
            service: 'backup-service', 
            file: metadataFilename 
          });
        }

        appLogger.info('Complete data export finished', { 
          service: 'backup-service', 
          ...result 
        });

        resolve(result);
      });

      archive.on('error', (err) => {
        appLogger.error('Archive creation failed', { 
          service: 'backup-service', 
          error: err.message 
        });
        reject(err);
      });

      archive.pipe(output);

      archive.file(usersExport.filepath, { name: usersExport.filename });
      archive.file(propertiesExport.filepath, { name: propertiesExport.filename });
      archive.file(contactsExport.filepath, { name: contactsExport.filename });
      archive.file(dealsExport.filepath, { name: dealsExport.filename });
      archive.file(companiesExport.filepath, { name: companiesExport.filename });
      archive.file(metadataFilepath, { name: metadataFilename });

      archive.finalize();
    });
  } catch (error) {
    appLogger.error('Complete data export failed', { 
      service: 'backup-service', 
      error: error.message 
    });
    throw new Error(`Complete data export failed: ${error.message}`);
  }
};

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const listBackups = async () => {
  try {
    ensureDirectoryExists(BACKUP_DIR);
    
    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const filepath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filepath);
        return {
          filename: file,
          filepath,
          size: stats.size,
          sizeFormatted: formatBytes(stats.size),
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    return backups;
  } catch (error) {
    appLogger.error('List backups failed', { 
      service: 'backup-service', 
      error: error.message 
    });
    throw new Error(`List backups failed: ${error.message}`);
  }
};

const listExports = async () => {
  try {
    ensureDirectoryExists(EXPORTS_DIR);
    
    const files = fs.readdirSync(EXPORTS_DIR);
    const exports = files
      .filter(file => file.endsWith('.csv') || file.endsWith('.zip'))
      .map(file => {
        const filepath = path.join(EXPORTS_DIR, file);
        const stats = fs.statSync(filepath);
        return {
          filename: file,
          filepath,
          size: stats.size,
          sizeFormatted: formatBytes(stats.size),
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    return exports;
  } catch (error) {
    appLogger.error('List exports failed', { 
      service: 'backup-service', 
      error: error.message 
    });
    throw new Error(`List exports failed: ${error.message}`);
  }
};

module.exports = {
  createDatabaseBackup,
  exportUsersToCSV,
  exportPropertiesToCSV,
  exportContactsToCSV,
  exportDealsToCSV,
  exportCompaniesToCSV,
  exportAllData,
  listBackups,
  listExports
};
