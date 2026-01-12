/**
 * One-Time Data Migration Script
 * 
 * PURPOSE:
 * Encrypt existing plaintext PII data in the database.
 * This script should be run ONCE when enabling encryption for the first time.
 * 
 * USAGE:
 * 1. Set ENCRYPTION_KEY environment variable (min 32 characters)
 * 2. Run: node server/scripts/encryptExistingData.js
 * 3. Verify successful encryption
 * 4. Do NOT run this script again on already encrypted data
 * 
 * SAFETY:
 * - Processes records in batches to avoid memory issues
 * - Logs progress and errors
 * - Can be re-run safely (skips already encrypted data)
 * 
 * IMPORTANT:
 * - Backup your database before running this script
 * - Test on a development database first
 * - Ensure ENCRYPTION_KEY is securely stored and not lost
 */

require('dotenv').config();
const { sequelize } = require('../config/database');
const { encryptValue } = require('../utils/encryption');
const { appLogger } = require('../config/logger');

// Import models
const User = require('../models/User');
const Contact = require('../models/Contact');
const Company = require('../models/Company');

const BATCH_SIZE = 100;

/**
 * Check if a value is already encrypted (buffer type indicates encryption)
 */
const isEncrypted = (value) => {
  return value && Buffer.isBuffer(value);
};

/**
 * Encrypt User emails
 */
const encryptUsers = async () => {
  console.log('\n📧 Encrypting User emails...');
  
  try {
    // Get all users with plaintext emails (not buffers)
    const users = await User.findAll({
      attributes: ['id', 'email'],
      raw: true
    });
    
    let encrypted = 0;
    let skipped = 0;
    let errors = 0;
    
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      
      for (const user of batch) {
        try {
          // Skip if already encrypted
          if (isEncrypted(user.email)) {
            skipped++;
            continue;
          }
          
          // Encrypt the email
          const encryptedEmail = await encryptValue(user.email);
          
          // Update using raw query to bypass hooks
          await sequelize.query(
            'UPDATE users SET email = $1 WHERE id = $2',
            {
              bind: [encryptedEmail, user.id],
              type: sequelize.QueryTypes.UPDATE
            }
          );
          
          encrypted++;
          
          if (encrypted % 50 === 0) {
            console.log(`   Processed ${encrypted} users...`);
          }
        } catch (error) {
          errors++;
          appLogger.error(`Failed to encrypt user ${user.id}:`, error);
        }
      }
    }
    
    console.log(`✅ Users: ${encrypted} encrypted, ${skipped} skipped, ${errors} errors`);
  } catch (error) {
    console.error('❌ Error encrypting users:', error);
    appLogger.error('User encryption failed:', error);
  }
};

/**
 * Encrypt Contact PII fields
 */
const encryptContacts = async () => {
  console.log('\n📇 Encrypting Contact PII...');
  
  try {
    const contacts = await Contact.findAll({
      attributes: [
        'id', 'primaryEmail', 'secondaryEmail',
        'primaryPhone', 'secondaryPhone', 'mobilePhone', 'fax'
      ],
      raw: true
    });
    
    let encrypted = 0;
    let skipped = 0;
    let errors = 0;
    
    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      const batch = contacts.slice(i, i + BATCH_SIZE);
      
      for (const contact of batch) {
        try {
          const updates = {};
          let hasUpdates = false;
          
          // Encrypt email fields
          if (contact.primaryEmail && !isEncrypted(contact.primaryEmail)) {
            updates.primary_email = await encryptValue(contact.primaryEmail);
            hasUpdates = true;
          }
          if (contact.secondaryEmail && !isEncrypted(contact.secondaryEmail)) {
            updates.secondary_email = await encryptValue(contact.secondaryEmail);
            hasUpdates = true;
          }
          
          // Encrypt phone fields
          if (contact.primaryPhone && !isEncrypted(contact.primaryPhone)) {
            updates.primary_phone = await encryptValue(contact.primaryPhone);
            hasUpdates = true;
          }
          if (contact.secondaryPhone && !isEncrypted(contact.secondaryPhone)) {
            updates.secondary_phone = await encryptValue(contact.secondaryPhone);
            hasUpdates = true;
          }
          if (contact.mobilePhone && !isEncrypted(contact.mobilePhone)) {
            updates.mobile_phone = await encryptValue(contact.mobilePhone);
            hasUpdates = true;
          }
          if (contact.fax && !isEncrypted(contact.fax)) {
            updates.fax = await encryptValue(contact.fax);
            hasUpdates = true;
          }
          
          if (hasUpdates) {
            // Build dynamic UPDATE query
            const setClauses = Object.keys(updates)
              .map((key, idx) => `${key} = $${idx + 1}`)
              .join(', ');
            
            const values = Object.values(updates);
            values.push(contact.id);
            
            await sequelize.query(
              `UPDATE contacts SET ${setClauses} WHERE id = $${values.length}`,
              {
                bind: values,
                type: sequelize.QueryTypes.UPDATE
              }
            );
            
            encrypted++;
          } else {
            skipped++;
          }
          
          if ((encrypted + skipped) % 50 === 0) {
            console.log(`   Processed ${encrypted + skipped} contacts...`);
          }
        } catch (error) {
          errors++;
          appLogger.error(`Failed to encrypt contact ${contact.id}:`, error);
        }
      }
    }
    
    console.log(`✅ Contacts: ${encrypted} encrypted, ${skipped} skipped, ${errors} errors`);
  } catch (error) {
    console.error('❌ Error encrypting contacts:', error);
    appLogger.error('Contact encryption failed:', error);
  }
};

/**
 * Encrypt Company PII fields
 */
const encryptCompanies = async () => {
  console.log('\n🏢 Encrypting Company PII...');
  
  try {
    const companies = await Company.findAll({
      attributes: ['id', 'primaryEmail', 'primaryPhone', 'fax', 'taxId'],
      raw: true
    });
    
    let encrypted = 0;
    let skipped = 0;
    let errors = 0;
    
    for (let i = 0; i < companies.length; i += BATCH_SIZE) {
      const batch = companies.slice(i, i + BATCH_SIZE);
      
      for (const company of batch) {
        try {
          const updates = {};
          let hasUpdates = false;
          
          // Encrypt email
          if (company.primaryEmail && !isEncrypted(company.primaryEmail)) {
            updates.primary_email = await encryptValue(company.primaryEmail);
            hasUpdates = true;
          }
          
          // Encrypt phone fields
          if (company.primaryPhone && !isEncrypted(company.primaryPhone)) {
            updates.primary_phone = await encryptValue(company.primaryPhone);
            hasUpdates = true;
          }
          if (company.fax && !isEncrypted(company.fax)) {
            updates.fax = await encryptValue(company.fax);
            hasUpdates = true;
          }
          
          // Encrypt tax ID
          if (company.taxId && !isEncrypted(company.taxId)) {
            updates.tax_id = await encryptValue(company.taxId);
            hasUpdates = true;
          }
          
          if (hasUpdates) {
            // Build dynamic UPDATE query
            const setClauses = Object.keys(updates)
              .map((key, idx) => `${key} = $${idx + 1}`)
              .join(', ');
            
            const values = Object.values(updates);
            values.push(company.id);
            
            await sequelize.query(
              `UPDATE companies SET ${setClauses} WHERE id = $${values.length}`,
              {
                bind: values,
                type: sequelize.QueryTypes.UPDATE
              }
            );
            
            encrypted++;
          } else {
            skipped++;
          }
          
          if ((encrypted + skipped) % 50 === 0) {
            console.log(`   Processed ${encrypted + skipped} companies...`);
          }
        } catch (error) {
          errors++;
          appLogger.error(`Failed to encrypt company ${company.id}:`, error);
        }
      }
    }
    
    console.log(`✅ Companies: ${encrypted} encrypted, ${skipped} skipped, ${errors} errors`);
  } catch (error) {
    console.error('❌ Error encrypting companies:', error);
    appLogger.error('Company encryption failed:', error);
  }
};

/**
 * Main migration function
 */
const runMigration = async () => {
  console.log('🔐 Starting PII Encryption Migration');
  console.log('=====================================\n');
  
  // Validate encryption key
  if (!process.env.ENCRYPTION_KEY) {
    console.error('❌ ENCRYPTION_KEY environment variable is required');
    process.exit(1);
  }
  
  if (process.env.ENCRYPTION_KEY.length < 32) {
    console.error('❌ ENCRYPTION_KEY must be at least 32 characters long');
    process.exit(1);
  }
  
  console.log('✅ Encryption key validated');
  console.log(`   Key length: ${process.env.ENCRYPTION_KEY.length} characters\n`);
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');
    
    // Run encryption for each model
    await encryptUsers();
    await encryptContacts();
    await encryptCompanies();
    
    console.log('\n=====================================');
    console.log('✅ Migration completed successfully!');
    console.log('\nIMPORTANT:');
    console.log('- Verify encrypted data can be read correctly');
    console.log('- Keep ENCRYPTION_KEY secure and backed up');
    console.log('- Do NOT run this script again on encrypted data');
    console.log('=====================================\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    appLogger.error('Encryption migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// Run migration if executed directly
if (require.main === module) {
  runMigration().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runMigration };
