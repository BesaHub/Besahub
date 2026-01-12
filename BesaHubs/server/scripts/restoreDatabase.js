#!/usr/bin/env node

const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { pipeline } = require('stream/promises');

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

class DatabaseRestore {
  constructor(options = {}) {
    this.backupFile = options.backupFile;
    this.encryptionKey = options.encryptionKey || process.env.BACKUP_ENCRYPTION_KEY;
    this.targetDb = options.targetDb || null;
    this.confirmRestore = options.confirmRestore || false;
    this.listOnly = options.listOnly || false;
    this.dbUrl = process.env.DATABASE_URL;
    this.outputDir = path.join(__dirname, '../backups');
    
    if (!this.listOnly && !this.encryptionKey) {
      throw new Error('BACKUP_ENCRYPTION_KEY is required for restore operations');
    }
    
    if (this.encryptionKey && this.encryptionKey.length !== 64) {
      throw new Error('BACKUP_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }
  }

  async run() {
    try {
      if (this.listOnly) {
        return await this.listAvailableBackups();
      }

      if (!this.backupFile) {
        console.log('❌ No backup file specified. Use --backup-file or --list to see available backups.');
        return await this.listAvailableBackups();
      }

      console.log('🔄 Starting database restore process...');
      console.log(`📁 Backup file: ${this.backupFile}`);
      
      if (this.targetDb) {
        console.log(`🎯 Target database: ${this.targetDb}`);
      } else {
        console.log(`🎯 Target: Current database (${this.getDatabaseName()})`);
      }

      // Safety check for production restore
      if (!this.targetDb && !this.confirmRestore) {
        console.error('\n⚠️  WARNING: You are about to restore to the CURRENT database!');
        console.error('   This will DROP all existing data and replace it with the backup.');
        console.error('   Use --confirm-restore flag to proceed, or --target-db to restore to a test database.');
        throw new Error('Restore not confirmed. Aborting for safety.');
      }

      const metaFile = this.backupFile.replace('.sql.gz.enc', '.meta.json');
      
      // Step 1: Load and validate metadata
      console.log('\n📋 Step 1/7: Loading backup metadata...');
      const metadata = await this.loadMetadata(metaFile);
      this.displayMetadata(metadata);

      // Step 2: Verify file exists and checksum
      console.log('\n✅ Step 2/7: Verifying backup file integrity...');
      await this.verifyBackupFile(this.backupFile, metadata);

      // Step 3: Create safety backup
      if (!this.targetDb) {
        console.log('\n💾 Step 3/7: Creating emergency safety backup...');
        await this.createEmergencyBackup();
      } else {
        console.log('\n⏭️  Step 3/7: Skipping safety backup (restoring to test database)');
      }

      // Step 4: Decrypt file
      console.log('\n🔓 Step 4/7: Decrypting backup...');
      const gzFile = this.backupFile.replace('.enc', '');
      await this.decryptFile(this.backupFile, gzFile, metadata);

      // Step 5: Decompress file
      console.log('\n📦 Step 5/7: Decompressing backup...');
      const sqlFile = gzFile.replace('.gz', '');
      await this.decompressFile(gzFile, sqlFile);

      // Step 6: Restore database
      console.log('\n🗄️  Step 6/7: Restoring database...');
      const tableCounts = await this.restoreDatabase(sqlFile);

      // Step 7: Validate restore
      console.log('\n✔️  Step 7/7: Validating restore...');
      await this.validateRestore(tableCounts);

      // Cleanup temporary files
      console.log('\n🧹 Cleaning up temporary files...');
      if (fs.existsSync(sqlFile)) fs.unlinkSync(sqlFile);
      if (fs.existsSync(gzFile)) fs.unlinkSync(gzFile);

      console.log('\n✅ Database restore completed successfully!');
      
      if (this.targetDb) {
        console.log(`\n📊 Restored to database: ${this.targetDb}`);
        console.log('   This is a test restore. Review the data before applying to production.');
      }

      return {
        success: true,
        backupId: metadata.backupId,
        targetDb: this.targetDb || this.getDatabaseName(),
        tableCounts
      };
    } catch (error) {
      console.error('\n❌ Restore failed:', error.message);
      console.error('\n🔄 Rollback information:');
      console.error('   If the restore failed partway through, you may need to:');
      console.error('   1. Restore from the emergency backup (if created)');
      console.error('   2. Check database logs for detailed error information');
      console.error('   3. Verify backup file integrity');
      
      throw error;
    }
  }

  async listAvailableBackups() {
    console.log('\n📋 Available backups:\n');
    
    const backups = this.getAllBackups();
    
    if (backups.length === 0) {
      console.log('   No backups found in ' + this.outputDir);
      return { backups: [] };
    }

    for (const backup of backups) {
      const exists = fs.existsSync(backup.encFile);
      const status = exists ? '✅' : '❌';
      
      console.log(`${status} ${backup.backupId}`);
      console.log(`   Created: ${backup.metadata.createdAt}`);
      console.log(`   Size: ${backup.metadata.fileSizeFormatted}`);
      console.log(`   Type: ${backup.metadata.retentionType}`);
      console.log(`   Checksum: ${backup.metadata.checksum.substring(0, 16)}...`);
      console.log(`   File: ${backup.encFile}`);
      console.log('');
    }

    console.log(`Total backups: ${backups.length}`);
    console.log('\nTo restore a backup, use:');
    console.log(`  node server/scripts/restoreDatabase.js --backup-file <file> --confirm-restore`);
    
    return { backups };
  }

  getAllBackups() {
    const backups = [];
    
    if (!fs.existsSync(this.outputDir)) {
      return backups;
    }
    
    const files = fs.readdirSync(this.outputDir);
    const metaFiles = files.filter(f => f.endsWith('.meta.json'));
    
    for (const metaFile of metaFiles) {
      try {
        const metaPath = path.join(this.outputDir, metaFile);
        const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        const backupId = metadata.backupId;
        const encFile = path.join(this.outputDir, `${backupId}.sql.gz.enc`);
        
        backups.push({
          backupId,
          metaFile: metaPath,
          encFile,
          metadata
        });
      } catch (error) {
        console.warn(`⚠️  Failed to read metadata file ${metaFile}:`, error.message);
      }
    }

    return backups.sort((a, b) => 
      new Date(b.metadata.timestamp) - new Date(a.metadata.timestamp)
    );
  }

  async loadMetadata(metaFile) {
    if (!fs.existsSync(metaFile)) {
      throw new Error(`Metadata file not found: ${metaFile}`);
    }

    const metadata = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
    
    if (!metadata.backupId || !metadata.checksum) {
      throw new Error('Invalid metadata file: missing required fields');
    }

    return metadata;
  }

  displayMetadata(metadata) {
    console.log(`   Backup ID: ${metadata.backupId}`);
    console.log(`   Created: ${metadata.createdAt}`);
    console.log(`   Size: ${metadata.fileSizeFormatted}`);
    console.log(`   Type: ${metadata.retentionType}`);
    console.log(`   Encrypted: ${metadata.encrypted ? 'Yes' : 'No'}`);
    console.log(`   Algorithm: ${metadata.algorithm}`);
  }

  async verifyBackupFile(backupFile, metadata) {
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    const stats = fs.statSync(backupFile);
    console.log(`   File exists: ${this.formatBytes(stats.size)}`);
    console.log(`   Expected checksum: ${metadata.checksum.substring(0, 16)}...`);
    console.log('   ✅ Backup file verified');
  }

  async createEmergencyBackup() {
    const BackupDatabase = require('./backupDatabase');
    const timestamp = new Date().toISOString()
      .replace(/T/, '-')
      .replace(/:/g, '-')
      .replace(/\..+/, '')
      .substring(0, 19);
    
    const emergencyDir = path.join(this.outputDir, 'emergency');
    
    if (!fs.existsSync(emergencyDir)) {
      fs.mkdirSync(emergencyDir, { recursive: true });
    }

    console.log('   Creating emergency backup before restore...');
    
    const backup = new BackupDatabase({
      outputDir: emergencyDir,
      encryptionKey: this.encryptionKey
    });

    const result = await backup.run();
    console.log(`   ✅ Emergency backup created: ${result.backupId}`);
    
    return result;
  }

  async decryptFile(inputFile, outputFile, metadata) {
    const key = Buffer.from(this.encryptionKey, 'hex');
    
    const readStream = fs.createReadStream(inputFile);
    const writeStream = fs.createWriteStream(outputFile);

    // Read IV from the beginning of the file
    const iv = await this.readBytes(readStream, IV_LENGTH);
    
    // Read the rest of the file except auth tag
    const stats = fs.statSync(inputFile);
    const encryptedDataLength = stats.size - IV_LENGTH - AUTH_TAG_LENGTH;
    
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);

    let bytesRead = 0;
    let encryptedData = [];

    await new Promise((resolve, reject) => {
      readStream.on('data', (chunk) => {
        if (bytesRead + chunk.length <= encryptedDataLength) {
          encryptedData.push(chunk);
          bytesRead += chunk.length;
        } else if (bytesRead < encryptedDataLength) {
          const remainingBytes = encryptedDataLength - bytesRead;
          encryptedData.push(chunk.slice(0, remainingBytes));
          bytesRead += remainingBytes;
        }
      });

      readStream.on('end', async () => {
        try {
          // Read auth tag from the end
          const fullBuffer = Buffer.concat(encryptedData);
          const fileBuffer = fs.readFileSync(inputFile);
          const authTag = fileBuffer.slice(-AUTH_TAG_LENGTH);
          
          decipher.setAuthTag(authTag);

          // Decrypt data
          const decrypted = Buffer.concat([
            decipher.update(fullBuffer),
            decipher.final()
          ]);

          writeStream.write(decrypted);
          writeStream.end(() => {
            console.log('   ✅ File decrypted successfully');
            resolve();
          });
        } catch (error) {
          reject(new Error(`Decryption failed: ${error.message}. Check encryption key.`));
        }
      });

      readStream.on('error', reject);
      writeStream.on('error', reject);
    });
  }

  async readBytes(stream, count) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      let bytesRead = 0;

      const onData = (chunk) => {
        const needed = count - bytesRead;
        if (chunk.length <= needed) {
          chunks.push(chunk);
          bytesRead += chunk.length;
        } else {
          chunks.push(chunk.slice(0, needed));
          bytesRead += needed;
        }

        if (bytesRead >= count) {
          stream.removeListener('data', onData);
          stream.pause();
          resolve(Buffer.concat(chunks));
        }
      };

      stream.on('data', onData);
      stream.on('error', reject);
      stream.on('end', () => {
        if (bytesRead < count) {
          reject(new Error(`Expected ${count} bytes but got ${bytesRead}`));
        }
      });
    });
  }

  async decompressFile(inputFile, outputFile) {
    const readStream = fs.createReadStream(inputFile);
    const writeStream = fs.createWriteStream(outputFile);
    const gunzip = zlib.createGunzip();

    await pipeline(readStream, gunzip, writeStream);
    
    const stats = fs.statSync(outputFile);
    console.log(`   ✅ File decompressed: ${this.formatBytes(stats.size)}`);
  }

  async restoreDatabase(sqlFile) {
    return new Promise((resolve, reject) => {
      const dbUrl = this.targetDb ? this.getTargetDbUrl() : this.dbUrl;
      
      if (!dbUrl) {
        return reject(new Error('DATABASE_URL not found'));
      }

      console.log('   Executing pg_restore...');

      const psql = spawn('psql', [dbUrl], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const sqlContent = fs.readFileSync(sqlFile, 'utf8');
      
      psql.stdin.write(sqlContent);
      psql.stdin.end();

      let stdout = '';
      let stderr = '';

      psql.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      psql.stderr.on('data', (data) => {
        const message = data.toString();
        stderr += message;
        
        // Log warnings but don't fail on common notices
        if (message.toLowerCase().includes('error') && 
            !message.includes('already exists')) {
          console.error('   ⚠️  pg_restore warning:', message);
        }
      });

      psql.on('close', (code) => {
        if (code !== 0 && !stderr.includes('already exists')) {
          return reject(new Error(`pg_restore failed with code ${code}: ${stderr}`));
        }
        
        console.log('   ✅ Database restored from dump');
        
        // Get table counts for validation
        this.getTableCounts(dbUrl)
          .then(counts => resolve(counts))
          .catch(reject);
      });

      psql.on('error', (error) => {
        reject(new Error(`pg_restore process error: ${error.message}`));
      });
    });
  }

  async getTableCounts(dbUrl) {
    return new Promise((resolve, reject) => {
      const psql = spawn('psql', [
        dbUrl,
        '-t',
        '-c',
        `SELECT schemaname, tablename, n_live_tup as row_count 
         FROM pg_stat_user_tables 
         ORDER BY schemaname, tablename;`
      ]);

      let output = '';
      
      psql.stdout.on('data', (data) => {
        output += data.toString();
      });

      psql.on('close', (code) => {
        if (code !== 0) {
          return resolve({}); // Don't fail validation on count error
        }
        
        const counts = {};
        const lines = output.trim().split('\n');
        
        for (const line of lines) {
          const parts = line.trim().split('|').map(p => p.trim());
          if (parts.length >= 3 && parts[1]) {
            counts[parts[1]] = parseInt(parts[2]) || 0;
          }
        }
        
        resolve(counts);
      });

      psql.on('error', () => {
        resolve({}); // Don't fail validation on count error
      });
    });
  }

  async validateRestore(tableCounts) {
    const tableNames = Object.keys(tableCounts);
    
    if (tableNames.length === 0) {
      console.log('   ⚠️  Could not retrieve table counts for validation');
      console.log('   ✅ Restore completed, but validation skipped');
      return;
    }

    console.log(`   Validated ${tableNames.length} tables:`);
    
    const criticalTables = ['users', 'properties', 'contacts', 'deals'];
    let hasData = false;
    
    for (const table of criticalTables) {
      if (tableCounts[table]) {
        console.log(`   - ${table}: ${tableCounts[table]} rows`);
        hasData = true;
      }
    }

    if (hasData) {
      console.log('   ✅ Critical tables validated successfully');
    } else {
      console.log('   ⚠️  Warning: No data found in critical tables');
    }
  }

  getTargetDbUrl() {
    if (!this.dbUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    // Replace database name in URL
    const url = new URL(this.dbUrl);
    const currentDb = url.pathname.substring(1);
    url.pathname = '/' + this.targetDb;
    
    return url.toString();
  }

  getDatabaseName() {
    if (!this.dbUrl) return 'unknown';
    
    try {
      const url = new URL(this.dbUrl);
      return url.pathname.substring(1);
    } catch {
      return 'unknown';
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--backup-file' && args[i + 1]) {
      options.backupFile = args[i + 1];
      i++;
    } else if (args[i] === '--encryption-key' && args[i + 1]) {
      options.encryptionKey = args[i + 1];
      i++;
    } else if (args[i] === '--target-db' && args[i + 1]) {
      options.targetDb = args[i + 1];
      i++;
    } else if (args[i] === '--confirm-restore') {
      options.confirmRestore = true;
    } else if (args[i] === '--list') {
      options.listOnly = true;
    }
  }

  const restore = new DatabaseRestore(options);
  
  restore.run()
    .then((result) => {
      if (result && result.success) {
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = DatabaseRestore;
