# BesaHubs CRM - Disaster Recovery Guide

## Overview

This guide provides comprehensive instructions for backup and restore operations for the BesaHubs CRM database. The disaster recovery system implements enterprise-grade security with AES-256-GCM encryption, automated backups, and validated restore testing.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Backup Operations](#backup-operations)
3. [Restore Operations](#restore-operations)
4. [Scheduled Jobs](#scheduled-jobs)
5. [Retention Policy](#retention-policy)
6. [Emergency Procedures](#emergency-procedures)
7. [Testing & Validation](#testing--validation)
8. [Troubleshooting](#troubleshooting)

---

## System Architecture

### Components

- **Backup Script**: `server/scripts/backupDatabase.js`
- **Restore Script**: `server/scripts/restoreDatabase.js`
- **Scheduled Jobs**: `server/jobs/scheduledJobs.js`
- **Backup Storage**: `server/backups/` (local) or S3/Glacier (production)
- **Backup Log Table**: `backup_logs` (tracks all backup operations)

### Encryption

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Source**: `BACKUP_ENCRYPTION_KEY` environment variable
- **Key Length**: 64 hex characters (32 bytes)
- **Authentication**: Built-in auth tag for integrity verification

### File Structure

```
server/backups/
├── backup-2025-10-01-03-00-00.sql.gz.enc    # Encrypted backup
├── backup-2025-10-01-03-00-00.meta.json     # Metadata
├── backup-2025-10-02-03-00-00.sql.gz.enc
├── backup-2025-10-02-03-00-00.meta.json
└── emergency/                                # Emergency backups before restore
    └── backup-2025-10-01-12-30-00.sql.gz.enc
```

---

## Backup Operations

### Manual Backup

#### Create a Full Backup

```bash
# Basic backup (uses env variables)
node server/scripts/backupDatabase.js

# Specify custom output directory
node server/scripts/backupDatabase.js \
  --output-dir /custom/backup/path

# Use custom encryption key
node server/scripts/backupDatabase.js \
  --encryption-key "your-64-character-hex-key"

# List all backups without creating new one
node server/scripts/backupDatabase.js --metadata-only
```

#### Backup Process Flow

1. **Database Dump**: Uses `pg_dump` to create SQL dump
2. **Compression**: gzip compression (level 9) for size optimization
3. **Encryption**: AES-256-GCM encryption with random IV
4. **Checksum**: SHA-256 hash for integrity verification
5. **Metadata**: JSON file with backup details
6. **Retention**: Apply retention policy and cleanup old backups

#### Example Output

```
🚀 Starting database backup process...
✅ Created backup directory: /server/backups

📊 Backup ID: backup-2025-10-01-03-00-00
📁 Output directory: /server/backups

📦 Step 1/5: Creating database dump...
✅ Database dump created: 45.32 MB

🗜️  Step 2/5: Compressing dump file...
✅ File compressed: 8.76 MB (80.67% reduction)

🔐 Step 3/5: Encrypting backup...
✅ File encrypted with AES-256-GCM

📝 Step 4/5: Generating metadata...

🧹 Step 5/5: Cleaning up temporary files...

✅ Backup completed successfully!
📄 Encrypted backup: server/backups/backup-2025-10-01-03-00-00.sql.gz.enc
📄 Metadata: server/backups/backup-2025-10-01-03-00-00.meta.json
📊 Size: 8.78 MB
🔑 Checksum: a3f8c9d2e1b4...
```

### Automated Backups

Automated backups run daily at **3:00 AM** via cron job.

#### Configuration

Located in `server/jobs/scheduledJobs.js`:

```javascript
// Daily backup at 3 AM
const automatedBackup = cron.schedule('0 3 * * *', async () => {
  // Backup logic
});
```

#### Monitoring

- **Success**: Logged to `backup_logs` table and application logs
- **Failure**: Error logged with stack trace, notification sent via Socket.IO
- **Notifications**: Real-time events via `system:backup-completed` event

#### Backup Log Database

All backups are tracked in the `backup_logs` table:

```sql
SELECT 
  backup_id,
  created_at,
  file_size,
  status,
  retention_expires_at
FROM backup_logs
ORDER BY created_at DESC
LIMIT 10;
```

---

## Restore Operations

### ⚠️ CRITICAL SAFETY WARNINGS

1. **Production Restores**: Always use `--confirm-restore` flag
2. **Emergency Backup**: Automatic emergency backup created before restore
3. **Test First**: Test restore on `--target-db restore_test` before production
4. **Downtime**: Production restores require application downtime

### Manual Restore

#### List Available Backups

```bash
node server/scripts/restoreDatabase.js --list
```

#### Restore to Test Database (RECOMMENDED)

```bash
# Test restore without affecting production
node server/scripts/restoreDatabase.js \
  --backup-file server/backups/backup-2025-10-01-03-00-00.sql.gz.enc \
  --target-db restore_test \
  --confirm-restore
```

#### Restore to Production (DANGEROUS)

```bash
# ⚠️ WARNING: This will DROP all current data!
# Emergency backup is created automatically

node server/scripts/restoreDatabase.js \
  --backup-file server/backups/backup-2025-10-01-03-00-00.sql.gz.enc \
  --confirm-restore
```

### Restore Process Flow

1. **Load Metadata**: Validate backup metadata exists
2. **Verify File**: Check file exists and matches expected checksum
3. **Emergency Backup**: Create safety backup of current database
4. **Decrypt**: Decrypt backup using BACKUP_ENCRYPTION_KEY
5. **Decompress**: Extract SQL dump from gzip archive
6. **Restore**: Execute SQL dump via `psql`
7. **Validate**: Check table counts and critical tables
8. **Cleanup**: Remove temporary files

#### Example Output

```
🔄 Starting database restore process...
📁 Backup file: server/backups/backup-2025-10-01-03-00-00.sql.gz.enc
🎯 Target: Current database (main_db)

⚠️  WARNING: You are about to restore to the CURRENT database!
   This will DROP all existing data and replace it with the backup.

📋 Step 1/7: Loading backup metadata...
   Backup ID: backup-2025-10-01-03-00-00
   Created: 2025-10-01T03:00:00.000Z
   Size: 8.78 MB
   Type: daily
   Encrypted: Yes

✅ Step 2/7: Verifying backup file integrity...
   File exists: 8.78 MB
   Expected checksum: a3f8c9d2e1b4...
   ✅ Backup file verified

💾 Step 3/7: Creating emergency safety backup...
   Creating emergency backup before restore...
   ✅ Emergency backup created: backup-2025-10-01-12-30-00

🔓 Step 4/7: Decrypting backup...
   ✅ File decrypted successfully

📦 Step 5/7: Decompressing backup...
   ✅ File decompressed: 45.32 MB

🗄️  Step 6/7: Restoring database...
   Executing pg_restore...
   ✅ Database restored from dump

✔️  Step 7/7: Validating restore...
   Validated 45 tables:
   - users: 125 rows
   - properties: 850 rows
   - contacts: 1,243 rows
   - deals: 432 rows
   ✅ Critical tables validated successfully

🧹 Cleaning up temporary files...

✅ Database restore completed successfully!
```

---

## Scheduled Jobs

### Daily Backup Job

- **Schedule**: Every day at 3:00 AM
- **Function**: Creates encrypted database backup
- **Logs to**: `backup_logs` table
- **Notifications**: Socket.IO `system:backup-completed` event

### Weekly Restore Test

- **Schedule**: Every Sunday at 5:00 AM
- **Function**: Tests latest backup restore to temporary database
- **Validation**: Checks table counts and critical tables
- **Cleanup**: Drops test database after validation
- **Notifications**: 
  - Success: `system:restore-test-success`
  - Failure: `system:restore-test-failed`

### Cron Schedule Summary

```
Time    | Day    | Job
--------|--------|----------------------------------
2:00 AM | Daily  | Log cleanup
2:30 AM | Daily  | Trigger detection
3:00 AM | Daily  | Database backup
4:00 AM | Daily  | GDPR scheduled deletions
5:00 AM | Sunday | Weekly restore test
```

---

## Retention Policy

### Policy Rules

| Type    | Trigger                    | Retention Period |
|---------|----------------------------|------------------|
| Daily   | Any backup                 | 30 days          |
| Monthly | First day of month (1st)   | 12 months        |
| Yearly  | January 1st                | Unlimited        |

### Automatic Cleanup

The backup script automatically:
1. Identifies expired backups based on `retention_expires_at`
2. Deletes backup files (`.sql.gz.enc`)
3. Deletes metadata files (`.meta.json`)
4. Updates `backup_logs` table with status `deleted`

### Manual Retention Management

```javascript
// List backups by retention type
SELECT backup_id, retention_type, retention_expires_at
FROM backup_logs
WHERE status = 'completed'
ORDER BY created_at DESC;

// Find backups expiring soon
SELECT backup_id, retention_expires_at
FROM backup_logs
WHERE retention_expires_at < NOW() + INTERVAL '7 days'
  AND status = 'completed';
```

---

## Emergency Procedures

### Emergency Restore Procedure

**Scenario**: Production database corrupted or data loss detected

#### Step 1: Stop Application

```bash
# Stop all services
pm2 stop all

# Or manually stop server
pkill -f "node server/index.js"
```

#### Step 2: Identify Latest Good Backup

```bash
# List recent backups
node server/scripts/restoreDatabase.js --list

# Check backup logs in database
psql $DATABASE_URL -c "
  SELECT backup_id, created_at, file_size, status
  FROM backup_logs
  WHERE status = 'completed'
  ORDER BY created_at DESC
  LIMIT 5;
"
```

#### Step 3: Test Restore (CRITICAL)

```bash
# Test restore to isolated database
node server/scripts/restoreDatabase.js \
  --backup-file server/backups/backup-2025-10-01-03-00-00.sql.gz.enc \
  --target-db restore_test \
  --confirm-restore

# Validate restored data
psql $DATABASE_URL -d restore_test -c "
  SELECT COUNT(*) FROM users;
  SELECT COUNT(*) FROM properties;
  SELECT COUNT(*) FROM contacts;
"
```

#### Step 4: Execute Production Restore

```bash
# ⚠️ FINAL WARNING: This replaces all production data
node server/scripts/restoreDatabase.js \
  --backup-file server/backups/backup-2025-10-01-03-00-00.sql.gz.enc \
  --confirm-restore
```

#### Step 5: Restart Application

```bash
# Restart services
pm2 restart all

# Or manually start server
cd server && node index.js
```

#### Step 6: Validate Recovery

```bash
# Check critical data
# Test user login
# Verify recent records exist
# Check application logs for errors
```

### Emergency Backup Creation

If you need to create an immediate backup before maintenance:

```bash
# Create backup with timestamp
node server/scripts/backupDatabase.js \
  --output-dir server/backups/emergency

# Verify backup created
ls -lh server/backups/emergency/
```

---

## Testing & Validation

### Manual Backup Test

```bash
# 1. Create test backup
node server/scripts/backupDatabase.js

# 2. Verify files created
ls -lh server/backups/

# 3. Check metadata
cat server/backups/backup-*.meta.json | jq

# 4. Verify in database
psql $DATABASE_URL -c "
  SELECT * FROM backup_logs ORDER BY created_at DESC LIMIT 1;
"
```

### Manual Restore Test

```bash
# 1. Create test database
psql $DATABASE_URL -c "CREATE DATABASE restore_test_manual;"

# 2. Restore to test database
node server/scripts/restoreDatabase.js \
  --backup-file server/backups/backup-2025-10-01-03-00-00.sql.gz.enc \
  --target-db restore_test_manual \
  --confirm-restore

# 3. Validate data
psql $DATABASE_URL -d restore_test_manual -c "
  SELECT 
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM properties) as properties,
    (SELECT COUNT(*) FROM contacts) as contacts;
"

# 4. Cleanup
psql $DATABASE_URL -c "DROP DATABASE restore_test_manual;"
```

### Automated Weekly Test

The system automatically tests restore every Sunday at 5 AM:

```javascript
// Check test results in logs
tail -f server/logs/combined.log | grep "restore test"

// Check last test result
psql $DATABASE_URL -c "
  SELECT 
    backup_id,
    created_at,
    metadata->>'testResult' as test_result
  FROM backup_logs
  WHERE metadata->>'tested' = 'true'
  ORDER BY created_at DESC
  LIMIT 1;
"
```

---

## Troubleshooting

### Common Issues

#### 1. BACKUP_ENCRYPTION_KEY Not Set

**Error**: `BACKUP_ENCRYPTION_KEY is required`

**Solution**:
```bash
# Generate new key (64 hex characters = 32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Set in environment
export BACKUP_ENCRYPTION_KEY="your-generated-key"

# Or add to .env file
echo "BACKUP_ENCRYPTION_KEY=your-generated-key" >> .env
```

#### 2. pg_dump Command Not Found

**Error**: `pg_dump process error`

**Solution**:
```bash
# Install PostgreSQL client tools
apt-get update && apt-get install -y postgresql-client

# Verify installation
which pg_dump
pg_dump --version
```

#### 3. Decryption Failed

**Error**: `Decryption failed: Check encryption key`

**Possible Causes**:
- Wrong encryption key
- Corrupted backup file
- Backup from different environment

**Solution**:
```bash
# Verify key matches
echo $BACKUP_ENCRYPTION_KEY

# Check backup metadata
cat server/backups/backup-*.meta.json | jq '.checksum'

# Try older backup
node server/scripts/restoreDatabase.js --list
```

#### 4. Insufficient Disk Space

**Error**: `ENOSPC: no space left on device`

**Solution**:
```bash
# Check disk usage
df -h

# Clean old backups manually
cd server/backups
rm -f backup-2025-09-*.sql.gz.enc
rm -f backup-2025-09-*.meta.json

# Or adjust retention policy in code
```

#### 5. Database Connection Timeout

**Error**: `Connection timeout` or `ECONNREFUSED`

**Solution**:
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check database is running
pg_isready -h hostname -p 5432
```

### Log Files

Check these logs for detailed error information:

```bash
# Application logs
tail -f server/logs/combined.log
tail -f server/logs/error.log

# Backup/restore specific logs
tail -f server/logs/combined.log | grep -i "backup\|restore"

# Audit logs
tail -f server/logs/audit.log
```

---

## Best Practices

### 1. Encryption Key Management

- **Never commit** encryption key to version control
- Store in **secrets manager** (Doppler, AWS Secrets Manager)
- Rotate keys **quarterly** (see `KEY_ROTATION_GUIDE.md`)
- Keep backup key **offline** in secure location

### 2. Backup Verification

- **Weekly automated tests** validate backup integrity
- **Monthly manual** restore tests to staging environment
- Verify **critical data** after each restore test

### 3. Monitoring & Alerts

- Monitor backup completion daily
- Alert on backup failures
- Track backup size trends
- Alert on restore test failures

### 4. Documentation

- Document all restore procedures
- Maintain runbook for emergency scenarios
- Train team on restore process
- Review procedures quarterly

### 5. Security

- Encrypt backups at rest (AES-256-GCM)
- Encrypt backups in transit (TLS)
- Restrict access to backup files
- Audit backup access logs

---

## Contact & Support

For emergency backup/restore support:

- **Primary**: DevOps team
- **Secondary**: Database administrators
- **Emergency**: On-call engineer

**Important Files**:
- This guide: `server/config/DISASTER_RECOVERY_GUIDE.md`
- Key rotation: `server/config/KEY_ROTATION_GUIDE.md`
- Backup script: `server/scripts/backupDatabase.js`
- Restore script: `server/scripts/restoreDatabase.js`

---

## Appendix: Command Reference

### Quick Command Reference

```bash
# List all backups
node server/scripts/backupDatabase.js --metadata-only
node server/scripts/restoreDatabase.js --list

# Create manual backup
node server/scripts/backupDatabase.js

# Restore to test database
node server/scripts/restoreDatabase.js \
  --backup-file server/backups/backup-YYYY-MM-DD-HH-mm-ss.sql.gz.enc \
  --target-db restore_test \
  --confirm-restore

# Emergency production restore
node server/scripts/restoreDatabase.js \
  --backup-file server/backups/backup-YYYY-MM-DD-HH-mm-ss.sql.gz.enc \
  --confirm-restore

# Check backup logs
psql $DATABASE_URL -c "SELECT * FROM backup_logs ORDER BY created_at DESC LIMIT 10;"

# Generate new encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

**Last Updated**: October 1, 2025  
**Version**: 1.0.0  
**Maintained By**: BesaHubs DevOps Team
