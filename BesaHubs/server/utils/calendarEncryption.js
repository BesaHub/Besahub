const crypto = require('crypto');
const { appLogger } = require('../config/logger');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY or JWT_SECRET must be set in environment variables');
  }
  
  return crypto.createHash('sha256').update(key).digest();
};

const encrypt = (text) => {
  try {
    if (!text) {
      throw new Error('Text to encrypt cannot be empty');
    }

    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    const result = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    
    return result;
  } catch (error) {
    appLogger.error('Encryption failed', { error: error.message });
    throw new Error(`Encryption failed: ${error.message}`);
  }
};

const decrypt = (encryptedText) => {
  try {
    if (!encryptedText) {
      throw new Error('Encrypted text cannot be empty');
    }

    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }

    const key = getEncryptionKey();
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    appLogger.error('Decryption failed', { error: error.message });
    throw new Error(`Decryption failed: ${error.message}`);
  }
};

module.exports = {
  encrypt,
  decrypt
};
