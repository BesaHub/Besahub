/**
 * Data Masking Utilities
 * 
 * Provides reusable functions to mask sensitive PII data in logs, API responses,
 * and audit trails. All masking functions preserve data format while hiding
 * sensitive information.
 * 
 * SECURITY: These functions should be used in all logging, auditing, and
 * non-essential API responses to prevent accidental exposure of PII.
 */

/**
 * Mask credit card number - show only last 4 digits
 * @param {string} value - Credit card number
 * @returns {string} Masked value (e.g., "****-****-****-1234")
 * 
 * @example
 * maskCreditCard("4532-1234-5678-9010") // Returns "****-****-****-9010"
 * maskCreditCard("4532123456789010")     // Returns "************9010"
 */
const maskCreditCard = (value) => {
  if (!value || typeof value !== 'string') return value;
  
  const cleaned = value.replace(/\s/g, '');
  
  if (cleaned.length < 13 || cleaned.length > 19) {
    return '[REDACTED]';
  }
  
  const last4 = cleaned.slice(-4);
  const hasDashes = value.includes('-');
  
  if (hasDashes) {
    return `****-****-****-${last4}`;
  }
  
  return '*'.repeat(cleaned.length - 4) + last4;
};

/**
 * Mask SSN/Tax ID - show only last 4 digits
 * @param {string} value - SSN in format XXX-XX-XXXX
 * @returns {string} Masked value (e.g., "***-**-1234")
 * 
 * @example
 * maskSSN("123-45-6789") // Returns "***-**-6789"
 * maskSSN("123456789")   // Returns "*****6789"
 */
const maskSSN = (value) => {
  if (!value || typeof value !== 'string') return value;
  
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length !== 9) {
    return '[REDACTED]';
  }
  
  const last4 = cleaned.slice(-4);
  const hasDashes = value.includes('-');
  
  if (hasDashes) {
    return `***-**-${last4}`;
  }
  
  return '*****' + last4;
};

/**
 * Mask email address - show first character and domain
 * @param {string} value - Email address
 * @returns {string} Masked value (e.g., "j***@example.com")
 * 
 * @example
 * maskEmail("john.doe@example.com") // Returns "j***@example.com"
 * maskEmail("a@test.co")            // Returns "a***@test.co"
 */
const maskEmail = (value) => {
  if (!value || typeof value !== 'string' || !value.includes('@')) {
    return '[REDACTED]';
  }
  
  const [localPart, domain] = value.split('@');
  
  if (!localPart || !domain) {
    return '[REDACTED]';
  }
  
  const firstChar = localPart[0];
  return `${firstChar}***@${domain}`;
};

/**
 * Mask phone number - show only last 4 digits
 * @param {string} value - Phone number
 * @returns {string} Masked value (e.g., "***-***-1234")
 * 
 * @example
 * maskPhone("555-123-4567")   // Returns "***-***-4567"
 * maskPhone("+1 555-123-4567") // Returns "+* ***-***-4567"
 * maskPhone("5551234567")      // Returns "*******4567"
 */
const maskPhone = (value) => {
  if (!value || typeof value !== 'string') return value;
  
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length < 7 || cleaned.length > 15) {
    return '[REDACTED]';
  }
  
  const last4 = cleaned.slice(-4);
  const hasInternational = value.trim().startsWith('+');
  const hasDashes = value.includes('-');
  
  if (hasInternational && hasDashes) {
    return `+* ***-***-${last4}`;
  }
  
  if (hasDashes) {
    return `***-***-${last4}`;
  }
  
  return '*'.repeat(cleaned.length - 4) + last4;
};

/**
 * Mask any sensitive value - generic masker
 * @param {string} value - Any sensitive value
 * @param {number} visibleChars - Number of characters to show at the end (default: 4)
 * @returns {string} Masked value
 * 
 * @example
 * maskGeneric("secret123456", 4) // Returns "********3456"
 */
const maskGeneric = (value, visibleChars = 4) => {
  if (!value || typeof value !== 'string') return value;
  
  if (value.length <= visibleChars) {
    return '*'.repeat(value.length);
  }
  
  const visible = value.slice(-visibleChars);
  return '*'.repeat(value.length - visibleChars) + visible;
};

/**
 * Auto-detect and mask sensitive data patterns in text
 * @param {string} text - Text that may contain sensitive data
 * @returns {string} Text with sensitive patterns masked
 * 
 * Patterns detected:
 * - Credit card numbers (13-19 digits with optional spaces/dashes)
 * - SSN (XXX-XX-XXXX or 9 digits)
 * - Email addresses
 * - Phone numbers (US format)
 */
const maskSensitivePatterns = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  let maskedText = text;
  
  // Mask credit card numbers (4 groups of 4 digits, with optional spaces or dashes)
  maskedText = maskedText.replace(
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    (match) => maskCreditCard(match)
  );
  
  // Mask SSN patterns (XXX-XX-XXXX)
  maskedText = maskedText.replace(
    /\b\d{3}-\d{2}-\d{4}\b/g,
    (match) => maskSSN(match)
  );
  
  // Mask 9-digit sequences that might be SSN without dashes
  maskedText = maskedText.replace(
    /\b\d{9}\b/g,
    (match) => maskSSN(match)
  );
  
  // Mask email addresses
  maskedText = maskedText.replace(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    (match) => maskEmail(match)
  );
  
  // Mask US phone numbers (various formats)
  maskedText = maskedText.replace(
    /\b(?:\+?1[-.]?)?\(?(\d{3})\)?[-.]?(\d{3})[-.]?(\d{4})\b/g,
    (match) => maskPhone(match)
  );
  
  return maskedText;
};

/**
 * Recursively mask sensitive fields in objects
 * @param {Object|Array} data - Data object or array
 * @param {Array<string>} sensitiveFields - Field names to mask
 * @returns {Object|Array} Object with masked sensitive fields
 * 
 * @example
 * const data = { name: "John", ssn: "123-45-6789", email: "john@test.com" };
 * maskObjectFields(data, ['ssn', 'email'])
 * // Returns { name: "John", ssn: "***-**-6789", email: "j***@test.com" }
 */
const maskObjectFields = (data, sensitiveFields = []) => {
  if (!data || typeof data !== 'object') return data;
  
  const defaultSensitiveFields = [
    'password', 'ssn', 'taxId', 'creditCard', 'cvv', 'pin',
    'mfaSecret', 'token', 'apiKey', 'secret'
  ];
  
  const fieldsToMask = [...defaultSensitiveFields, ...sensitiveFields];
  const masked = Array.isArray(data) ? [...data] : { ...data };
  
  for (const key in masked) {
    const lowerKey = key.toLowerCase();
    
    if (fieldsToMask.some(field => lowerKey.includes(field.toLowerCase()))) {
      // Determine masking strategy based on field name
      if (lowerKey.includes('ssn') || lowerKey.includes('taxid')) {
        masked[key] = maskSSN(String(masked[key]));
      } else if (lowerKey.includes('email')) {
        masked[key] = maskEmail(String(masked[key]));
      } else if (lowerKey.includes('phone') || lowerKey.includes('mobile')) {
        masked[key] = maskPhone(String(masked[key]));
      } else if (lowerKey.includes('card') || lowerKey.includes('credit')) {
        masked[key] = maskCreditCard(String(masked[key]));
      } else {
        masked[key] = '[REDACTED]';
      }
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskObjectFields(masked[key], sensitiveFields);
    }
  }
  
  return masked;
};

/**
 * Check if a string contains sensitive data patterns
 * @param {string} text - Text to check
 * @returns {boolean} True if sensitive patterns detected
 */
const containsSensitiveData = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  const patterns = [
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,  // Credit card
    /\b\d{3}-\d{2}-\d{4}\b/,                          // SSN
    /\b\d{9}\b/,                                      // SSN without dashes
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    /\b(?:\+?1[-.]?)?\(?(\d{3})\)?[-.]?(\d{3})[-.]?(\d{4})\b/ // Phone
  ];
  
  return patterns.some(pattern => pattern.test(text));
};

module.exports = {
  maskCreditCard,
  maskSSN,
  maskEmail,
  maskPhone,
  maskGeneric,
  maskSensitivePatterns,
  maskObjectFields,
  containsSensitiveData
};
