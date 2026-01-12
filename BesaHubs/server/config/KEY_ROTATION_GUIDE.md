# PII Encryption Key Rotation Guide

## Overview

This guide provides complete operational procedures for rotating PII encryption keys in the BesaHubs CRM system with **zero downtime** and **complete audit trail**.

### When to Rotate Keys

- **Quarterly Schedule**: Automated notification on 1st of Jan/Apr/Jul/Oct
- **Security Incident**: Immediately if key compromise suspected
- **Compliance Requirement**: As required by data protection regulations
- **Personnel Changes**: When encryption key holders leave organization
- **Best Practice**: Every 90 days minimum

---

## 🔒 Pre-Rotation Checklist

### 1. Environment Preparation

```bash
# Verify current encryption key is available
echo $ENCRYPTION_KEY

# Generate new encryption key (32+ characters)
NEW_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "New key generated: ${NEW_KEY:0:16}..."

# Store new key in secrets manager (DO THIS FIRST!)
# Example with Doppler:
doppler secrets set ENCRYPTION_KEY_NEW "$NEW_KEY"
```

### 2. Database Backup

```bash
# Create full database backup BEFORE rotation
cd server
node -e "require('./services/backupService').createDatabaseBackup()"

# Verify backup exists
ls -lh backups/

# Test backup restoration (on staging environment)
# pg_restore -d staging_db backups/backup-YYYY-MM-DD-HH-MM.sql
```

### 3. System Health Check

```bash
# Verify database connection
node -e "require('./config/database').testConnection()"

# Check disk space (need space for rotation logs)
df -h

# Verify pgcrypto extension is enabled
psql $DATABASE_URL -c "SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto');"
```

---

## 🔄 Rotation Procedure

### Step 1: Dry Run (MANDATORY)

**Always test rotation in dry-run mode first!**

```bash
# Dry run - NO actual changes
node server/scripts/rotateKeys.js \
  --old-key "$ENCRYPTION_KEY" \
  --new-key "$NEW_KEY" \
  --batch-size 100 \
  --dry-run

# Review dry-run log
tail -f server/logs/key-rotation-*.log
```

**Expected Output:**
```
🔐 Starting PII Encryption Key Rotation
✅ Database connection established
🔑 Key hashes
  oldKeyHash: a1b2c3d4...
  newKeyHash: e5f6g7h8...
📋 Processing table: users
📊 Found 1523 records with encrypted fields
🔄 Processing batch (100 records)
[DRY RUN] Would re-encrypt email for record xxx
...
✅ Key rotation completed successfully
Duration: 2340ms
```

### Step 2: Production Rotation

```bash
# Set maintenance mode (optional, for user notification)
# Rotation is designed for ZERO downtime

# Execute actual rotation
node server/scripts/rotateKeys.js \
  --old-key "$ENCRYPTION_KEY" \
  --new-key "$NEW_KEY" \
  --batch-size 100

# Monitor progress in real-time
tail -f server/logs/key-rotation-*.log

# Check rotation_progress table
psql $DATABASE_URL -c "SELECT * FROM rotation_progress ORDER BY started_at DESC LIMIT 1;"
```

### Step 3: Verification

```bash
# Test decryption with new key
ENCRYPTION_KEY="$NEW_KEY" node -e "
  const { sequelize } = require('./config/database');
  const { decryptValue } = require('./utils/encryption');
  (async () => {
    await sequelize.authenticate();
    const [user] = await sequelize.query('SELECT email FROM users LIMIT 1');
    const decrypted = await decryptValue(user[0].email);
    console.log('Decryption test:', decrypted ? '✅ SUCCESS' : '❌ FAILED');
    process.exit(0);
  })();
"

# Verify all tables
psql $DATABASE_URL -c "
  SELECT 
    table_name,
    total_records,
    processed_records,
    failed_records,
    status
  FROM rotation_progress 
  WHERE rotation_id = (SELECT rotation_id FROM rotation_progress ORDER BY started_at DESC LIMIT 1);
"
```

### Step 4: Update Production Environment

```bash
# Update ENCRYPTION_KEY in secrets manager
doppler secrets set ENCRYPTION_KEY "$NEW_KEY"

# Rolling restart of application servers (zero downtime)
# Each server picks up new key from secrets manager
# Example with PM2:
pm2 reload all --update-env

# Verify application is working
curl -X POST https://api.besahubs.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

### Step 5: Post-Rotation Cleanup

```bash
# Archive old encryption key securely (keep for 90 days)
# Store in separate secure location from database backups
echo "$ENCRYPTION_KEY" > encryption-keys/old-key-$(date +%Y%m%d).txt.enc
gpg --encrypt --recipient admin@besahubs.com encryption-keys/old-key-*.txt.enc

# Update audit log
psql $DATABASE_URL -c "
  INSERT INTO audit_log (event_type, details, created_at)
  VALUES (
    'KEY_ROTATION',
    '{\"status\": \"completed\", \"rotation_id\": \"rotation-$(date +%s)\"}',
    NOW()
  );
"

# Archive rotation logs
gzip server/logs/key-rotation-*.log
mv server/logs/key-rotation-*.log.gz server/logs/archive/
```

---

## 🚨 Emergency Rollback Procedure

### When to Rollback

- Rotation script fails mid-process
- Application cannot decrypt data with new key
- Data integrity issues detected
- **DO NOT** rollback for minor issues - investigate first!

### Rollback Steps

```bash
# 1. STOP - Assess the situation
# Check rotation_progress table for failure details
psql $DATABASE_URL -c "SELECT * FROM rotation_progress WHERE status != 'completed' ORDER BY started_at DESC;"

# 2. Identify failed rotation ID
ROTATION_ID="rotation-1234567890"  # From rotation_progress table

# 3. Execute emergency rollback (REQUIRES CONFIRMATION)
node server/scripts/emergencyKeyRollback.js \
  --failed-key "$NEW_KEY" \
  --restore-key "$ENCRYPTION_KEY" \
  --rotation-id "$ROTATION_ID" \
  --confirm-rollback

# 4. Monitor rollback progress
tail -f server/logs/emergency-rollback-*.log

# 5. Restore environment variable
doppler secrets set ENCRYPTION_KEY "$ENCRYPTION_KEY"

# 6. Restart application
pm2 reload all --update-env

# 7. Verify system is operational
curl https://api.besahubs.com/health
```

### Rollback Verification

```bash
# Test decryption with restored key
ENCRYPTION_KEY="$OLD_KEY" node server/scripts/testDecryption.js

# Check rollback status
psql $DATABASE_URL -c "
  SELECT * FROM rotation_progress 
  WHERE rotation_id = '$ROTATION_ID';
"

# Verify audit trail
psql $DATABASE_URL -c "
  SELECT * FROM audit_log 
  WHERE event_type = 'KEY_ROTATION' 
  ORDER BY created_at DESC LIMIT 5;
"
```

---

## 📊 Monitoring & Alerts

### Real-Time Monitoring

```bash
# Monitor rotation progress
watch -n 5 'psql $DATABASE_URL -c "SELECT table_name, processed_records, total_records, status FROM rotation_progress WHERE status = '\''in_progress'\'';"'

# Monitor system load during rotation
htop

# Monitor database connections
psql $DATABASE_URL -c "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active';"
```

### Alert Configuration

**Setup alerts for:**

1. **Rotation Failures**
   - Failed records > 0
   - Rotation time > 30 minutes
   - Database connection errors

2. **System Performance**
   - Database CPU > 80%
   - Connection pool exhausted
   - Disk space < 20%

3. **Security Events**
   - Failed decryption attempts
   - Unauthorized rotation attempts
   - Audit log tampering detected

---

## 📈 Performance Tuning

### Batch Size Optimization

```bash
# Small tables (< 10K records): batch-size 100
node server/scripts/rotateKeys.js --batch-size 100 ...

# Medium tables (10K-100K records): batch-size 500
node server/scripts/rotateKeys.js --batch-size 500 ...

# Large tables (> 100K records): batch-size 1000
node server/scripts/rotateKeys.js --batch-size 1000 ...
```

### Database Performance

```sql
-- Temporarily increase work_mem for rotation
ALTER DATABASE cre_crm SET work_mem = '256MB';

-- Re-analyze tables after rotation
ANALYZE users;
ANALYZE contacts;
ANALYZE companies;

-- Reset work_mem
ALTER DATABASE cre_crm RESET work_mem;
```

---

## 🔍 Troubleshooting

### Issue: Rotation Stuck/Hanging

**Diagnosis:**
```bash
# Check for database locks
psql $DATABASE_URL -c "
  SELECT pid, usename, query, state, wait_event_type
  FROM pg_stat_activity 
  WHERE state != 'idle';
"

# Check rotation progress
psql $DATABASE_URL -c "
  SELECT * FROM rotation_progress 
  WHERE status = 'in_progress';
"
```

**Solution:**
- Reduce batch size
- Check database connection pool settings
- Verify no long-running queries blocking rotation

### Issue: Failed to Decrypt

**Diagnosis:**
```bash
# Test old key decryption
echo "SELECT pgp_sym_decrypt(email, '$OLD_KEY') FROM users LIMIT 1;" | psql $DATABASE_URL

# Check key format
echo "$OLD_KEY" | wc -c  # Should be 64+ characters for hex format
```

**Solution:**
- Verify ENCRYPTION_KEY environment variable
- Check key hasn't been corrupted
- Ensure pgcrypto extension is enabled

### Issue: Partial Rotation

**Diagnosis:**
```sql
-- Check which tables completed
SELECT 
  table_name,
  status,
  processed_records,
  total_records,
  failed_records
FROM rotation_progress 
WHERE rotation_id = 'rotation-XXX';
```

**Solution:**
- Resume from checkpoint: Script automatically resumes from last_checkpoint_id
- Re-run rotation script - it will skip completed tables

---

## 📋 Audit Trail

### Rotation Logs

All rotation operations are logged to:
- **Rotation Log**: `server/logs/key-rotation-{timestamp}.log`
- **Rollback Log**: `server/logs/emergency-rollback-{timestamp}.log`
- **Audit Table**: `rotation_progress` table
- **System Audit**: `audit_log` table

### Log Analysis

```bash
# View successful rotations
jq 'select(.message | contains("completed successfully"))' server/logs/key-rotation-*.log

# View failed operations
jq 'select(.level == "error")' server/logs/key-rotation-*.log

# Extract rotation statistics
psql $DATABASE_URL -c "
  SELECT 
    rotation_id,
    started_at,
    completed_at,
    SUM(total_records) as total,
    SUM(processed_records) as processed,
    SUM(failed_records) as failed,
    EXTRACT(EPOCH FROM (completed_at - started_at)) as duration_seconds
  FROM rotation_progress
  GROUP BY rotation_id, started_at, completed_at
  ORDER BY started_at DESC;
"
```

---

## 🔐 Security Best Practices

### Key Management

1. **Never log plaintext keys** - Always use SHA-256 hash for logging
2. **Use secrets manager** - Never store keys in code or config files
3. **Rotate quarterly** - Or more frequently for high-security environments
4. **Maintain key history** - Keep old keys for 90 days minimum
5. **Separate key backups** - Store keys separately from database backups

### Access Control

```bash
# Restrict rotation script execution
chmod 700 server/scripts/rotateKeys.js
chmod 700 server/scripts/emergencyKeyRollback.js

# Limit database access during rotation
# Only rotation service account should have UPDATE permissions on encrypted fields
```

### Compliance

- **GDPR**: Keys must be rotated if compromise suspected
- **HIPAA**: Encryption key rotation required annually
- **PCI DSS**: Key rotation every 90 days for cardholder data
- **SOC 2**: Document all key rotation procedures and maintain audit trail

---

## 📞 Incident Response

### Suspected Key Compromise

1. **Immediate Actions** (within 1 hour):
   ```bash
   # Generate new emergency key
   EMERGENCY_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   
   # Execute emergency rotation
   node server/scripts/rotateKeys.js \
     --old-key "$COMPROMISED_KEY" \
     --new-key "$EMERGENCY_KEY" \
     --batch-size 1000
   
   # Update all environments
   doppler secrets set ENCRYPTION_KEY "$EMERGENCY_KEY"
   
   # Force restart all services
   pm2 reload all --update-env
   ```

2. **Investigation** (within 24 hours):
   - Review audit logs for unauthorized access
   - Check rotation_progress for anomalies
   - Verify data integrity across all tables
   - Document timeline of events

3. **Notification** (within 72 hours):
   - Notify security team
   - Document incident in audit_log
   - Update incident response documentation
   - Review and improve key management procedures

### Key Recovery

If encryption keys are lost:
- **DO NOT PANIC** - Encrypted data cannot be recovered without keys
- Check key backup locations (GPG encrypted files)
- Check secrets manager history
- Review database backups for previous keys
- **Last resort**: Data re-collection from original sources

---

## 📚 Reference Commands

### Quick Reference

```bash
# Generate new key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Dry run rotation
node server/scripts/rotateKeys.js --old-key "$OLD" --new-key "$NEW" --dry-run

# Production rotation
node server/scripts/rotateKeys.js --old-key "$OLD" --new-key "$NEW" --batch-size 100

# Emergency rollback
node server/scripts/emergencyKeyRollback.js --failed-key "$NEW" --restore-key "$OLD" --confirm-rollback

# Check rotation status
psql $DATABASE_URL -c "SELECT * FROM rotation_progress ORDER BY started_at DESC LIMIT 5;"

# Verify encryption
ENCRYPTION_KEY="$NEW" node server/scripts/testDecryption.js
```

### Cron Schedule

The quarterly rotation reminder runs on:
- **January 1st at 4:00 AM**
- **April 1st at 4:00 AM**
- **July 1st at 4:00 AM**
- **October 1st at 4:00 AM**

Enable with: `ROTATION_SCHEDULE=enabled`

---

## ✅ Post-Rotation Checklist

- [ ] All tables show status='completed' in rotation_progress
- [ ] Zero failed_records across all tables
- [ ] Application successfully decrypts data with new key
- [ ] All environment variables updated with new key
- [ ] Old key archived securely and encrypted
- [ ] Rotation logged in audit_log table
- [ ] Team notified of successful rotation
- [ ] Documentation updated with rotation timestamp
- [ ] Monitoring alerts configured for new key
- [ ] Backup verification completed with new key

---

## 📞 Support

**For rotation issues:**
- Check logs: `server/logs/key-rotation-*.log`
- Review guide: This document
- Database admin: dba@besahubs.com
- Security team: security@besahubs.com

**Emergency contacts:**
- On-call DBA: +1-XXX-XXX-XXXX
- Security lead: +1-XXX-XXX-XXXX
- Infrastructure: +1-XXX-XXX-XXXX

---

**Document Version**: 1.0  
**Last Updated**: October 2025  
**Next Review**: January 2026
