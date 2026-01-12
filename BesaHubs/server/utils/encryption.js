/**
 * Database-Level Encryption Utilities using PostgreSQL pgcrypto
 * 
 * SECURITY:
 * - Uses Postgres pgp_sym_encrypt() and pgp_sym_decrypt() functions
 * - Encryption key from environment variable ENCRYPTION_KEY
 * - Encrypts PII at rest (email, phone, SSN, tax IDs)
 * - Transparent encryption/decryption in Sequelize hooks
 * 
 * LIMITATIONS:
 * - Encrypted fields cannot be used in WHERE clauses without decryption
 * - Searching encrypted fields requires full table scan with decryption
 * - Consider using hash-based lookups for searchable encrypted fields
 * 
 * PERFORMANCE:
 * - Encryption happens at database level (minimal app overhead)
 * - Decryption happens in-memory after retrieval
 * - Balance security with query performance requirements
 */

const { sequelize } = require('../config/database');
const { appLogger } = require('../config/logger');

/**
 * Get encryption key from environment
 * Validates key meets minimum security requirements
 */
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required for PII encryption');
  }
  
  if (key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long for security');
  }
  
  return key;
};

/**
 * Encrypt a value using PostgreSQL pgcrypto
 * @param {string} value - Plain text value to encrypt
 * @returns {Promise<Buffer>} Encrypted value as buffer
 */
const encryptValue = async (value) => {
  if (!value) return null;
  
  try {
    const key = getEncryptionKey();
    const query = `SELECT pgp_sym_encrypt($1, $2) as encrypted`;
    const result = await sequelize.query(query, {
      bind: [value, key],
      type: sequelize.QueryTypes.SELECT,
      raw: true
    });
    
    return result[0].encrypted;
  } catch (error) {
    appLogger.error('Encryption error:', { error: error.message });
    throw new Error('Failed to encrypt value');
  }
};

/**
 * Decrypt a value using PostgreSQL pgcrypto
 * @param {Buffer|string} value - Encrypted value
 * @returns {Promise<string>} Decrypted plain text value
 */
const decryptValue = async (value) => {
  if (!value) return null;
  
  try {
    const key = getEncryptionKey();
    const query = `SELECT pgp_sym_decrypt($1, $2) as decrypted`;
    const result = await sequelize.query(query, {
      bind: [value, key],
      type: sequelize.QueryTypes.SELECT,
      raw: true
    });
    
    return result[0].decrypted;
  } catch (error) {
    appLogger.error('Decryption error:', { error: error.message });
    throw new Error('Failed to decrypt value');
  }
};

/**
 * Encrypt multiple fields in an object
 * @param {Object} data - Data object with fields to encrypt
 * @param {Array<string>} fields - Field names to encrypt
 * @returns {Promise<Object>} Object with encrypted fields
 */
const encryptFields = async (data, fields) => {
  const encrypted = { ...data };
  
  for (const field of fields) {
    if (encrypted[field] !== undefined && encrypted[field] !== null) {
      encrypted[field] = await encryptValue(String(encrypted[field]));
    }
  }
  
  return encrypted;
};

/**
 * Decrypt multiple fields in an object
 * @param {Object} data - Data object with encrypted fields
 * @param {Array<string>} fields - Field names to decrypt
 * @returns {Promise<Object>} Object with decrypted fields
 */
const decryptFields = async (data, fields) => {
  if (!data) return data;
  
  const decrypted = { ...data };
  
  for (const field of fields) {
    if (decrypted[field] !== undefined && decrypted[field] !== null) {
      try {
        decrypted[field] = await decryptValue(decrypted[field]);
      } catch (error) {
        appLogger.warn(`Failed to decrypt field ${field}:`, error.message);
        // Keep encrypted value if decryption fails
      }
    }
  }
  
  return decrypted;
};

/**
 * Create a searchable hash for encrypted fields
 * Allows lookup without decryption (one-way hash)
 * @param {string} value - Value to hash
 * @returns {string} SHA-256 hash
 */
const createSearchableHash = (value) => {
  if (!value) return null;
  
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(String(value)).digest('hex');
};

/**
 * Encryption hooks for Sequelize models
 * Usage: Add these to your model's hooks configuration
 */
const createEncryptionHooks = (fieldsToEncrypt = []) => {
  return {
    /**
     * Before creating a record, encrypt specified fields
     */
    beforeCreate: async (instance) => {
      for (const field of fieldsToEncrypt) {
        if (instance[field] !== undefined && instance[field] !== null) {
          instance[field] = await encryptValue(String(instance[field]));
        }
      }
    },
    
    /**
     * Before updating a record, encrypt changed fields
     */
    beforeUpdate: async (instance) => {
      for (const field of fieldsToEncrypt) {
        if (instance.changed(field) && instance[field] !== undefined && instance[field] !== null) {
          instance[field] = await encryptValue(String(instance[field]));
        }
      }
    },
    
    /**
     * After finding records, decrypt specified fields
     */
    afterFind: async (result) => {
      if (!result) return;
      
      const decryptInstance = async (instance) => {
        if (!instance) return;
        
        for (const field of fieldsToEncrypt) {
          if (instance[field] !== undefined && instance[field] !== null) {
            try {
              instance[field] = await decryptValue(instance[field]);
            } catch (error) {
              appLogger.warn(`Failed to decrypt ${field} on read:`, error.message);
            }
          }
        }
      };
      
      // Handle both single instance and arrays
      if (Array.isArray(result)) {
        await Promise.all(result.map(decryptInstance));
      } else {
        await decryptInstance(result);
      }
    }
  };
};

/**
 * Validate that pgcrypto extension is available
 * Should be called on app startup
 */
const validatePgcrypto = async () => {
  try {
    const query = `SELECT EXISTS (
      SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'
    ) as has_pgcrypto`;
    
    const result = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
      raw: true
    });
    
    if (!result[0].has_pgcrypto) {
      throw new Error('pgcrypto extension is not enabled in the database');
    }
    
    appLogger.info('✅ pgcrypto extension verified');
    return true;
  } catch (error) {
    appLogger.error('❌ pgcrypto validation failed:', error);
    throw error;
  }
};

module.exports = {
  encryptValue,
  decryptValue,
  encryptFields,
  decryptFields,
  createSearchableHash,
  createEncryptionHooks,
  validatePgcrypto,
  getEncryptionKey
};
