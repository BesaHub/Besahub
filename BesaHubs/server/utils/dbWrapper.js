const { appLogger } = require('../config/logger');

/**
 * Database query wrapper with timeout and fallback support
 * Prevents long-running queries from blocking the application
 */
class DatabaseWrapper {
  /**
   * Execute a database query with timeout protection
   * @param {Function} queryFn - Async function that performs the database query
   * @param {Object} options - Configuration options
   * @param {number} options.timeout - Timeout in milliseconds (default: 5000)
   * @param {*} options.fallback - Fallback value to return on timeout/error
   * @param {string} options.operation - Description of the operation for logging
   * @returns {Promise} Query result or fallback value
   */
  static async query(queryFn, options = {}) {
    const {
      timeout = 5000,
      fallback = null,
      operation = 'database query'
    } = options;

    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), timeout);
      });

      // Race between query and timeout
      const result = await Promise.race([
        queryFn(),
        timeoutPromise
      ]);

      return { success: true, data: result, usingFallback: false };
    } catch (error) {
      // Log the error
      appLogger.warn(`Database operation failed: ${operation}`, {
        error: error.message,
        timeout,
        usingFallback: fallback !== null
      });

      // Return fallback if provided
      if (fallback !== null) {
        appLogger.info(`Using fallback data for: ${operation}`);
        return { success: false, data: fallback, usingFallback: true, error: error.message };
      }

      // Re-throw if no fallback
      throw error;
    }
  }

  /**
   * Check if database is available with quick ping
   * @param {Object} sequelize - Sequelize instance
   * @param {number} timeout - Timeout in milliseconds (default: 3000)
   * @returns {Promise<boolean>} True if database is available
   */
  static async isAvailable(sequelize, timeout = 3000) {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), timeout);
      });

      await Promise.race([
        sequelize.authenticate(),
        timeoutPromise
      ]);

      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = DatabaseWrapper;
