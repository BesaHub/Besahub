const gdprService = require('../services/gdprService');
const { appLogger } = require('../config/logger');

async function processScheduledDeletions() {
  try {
    appLogger.info('🗑️  Starting scheduled account deletions job...');
    
    const results = await gdprService.processScheduledDeletions();
    
    appLogger.info('✅ Scheduled account deletions completed', {
      processed: results.processed,
      succeeded: results.succeeded,
      failed: results.failed,
      errors: results.errors
    });

    if (results.failed > 0) {
      appLogger.warn('⚠️  Some account deletions failed', {
        failedCount: results.failed,
        errors: results.errors
      });
    }

    return results;
  } catch (error) {
    appLogger.error('❌ Error processing scheduled deletions:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

if (require.main === module) {
  processScheduledDeletions()
    .then(() => {
      appLogger.info('Scheduled deletions script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      appLogger.error('Scheduled deletions script failed:', error);
      process.exit(1);
    });
}

module.exports = { processScheduledDeletions };
