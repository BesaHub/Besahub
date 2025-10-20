/**
 * CSV Formula Injection Protection Utility
 * 
 * Prevents CSV injection attacks (CWE-1236) by sanitizing cell values
 * that start with dangerous prefixes commonly used in formula injection.
 * 
 * @see https://owasp.org/www-community/attacks/CSV_Injection
 */

/**
 * Sanitizes a cell value to prevent CSV formula injection attacks
 * Removes control/zero-width characters and escapes cells starting with dangerous prefixes
 * 
 * SECURITY: Prevents bypass via zero-width characters (CWE-1236)
 * - Removes: U+0000-U+001F, U+007F-U+009F (control chars)
 * - Removes: U+200B-U+200F, U+2028-U+202F, U+FEFF (zero-width chars)
 * - Then checks for dangerous prefixes: = + - @ | % \t \r
 * 
 * @param {*} value - The cell value to sanitize
 * @returns {*} - Sanitized value or original if safe
 */
function sanitizeCSVCell(value) {
  if (value === null || value === undefined) {
    return value;
  }
  
  // ONLY sanitize strings - leave numbers, booleans, objects unchanged
  if (typeof value !== 'string') {
    return value;
  }
  
  // Remove control and zero-width characters (but preserve intentional spaces)
  // This includes: U+0000-U+001F, U+007F-U+009F, U+200B-U+200F, U+2028-U+202F, U+FEFF
  const cleanedValue = value.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202F\uFEFF]/g, '');
  
  // Check first character AFTER trimming (for detection only)
  const trimmedForCheck = cleanedValue.trim();
  
  if (trimmedForCheck === '') {
    return cleanedValue;  // Return empty or whitespace-only string with original spacing
  }
  
  const firstChar = trimmedForCheck.charAt(0);
  const dangerousChars = ['=', '+', '-', '@', '|', '%', '\t', '\r'];
  
  if (dangerousChars.includes(firstChar)) {
    // Escape the ORIGINAL cleaned value (with spaces preserved)
    return "'" + cleanedValue;
  }
  
  // Return cleaned value WITH original spacing
  return cleanedValue;
}

/**
 * Sanitizes an entire row object by sanitizing all string values
 * 
 * @param {Object} row - Row object with key-value pairs
 * @returns {Object} - Sanitized row object
 */
function sanitizeCSVRow(row) {
  const sanitized = {};
  for (const [key, value] of Object.entries(row)) {
    sanitized[key] = sanitizeCSVCell(value);
  }
  return sanitized;
}

module.exports = { sanitizeCSVCell, sanitizeCSVRow };
