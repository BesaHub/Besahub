/**
 * Detection Script for Dangerous CSV Formulas
 * 
 * This script scans the database for existing values that contain dangerous formula prefixes.
 * It does NOT auto-clean (could break legitimate data) - only reports findings for manual review.
 * 
 * Usage: node server/scripts/detectDangerousFormulas.js
 */

const { Sequelize } = require('sequelize');
const { User, Property, Contact, Deal, Company } = require('../models');
const { appLogger } = require('../config/logger');

const DANGEROUS_PREFIXES = ['=', '+', '-', '@', '|', '%'];

function hasDangerousPrefix(value) {
  if (!value || typeof value !== 'string') {
    return false;
  }
  
  // Check for dangerous prefixes (including after zero-width/control chars)
  const cleanedValue = value.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202F\uFEFF]/g, '');
  const firstChar = cleanedValue.charAt(0);
  
  return DANGEROUS_PREFIXES.includes(firstChar);
}

async function scanTable(model, tableName, textFields) {
  const findings = [];
  
  try {
    const records = await model.findAll();
    
    for (const record of records) {
      const json = record.toJSON();
      
      for (const field of textFields) {
        const value = json[field];
        
        if (hasDangerousPrefix(value)) {
          findings.push({
            table: tableName,
            id: json.id,
            field,
            value: value.substring(0, 100), // Limit to 100 chars for logging
            hasControlChars: /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202F\uFEFF]/.test(value)
          });
        }
      }
    }
  } catch (error) {
    appLogger.error(`Error scanning ${tableName}:`, error);
  }
  
  return findings;
}

async function detectDangerousFormulas() {
  console.log('\n🔍 Starting scan for dangerous CSV formulas...\n');
  
  const allFindings = [];
  
  // Scan Users table
  console.log('Scanning Users table...');
  const userFindings = await scanTable(User, 'Users', [
    'firstName', 'lastName', 'email', 'phone', 'title', 'department', 
    'licenseNumber', 'licenseState'
  ]);
  allFindings.push(...userFindings);
  
  // Scan Properties table
  console.log('Scanning Properties table...');
  const propertyFindings = await scanTable(Property, 'Properties', [
    'name', 'address', 'city', 'state', 'zipCode', 'county', 'country',
    'description', 'marketingRemarks', 'highlights', 'landlordName', 
    'internalPropertyId', 'notes', 'mlsNumber', 'zoning'
  ]);
  allFindings.push(...propertyFindings);
  
  // Scan Contacts table
  console.log('Scanning Contacts table...');
  const contactFindings = await scanTable(Contact, 'Contacts', [
    'firstName', 'lastName', 'companyName', 'primaryEmail', 'secondaryEmail',
    'primaryPhone', 'secondaryPhone', 'title', 'mailingAddress', 'mailingCity',
    'mailingState', 'mailingZipCode', 'notes'
  ]);
  allFindings.push(...contactFindings);
  
  // Scan Deals table
  console.log('Scanning Deals table...');
  const dealFindings = await scanTable(Deal, 'Deals', [
    'name', 'description', 'leadSource', 'referralSource', 'lostReason'
  ]);
  allFindings.push(...dealFindings);
  
  // Scan Companies table
  console.log('Scanning Companies table...');
  const companyFindings = await scanTable(Company, 'Companies', [
    'name', 'legalName', 'website', 'address', 'city', 'state', 'zipCode',
    'country', 'taxId', 'dunsNumber', 'licenseNumber', 'description', 'notes'
  ]);
  allFindings.push(...companyFindings);
  
  // Report findings
  console.log('\n' + '='.repeat(80));
  console.log('SCAN RESULTS');
  console.log('='.repeat(80) + '\n');
  
  if (allFindings.length === 0) {
    console.log('✅ No dangerous formulas detected in the database.\n');
  } else {
    console.log(`⚠️  Found ${allFindings.length} potential dangerous formula(s):\n`);
    
    allFindings.forEach((finding, index) => {
      console.log(`${index + 1}. ${finding.table} (ID: ${finding.id})`);
      console.log(`   Field: ${finding.field}`);
      console.log(`   Value: ${finding.value}`);
      console.log(`   Contains control chars: ${finding.hasControlChars ? 'YES ⚠️' : 'NO'}`);
      console.log('');
    });
    
    console.log('⚠️  RECOMMENDED ACTIONS:');
    console.log('1. Review each finding to determine if it\'s legitimate data or malicious');
    console.log('2. For malicious entries, manually update them in the database');
    console.log('3. All future imports/exports are now protected by the hardened sanitizer');
    console.log('');
  }
  
  console.log('='.repeat(80) + '\n');
  
  // Log findings to file
  if (allFindings.length > 0) {
    appLogger.warn('Dangerous formulas detected in database', {
      service: 'security-scan',
      count: allFindings.length,
      findings: allFindings
    });
  }
  
  process.exit(0);
}

// Run the detection
detectDangerousFormulas().catch(error => {
  console.error('Error running detection script:', error);
  process.exit(1);
});
