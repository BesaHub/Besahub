const cron = require('node-cron');
const crypto = require('crypto');
const { appLogger } = require('../config/logger');
const { checkDBHealth } = require('../config/database');
const { checkRedisHealth } = require('../config/redis');
const { redisClient, isRedisAvailable } = require('../config/redis');
const { createDatabaseBackup } = require('../services/backupService');
const { runTriggerDetection } = require('../services/triggerService');
const { processScheduledDeletions } = require('../scripts/processScheduledDeletions');

let ioInstance = null;

// Job: Clean up old audit logs (run daily at 2 AM)
const cleanupOldLogs = cron.schedule('0 2 * * *', async () => {
  try {
    appLogger.info('Starting scheduled job: cleanup old logs', { service: 'cre-crm-jobs' });
    // Winston rotation already handles this, just log the event
    appLogger.info('Log cleanup completed', { service: 'cre-crm-jobs' });
  } catch (error) {
    appLogger.error('Error in cleanup logs job:', { service: 'cre-crm-jobs', error: error.message });
  }
}, {
  scheduled: false // Don't start immediately
});

// Job: Database health check (run every hour)
const databaseHealthCheck = cron.schedule('0 * * * *', async () => {
  try {
    appLogger.info('Starting scheduled job: database health check', { service: 'cre-crm-jobs' });
    const dbHealth = await checkDBHealth();
    
    if (dbHealth.status === 'unhealthy') {
      appLogger.error('Database health check FAILED', { 
        service: 'cre-crm-jobs', 
        health: dbHealth 
      });
    } else {
      appLogger.info('Database health check passed', { 
        service: 'cre-crm-jobs', 
        responseTime: dbHealth.responseTime,
        activeConnections: dbHealth.activeConnections
      });
    }
  } catch (error) {
    appLogger.error('Error in database health check job:', { service: 'cre-crm-jobs', error: error.message });
  }
}, {
  scheduled: false
});

// Job: Redis health check (run every 30 minutes)
const redisHealthCheck = cron.schedule('*/30 * * * *', async () => {
  try {
    // Skip if Redis is not configured
    if (!redisClient || !isRedisAvailable()) {
      appLogger.debug('Redis health check skipped - Redis not available', { service: 'cre-crm-jobs' });
      return;
    }
    
    appLogger.info('Starting scheduled job: Redis health check', { service: 'cre-crm-jobs' });
    const redisHealth = await checkRedisHealth();
    
    if (redisHealth.status === 'unhealthy') {
      appLogger.warn('Redis health check indicates issues', { 
        service: 'cre-crm-jobs', 
        health: redisHealth 
      });
    } else if (redisHealth.status === 'healthy') {
      appLogger.info('Redis health check passed', { 
        service: 'cre-crm-jobs', 
        responseTime: redisHealth.responseTime
      });
    }
  } catch (error) {
    appLogger.error('Error in Redis health check job:', { service: 'cre-crm-jobs', error: error.message });
  }
}, {
  scheduled: false
});

// Job: Clear expired cache entries (run every 6 hours)
const clearExpiredCache = cron.schedule('0 */6 * * *', async () => {
  try {
    // Skip if Redis is not configured
    if (!redisClient || !isRedisAvailable()) {
      appLogger.debug('Cache cleanup skipped - Redis not available', { service: 'cre-crm-jobs' });
      return;
    }
    
    appLogger.info('Starting scheduled job: clear expired cache', { service: 'cre-crm-jobs' });
    appLogger.info('Redis is handling cache expiration automatically', { service: 'cre-crm-jobs' });
  } catch (error) {
    appLogger.error('Error in clear expired cache job:', { service: 'cre-crm-jobs', error: error.message });
  }
}, {
  scheduled: false
});

// Job: Automated database backup (run daily at 3 AM)
const automatedBackup = cron.schedule('0 3 * * *', async () => {
  try {
    appLogger.info('Starting scheduled job: automated database backup', { service: 'cre-crm-jobs' });
    
    const DatabaseBackup = require('../scripts/backupDatabase');
    const BackupLog = require('../models/BackupLog');
    
    const backup = new DatabaseBackup();
    const result = await backup.run();
    
    // Log backup to database
    if (result.success) {
      await BackupLog.create({
        backupId: result.backupId,
        filePath: result.filePath,
        fileSize: result.metadata.fileSize,
        checksum: result.metadata.checksum,
        encrypted: true,
        status: 'completed',
        retentionExpiresAt: result.metadata.retentionExpiresAt,
        metadata: result.metadata
      });

      appLogger.info('Automated database backup completed successfully', { 
        service: 'cre-crm-jobs',
        backupId: result.backupId,
        size: result.metadata.fileSizeFormatted,
        retention: result.metadata.retentionType
      });

      // Send notification
      if (ioInstance) {
        ioInstance.emit('system:backup-completed', {
          backupId: result.backupId,
          timestamp: new Date(),
          size: result.metadata.fileSizeFormatted
        });
      }
    }
  } catch (error) {
    appLogger.error('Error in automated backup job:', { 
      service: 'cre-crm-jobs', 
      error: error.message,
      stack: error.stack
    });

    // Log failed backup attempt
    try {
      const BackupLog = require('../models/BackupLog');
      await BackupLog.create({
        backupId: `failed-${Date.now()}`,
        filePath: 'N/A',
        status: 'failed',
        errorLog: error.message,
        metadata: { error: error.message }
      });
    } catch (logError) {
      appLogger.error('Failed to log backup error to database:', { 
        service: 'cre-crm-jobs', 
        error: logError.message 
      });
    }
  }
}, {
  scheduled: false
});

// Job: Trigger detection for lease expirations and debt maturities (run daily at 2:30 AM)
const triggerDetection = cron.schedule('30 2 * * *', async () => {
  try {
    appLogger.info('Starting scheduled job: trigger detection', { service: 'cre-crm-jobs' });
    
    const summary = await runTriggerDetection(ioInstance);
    
    appLogger.info('Trigger detection completed successfully', { 
      service: 'cre-crm-jobs',
      scanned: summary.totals.scanned,
      created: summary.totals.created,
      updated: summary.totals.updated,
      errors: summary.totals.errors,
      duration: `${summary.duration}ms`
    });
  } catch (error) {
    appLogger.error('Error in trigger detection job:', { 
      service: 'cre-crm-jobs', 
      error: error.message 
    });
  }
}, {
  scheduled: false
});

// Job: Process scheduled account deletions (GDPR) (run daily at 4 AM)
const scheduledDeletions = cron.schedule('0 4 * * *', async () => {
  try {
    appLogger.info('Starting scheduled job: GDPR account deletions', { service: 'cre-crm-jobs' });
    
    const results = await processScheduledDeletions();
    
    appLogger.info('Scheduled account deletions completed', { 
      service: 'cre-crm-jobs',
      processed: results.processed,
      succeeded: results.succeeded,
      failed: results.failed
    });

    if (results.failed > 0) {
      appLogger.warn('Some scheduled deletions failed', {
        service: 'cre-crm-jobs',
        failedCount: results.failed,
        errors: results.errors
      });
    }
  } catch (error) {
    appLogger.error('Error in scheduled deletions job:', { 
      service: 'cre-crm-jobs', 
      error: error.message 
    });
  }
}, {
  scheduled: false
});

// Job: Weekly restore test (run every Sunday at 5 AM)
const weeklyRestoreTest = cron.schedule('0 5 * * 0', async () => {
  try {
    appLogger.info('Starting scheduled job: weekly restore test', { service: 'cre-crm-jobs' });
    
    const DatabaseRestore = require('../scripts/restoreDatabase');
    const BackupLog = require('../models/BackupLog');
    const { sequelize } = require('../config/database');
    
    // Get latest successful backup
    const latestBackup = await BackupLog.findOne({
      where: { status: 'completed', encrypted: true },
      order: [['createdAt', 'DESC']]
    });

    if (!latestBackup) {
      appLogger.warn('No backups available for restore test', { service: 'cre-crm-jobs' });
      return;
    }

    appLogger.info('Testing restore from latest backup', {
      service: 'cre-crm-jobs',
      backupId: latestBackup.backupId,
      backupDate: latestBackup.createdAt
    });

    // Create test database name
    const testDbName = `restore_test_${Date.now()}`;

    try {
      // Create test database
      await sequelize.query(`CREATE DATABASE ${testDbName};`);
      
      // Restore backup to test database
      const restore = new DatabaseRestore({
        backupFile: latestBackup.filePath,
        targetDb: testDbName,
        confirmRestore: true
      });

      const result = await restore.run();

      if (result.success) {
        appLogger.info('Weekly restore test PASSED', {
          service: 'cre-crm-jobs',
          backupId: latestBackup.backupId,
          testDb: testDbName,
          tablesValidated: Object.keys(result.tableCounts || {}).length
        });

        // Send success notification
        if (ioInstance) {
          ioInstance.emit('system:restore-test-success', {
            backupId: latestBackup.backupId,
            timestamp: new Date(),
            testDb: testDbName
          });
        }
      } else {
        appLogger.error('Weekly restore test FAILED', {
          service: 'cre-crm-jobs',
          backupId: latestBackup.backupId,
          error: 'Restore returned unsuccessful result'
        });
      }
    } catch (restoreError) {
      appLogger.error('Weekly restore test FAILED with error', {
        service: 'cre-crm-jobs',
        backupId: latestBackup.backupId,
        error: restoreError.message,
        stack: restoreError.stack
      });

      // Send failure notification
      if (ioInstance) {
        ioInstance.emit('system:restore-test-failed', {
          backupId: latestBackup.backupId,
          timestamp: new Date(),
          error: restoreError.message
        });
      }
    } finally {
      // Cleanup: Drop test database
      try {
        await sequelize.query(`DROP DATABASE IF EXISTS ${testDbName};`);
        appLogger.info('Test database cleaned up', {
          service: 'cre-crm-jobs',
          testDb: testDbName
        });
      } catch (cleanupError) {
        appLogger.warn('Failed to cleanup test database', {
          service: 'cre-crm-jobs',
          testDb: testDbName,
          error: cleanupError.message
        });
      }
    }
  } catch (error) {
    appLogger.error('Error in weekly restore test job:', {
      service: 'cre-crm-jobs',
      error: error.message,
      stack: error.stack
    });
  }
}, {
  scheduled: false
});

// Job: Quarterly PII encryption key rotation (run on 1st day of Jan, Apr, Jul, Oct at 4 AM)
const quarterlyKeyRotation = cron.schedule('0 4 1 */3 *', async () => {
  try {
    if (!process.env.ROTATION_SCHEDULE || process.env.ROTATION_SCHEDULE !== 'enabled') {
      appLogger.debug('Quarterly key rotation skipped - ROTATION_SCHEDULE not enabled', { service: 'cre-crm-jobs' });
      return;
    }

    appLogger.info('Starting scheduled job: quarterly PII encryption key rotation', { service: 'cre-crm-jobs' });

    const newKey = crypto.randomBytes(32).toString('hex');
    const oldKey = process.env.ENCRYPTION_KEY;

    if (!oldKey) {
      appLogger.error('ENCRYPTION_KEY not found in environment - cannot rotate', { service: 'cre-crm-jobs' });
      return;
    }

    const rotationDate = new Date();
    rotationDate.setDate(rotationDate.getDate() + 7);

    appLogger.warn('🔐 Quarterly key rotation scheduled', {
      service: 'cre-crm-jobs',
      scheduledFor: rotationDate.toISOString(),
      newKeyHash: crypto.createHash('sha256').update(newKey).digest('hex').substring(0, 16) + '...',
      message: 'New encryption key generated - rotation will occur in 7 days'
    });

    if (ioInstance) {
      ioInstance.emit('system:key-rotation-scheduled', {
        scheduledFor: rotationDate,
        message: 'PII encryption key rotation scheduled for ' + rotationDate.toISOString()
      });
    }

    appLogger.info('⚠️  MANUAL ACTION REQUIRED:', {
      service: 'cre-crm-jobs',
      steps: [
        '1. Review the key rotation guide: server/config/KEY_ROTATION_GUIDE.md',
        '2. Test rotation with --dry-run flag first',
        '3. Schedule maintenance window for actual rotation',
        '4. Update ENCRYPTION_KEY in secrets manager after rotation',
        '5. Verify all services can decrypt with new key'
      ]
    });

  } catch (error) {
    appLogger.error('Error in quarterly key rotation job:', { 
      service: 'cre-crm-jobs', 
      error: error.message 
    });
  }
}, {
  scheduled: false
});

// Job: Lease and Debt expiration alerts (run daily at 9 AM)
const leaseDebtAlerts = cron.schedule('0 9 * * *', async () => {
  try {
    appLogger.info('Starting scheduled job: lease/debt expiration alerts', { service: 'cre-crm-jobs' });
    
    const { Op } = require('sequelize');
    const { Lease, Debt, AlertHistory, Property, Contact, Company } = require('../models');
    const notificationService = require('../services/notificationService');
    
    const now = new Date();
    const alertIntervals = [
      { days: 90, type: '90day' },
      { days: 60, type: '60day' },
      { days: 30, type: '30day' },
      { days: 7, type: '7day' }
    ];
    
    let totalAlertsSent = 0;
    const errors = [];
    
    // Process lease expirations
    for (const interval of alertIntervals) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + interval.days);
      
      // Find leases expiring at this interval (within 24-hour window)
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const expiringLeases = await Lease.findAll({
        where: {
          endDate: {
            [Op.between]: [startOfDay, endOfDay]
          },
          status: 'active'
        },
        include: [
          {
            model: Property,
            as: 'property',
            attributes: ['id', 'name', 'address', 'listingAgentId']
          },
          {
            model: Contact,
            as: 'tenant',
            attributes: ['id', 'firstName', 'lastName', 'companyName']
          }
        ]
      });
      
      for (const lease of expiringLeases) {
        try {
          // Check if alert already sent
          const existingAlert = await AlertHistory.findOne({
            where: {
              leaseId: lease.id,
              alertType: interval.type
            }
          });
          
          if (existingAlert) {
            appLogger.debug(`Alert already sent for lease ${lease.id} at ${interval.days} days`, {
              service: 'cre-crm-jobs'
            });
            continue;
          }
          
          // Determine who to notify (listing agent + admins/managers)
          const recipientId = lease.property?.listingAgentId;
          
          if (!recipientId) {
            appLogger.warn(`No listing agent for lease ${lease.id}`, { service: 'cre-crm-jobs' });
            continue;
          }
          
          const tenantName = lease.tenant?.companyName || 
                            `${lease.tenant?.firstName || ''} ${lease.tenant?.lastName || ''}`.trim() ||
                            'Unknown Tenant';
          
          const propertyName = lease.property?.name || lease.property?.address || 'Property';
          
          // Create notification
          const notification = await notificationService.create({
            userId: recipientId,
            type: 'lease_expiration',
            title: `Lease Expiring in ${interval.days} Days`,
            message: `${propertyName} - ${tenantName} lease expires on ${lease.endDate.toLocaleDateString()}. Monthly rent: $${lease.monthlyRent.toLocaleString()}`,
            priority: interval.days <= 30 ? 'high' : 'medium',
            relatedId: lease.id,
            relatedType: 'lease',
            metadata: {
              leaseId: lease.id,
              propertyId: lease.propertyId,
              daysRemaining: interval.days,
              monthlyRent: lease.monthlyRent
            }
          }, ioInstance);
          
          // Record alert in history
          await AlertHistory.create({
            leaseId: lease.id,
            alertType: interval.type,
            sentTo: recipientId,
            notificationId: notification.id,
            sentAt: now
          });
          
          totalAlertsSent++;
          
          appLogger.debug(`Sent ${interval.days}-day lease alert for ${propertyName}`, {
            service: 'cre-crm-jobs',
            leaseId: lease.id,
            recipientId
          });
          
        } catch (leaseError) {
          errors.push({
            type: 'lease',
            id: lease.id,
            error: leaseError.message
          });
          appLogger.error(`Error sending lease alert: ${leaseError.message}`, {
            service: 'cre-crm-jobs',
            leaseId: lease.id
          });
        }
      }
    }
    
    // Process debt maturities
    for (const interval of alertIntervals) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + interval.days);
      
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const maturingDebts = await Debt.findAll({
        where: {
          maturityDate: {
            [Op.between]: [startOfDay, endOfDay]
          }
        },
        include: [
          {
            model: Property,
            as: 'property',
            attributes: ['id', 'name', 'address', 'listingAgentId']
          },
          {
            model: Company,
            as: 'lender',
            attributes: ['id', 'name']
          }
        ]
      });
      
      for (const debt of maturingDebts) {
        try {
          // Check if alert already sent
          const existingAlert = await AlertHistory.findOne({
            where: {
              debtId: debt.id,
              alertType: interval.type
            }
          });
          
          if (existingAlert) {
            appLogger.debug(`Alert already sent for debt ${debt.id} at ${interval.days} days`, {
              service: 'cre-crm-jobs'
            });
            continue;
          }
          
          const recipientId = debt.property?.listingAgentId;
          
          if (!recipientId) {
            appLogger.warn(`No listing agent for debt ${debt.id}`, { service: 'cre-crm-jobs' });
            continue;
          }
          
          const lenderName = debt.lender?.name || 'Unknown Lender';
          const propertyName = debt.property?.name || debt.property?.address || 'Property';
          
          // Create notification
          const notification = await notificationService.create({
            userId: recipientId,
            type: 'debt_maturity',
            title: `Debt Maturing in ${interval.days} Days`,
            message: `${propertyName} - ${debt.loanType} loan from ${lenderName} matures on ${debt.maturityDate.toLocaleDateString()}. Amount: $${debt.amount.toLocaleString()}`,
            priority: interval.days <= 30 ? 'high' : 'medium',
            relatedId: debt.id,
            relatedType: 'debt',
            metadata: {
              debtId: debt.id,
              propertyId: debt.propertyId,
              daysRemaining: interval.days,
              amount: debt.amount,
              loanType: debt.loanType
            }
          }, ioInstance);
          
          // Record alert in history
          await AlertHistory.create({
            debtId: debt.id,
            alertType: interval.type,
            sentTo: recipientId,
            notificationId: notification.id,
            sentAt: now
          });
          
          totalAlertsSent++;
          
          appLogger.debug(`Sent ${interval.days}-day debt alert for ${propertyName}`, {
            service: 'cre-crm-jobs',
            debtId: debt.id,
            recipientId
          });
          
        } catch (debtError) {
          errors.push({
            type: 'debt',
            id: debt.id,
            error: debtError.message
          });
          appLogger.error(`Error sending debt alert: ${debtError.message}`, {
            service: 'cre-crm-jobs',
            debtId: debt.id
          });
        }
      }
    }
    
    appLogger.info('Lease/debt expiration alerts completed', {
      service: 'cre-crm-jobs',
      totalAlertsSent,
      errorCount: errors.length
    });
    
    if (errors.length > 0) {
      appLogger.warn('Some alerts failed to send', {
        service: 'cre-crm-jobs',
        errors: errors.slice(0, 5)
      });
    }
    
  } catch (error) {
    appLogger.error('Error in lease/debt alerts job:', {
      service: 'cre-crm-jobs',
      error: error.message,
      stack: error.stack
    });
  }
}, {
  scheduled: false
});

// Start all scheduled jobs
const startScheduledJobs = () => {
  appLogger.info('🕐 Starting scheduled jobs...', { service: 'cre-crm-jobs' });
  
  cleanupOldLogs.start();
  appLogger.info('✅ Cleanup old logs job scheduled (daily at 2 AM)', { service: 'cre-crm-jobs' });
  
  databaseHealthCheck.start();
  appLogger.info('✅ Database health check scheduled (hourly)', { service: 'cre-crm-jobs' });
  
  redisHealthCheck.start();
  appLogger.info('✅ Redis health check scheduled (every 30 minutes)', { service: 'cre-crm-jobs' });
  
  clearExpiredCache.start();
  appLogger.info('✅ Clear expired cache scheduled (every 6 hours)', { service: 'cre-crm-jobs' });
  
  automatedBackup.start();
  appLogger.info('✅ Automated database backup scheduled (daily at 3 AM)', { service: 'cre-crm-jobs' });
  
  triggerDetection.start();
  appLogger.info('✅ Trigger detection scheduled (daily at 2:30 AM)', { service: 'cre-crm-jobs' });
  
  scheduledDeletions.start();
  appLogger.info('✅ Scheduled account deletions (GDPR) scheduled (daily at 4 AM)', { service: 'cre-crm-jobs' });
  
  weeklyRestoreTest.start();
  appLogger.info('✅ Weekly restore test scheduled (every Sunday at 5 AM)', { service: 'cre-crm-jobs' });
  
  quarterlyKeyRotation.start();
  appLogger.info('✅ Quarterly PII encryption key rotation scheduled (quarterly at 4 AM on 1st of Jan/Apr/Jul/Oct)', { service: 'cre-crm-jobs' });
  
  leaseDebtAlerts.start();
  appLogger.info('✅ Lease/debt expiration alerts scheduled (daily at 9 AM)', { service: 'cre-crm-jobs' });
  
  appLogger.info('🎯 All scheduled jobs started successfully', { service: 'cre-crm-jobs' });
};

// Stop all scheduled jobs (for graceful shutdown)
const stopScheduledJobs = () => {
  appLogger.info('🛑 Stopping scheduled jobs...', { service: 'cre-crm-jobs' });
  
  cleanupOldLogs.stop();
  databaseHealthCheck.stop();
  redisHealthCheck.stop();
  clearExpiredCache.stop();
  automatedBackup.stop();
  triggerDetection.stop();
  scheduledDeletions.stop();
  weeklyRestoreTest.stop();
  quarterlyKeyRotation.stop();
  leaseDebtAlerts.stop();
  
  appLogger.info('✅ All scheduled jobs stopped', { service: 'cre-crm-jobs' });
};

// Set the Socket.IO instance for real-time notifications
const setIoInstance = (io) => {
  ioInstance = io;
  appLogger.info('Socket.IO instance set for scheduled jobs', { service: 'cre-crm-jobs' });
};

module.exports = {
  startScheduledJobs,
  stopScheduledJobs,
  setIoInstance
};
