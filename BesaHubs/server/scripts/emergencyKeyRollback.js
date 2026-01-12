#!/usr/bin/env node

/**
 * Emergency PII Encryption Key Rollback System
 * 
 * CRITICAL USE ONLY:
 * This script reverts a failed key rotation by re-encrypting all PII fields
 * back to the previous encryption key. Use only when rotation fails mid-process
 * and the system is in an inconsistent state.
 * 
 * PREREQUISITES:
 * - Database backup from before rotation
 * - Previous encryption key available
 * - Current (failed) encryption key
 * - Rotation ID from failed rotation
 * 
 * USAGE:
 *   node server/scripts/emergencyKeyRollback.js \
 *     --failed-key "new-key-that-failed" \
 *     --restore-key "old-working-key" \
 *     --rotation-id "rotation-1234567890" \
 *     --confirm-rollback
 * 
 * SAFETY:
 * - Requires explicit --confirm-rollback flag
 * - Creates backup before rollback
 * - Uses rotation_progress table to track state
 * - Full audit trail of rollback operation
 */

const { Sequelize } = require('sequelize');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const args = parseArgs(process.argv.slice(2));
const rollbackId = `rollback-${Date.now()}`;
const logFile = path.join(__dirname, '../logs', `emergency-rollback-${rollbackId}.log`);

const rollbackLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: logFile }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

const TABLE_CONFIG = {
  users: {
    table: 'users',
    fields: ['email'],
    idField: 'id'
  },
  contacts: {
    table: 'contacts',
    fields: ['primary_email', 'secondary_email', 'primary_phone', 'secondary_phone', 'mobile_phone', 'fax'],
    idField: 'id'
  },
  companies: {
    table: 'companies',
    fields: ['primary_email', 'primary_phone', 'fax', 'tax_id'],
    idField: 'id'
  }
};

async function main() {
  const startTime = Date.now();

  try {
    rollbackLogger.warn('🚨 EMERGENCY KEY ROLLBACK INITIATED', {
      rollbackId,
      rotationId: args.rotationId,
      timestamp: new Date().toISOString()
    });

    if (!args.confirmRollback) {
      rollbackLogger.error('❌ Rollback requires explicit confirmation');
      console.error('\n⚠️  EMERGENCY ROLLBACK REQUIRES CONFIRMATION\n');
      console.error('Add --confirm-rollback flag to proceed with rollback\n');
      console.error('This operation will:');
      console.error('  1. Create emergency database backup');
      console.error('  2. Re-encrypt all PII fields with restore key');
      console.error('  3. Update rotation_progress status\n');
      process.exit(1);
    }

    if (!args.failedKey || !args.restoreKey) {
      throw new Error('Both --failed-key and --restore-key are required');
    }

    if (args.failedKey === args.restoreKey) {
      throw new Error('Failed key and restore key must be different');
    }

    await sequelize.authenticate();
    rollbackLogger.info('✅ Database connection established');

    const failedKeyHash = hashKey(args.failedKey);
    const restoreKeyHash = hashKey(args.restoreKey);

    rollbackLogger.warn('🔑 Rollback key hashes', {
      failedKeyHash: failedKeyHash.substring(0, 16) + '...',
      restoreKeyHash: restoreKeyHash.substring(0, 16) + '...'
    });

    if (args.rotationId) {
      const rotationStatus = await checkRotationStatus(args.rotationId);
      rollbackLogger.info('📋 Original rotation status', rotationStatus);
    }

    rollbackLogger.info('💾 Creating emergency backup before rollback...');
    const backupFile = await createEmergencyBackup();
    rollbackLogger.info(`✅ Emergency backup created: ${backupFile}`);

    for (const [tableName, config] of Object.entries(TABLE_CONFIG)) {
      await rollbackTableKeys(
        tableName,
        config,
        args.failedKey,
        args.restoreKey,
        failedKeyHash,
        restoreKeyHash
      );
    }

    if (args.rotationId) {
      await markRotationRolledBack(args.rotationId, rollbackId);
    }

    const duration = Date.now() - startTime;
    rollbackLogger.warn('✅ EMERGENCY ROLLBACK COMPLETED', {
      rollbackId,
      duration: `${duration}ms`,
      backupFile
    });

    rollbackLogger.info('⚠️  NEXT STEPS:');
    rollbackLogger.info('1. Verify application is working with restored key');
    rollbackLogger.info('2. Update ENCRYPTION_KEY to restore key in production');
    rollbackLogger.info('3. Investigate root cause of rotation failure');
    rollbackLogger.info(`4. Backup file saved at: ${backupFile}`);

    process.exit(0);
  } catch (error) {
    rollbackLogger.error('❌ Emergency rollback failed', {
      rollbackId,
      error: error.message,
      stack: error.stack
    });
    
    rollbackLogger.error('🚨 CRITICAL: Manual intervention required!');
    rollbackLogger.error('Contact database administrator immediately');
    
    process.exit(1);
  }
}

async function rollbackTableKeys(tableName, config, failedKey, restoreKey, failedKeyHash, restoreKeyHash) {
  const { table, fields, idField } = config;
  
  rollbackLogger.info(`🔄 Rolling back table: ${table}`);

  const totalRecords = await getTotalRecords(table, fields);
  
  if (totalRecords === 0) {
    rollbackLogger.info(`ℹ️  No records to rollback in ${table}`);
    return;
  }

  rollbackLogger.info(`📊 Found ${totalRecords} records in ${table}`);

  let processedCount = 0;
  let failedCount = 0;
  let lastCheckpointId = null;
  const batchSize = 50;

  while (processedCount < totalRecords) {
    const batch = await fetchBatch(table, fields, idField, lastCheckpointId, batchSize);
    
    if (batch.length === 0) break;

    rollbackLogger.info(`🔄 Processing rollback batch`, {
      table,
      batchSize: batch.length,
      progress: `${processedCount}/${totalRecords}`
    });

    const batchResult = await processRollbackBatch(
      table,
      fields,
      idField,
      batch,
      failedKey,
      restoreKey
    );

    processedCount += batchResult.processed;
    failedCount += batchResult.failed;
    lastCheckpointId = batch[batch.length - 1][idField];

    if (batchResult.failed > 0) {
      rollbackLogger.error(`❌ Rollback batch had failures`, {
        table,
        failed: batchResult.failed,
        errors: batchResult.errors
      });
      throw new Error(`Rollback failed for ${batchResult.failed} records in ${table}`);
    }
  }

  rollbackLogger.info(`✅ Completed rollback for ${table}`, {
    total: totalRecords,
    processed: processedCount,
    failed: failedCount
  });
}

async function processRollbackBatch(table, fields, idField, batch, failedKey, restoreKey) {
  const result = {
    processed: 0,
    failed: 0,
    errors: []
  };

  const transaction = await sequelize.transaction();

  try {
    for (const record of batch) {
      try {
        const updateFields = {};
        let needsRollback = false;

        for (const field of fields) {
          if (record[field] && Buffer.isBuffer(record[field])) {
            let decrypted = null;
            
            decrypted = await decryptWithKey(record[field], failedKey);
            
            if (!decrypted) {
              decrypted = await decryptWithKey(record[field], restoreKey);
              
              if (decrypted) {
                rollbackLogger.debug(`Record ${record[idField]} field ${field} already using restore key`);
                continue;
              } else {
                throw new Error(`Cannot decrypt ${field} with either key`);
              }
            }

            needsRollback = true;
            const reencrypted = await encryptWithKey(decrypted, restoreKey);
            updateFields[field] = reencrypted;
          }
        }

        if (needsRollback) {
          const setClause = Object.keys(updateFields)
            .map(field => `${field} = :${field}`)
            .join(', ');

          if (setClause) {
            await sequelize.query(
              `UPDATE ${table} SET ${setClause} WHERE ${idField} = :id`,
              {
                replacements: { ...updateFields, id: record[idField] },
                transaction
              }
            );
          }
        }

        result.processed++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          recordId: record[idField],
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        throw error;
      }
    }

    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function createEmergencyBackup() {
  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `emergency-backup-${timestamp}.sql`);

  try {
    const dbUrl = new URL(process.env.DATABASE_URL);
    const command = `PGPASSWORD="${dbUrl.password}" pg_dump -h ${dbUrl.hostname} -p ${dbUrl.port || 5432} -U ${dbUrl.username} -d ${dbUrl.pathname.slice(1)} -F c -f ${backupFile}`;
    
    await execAsync(command);
    return backupFile;
  } catch (error) {
    rollbackLogger.error('Backup creation failed:', error);
    throw new Error(`Failed to create emergency backup: ${error.message}`);
  }
}

async function checkRotationStatus(rotationId) {
  const [progress] = await sequelize.query(
    `SELECT * FROM rotation_progress WHERE rotation_id = :rotationId`,
    {
      replacements: { rotationId },
      type: Sequelize.QueryTypes.SELECT
    }
  );

  return progress || { status: 'not_found' };
}

async function markRotationRolledBack(rotationId, rollbackId) {
  await sequelize.query(
    `UPDATE rotation_progress 
     SET status = 'rolled_back', 
         metadata = metadata || jsonb_build_object('rollback_id', :rollbackId, 'rolled_back_at', NOW()),
         updated_at = NOW()
     WHERE rotation_id = :rotationId`,
    {
      replacements: { rotationId, rollbackId }
    }
  );
}

async function decryptWithKey(encryptedValue, key) {
  try {
    const query = 'SELECT pgp_sym_decrypt($1, $2) as decrypted';
    const result = await sequelize.query(query, {
      bind: [encryptedValue, key],
      type: Sequelize.QueryTypes.SELECT
    });
    return result[0]?.decrypted;
  } catch (error) {
    return null;
  }
}

async function encryptWithKey(value, key) {
  try {
    const query = 'SELECT pgp_sym_encrypt($1, $2) as encrypted';
    const result = await sequelize.query(query, {
      bind: [value, key],
      type: Sequelize.QueryTypes.SELECT
    });
    return result[0]?.encrypted;
  } catch (error) {
    rollbackLogger.error('Encryption error:', { error: error.message });
    throw error;
  }
}

async function getTotalRecords(table, fields) {
  const conditions = fields.map(field => `${field} IS NOT NULL`).join(' OR ');
  const query = `SELECT COUNT(*) as count FROM ${table} WHERE ${conditions}`;
  const result = await sequelize.query(query, {
    type: Sequelize.QueryTypes.SELECT
  });
  return parseInt(result[0].count);
}

async function fetchBatch(table, fields, idField, lastCheckpointId, batchSize) {
  const fieldsList = [idField, ...fields].join(', ');
  const conditions = fields.map(field => `${field} IS NOT NULL`).join(' OR ');
  
  let query = `SELECT ${fieldsList} FROM ${table} WHERE (${conditions})`;
  
  if (lastCheckpointId) {
    query += ` AND ${idField} > :lastCheckpointId`;
  }
  
  query += ` ORDER BY ${idField} LIMIT :batchSize`;
  
  const result = await sequelize.query(query, {
    replacements: { lastCheckpointId, batchSize },
    type: Sequelize.QueryTypes.SELECT
  });
  
  return result;
}

function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

function parseArgs(args) {
  const parsed = {
    failedKey: null,
    restoreKey: null,
    rotationId: null,
    confirmRollback: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--failed-key':
        parsed.failedKey = args[++i];
        break;
      case '--restore-key':
        parsed.restoreKey = args[++i];
        break;
      case '--rotation-id':
        parsed.rotationId = args[++i];
        break;
      case '--confirm-rollback':
        parsed.confirmRollback = true;
        break;
      case '--help':
        console.log(`
Emergency PII Encryption Key Rollback Tool

⚠️  CRITICAL USE ONLY - Use when key rotation fails mid-process

Usage:
  node server/scripts/emergencyKeyRollback.js [options]

Options:
  --failed-key <key>      New key that failed during rotation (required)
  --restore-key <key>     Previous working key to restore (required)
  --rotation-id <id>      Original rotation ID (optional)
  --confirm-rollback      Explicit confirmation required (required)
  --help                  Show this help message

Example:
  node server/scripts/emergencyKeyRollback.js \\
    --failed-key "new-key-that-failed" \\
    --restore-key "old-working-key" \\
    --rotation-id "rotation-1234567890" \\
    --confirm-rollback
        `);
        process.exit(0);
    }
  }

  return parsed;
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
