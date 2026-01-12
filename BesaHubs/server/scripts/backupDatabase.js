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
const CHUNK_SIZE = 100 * 1024 * 1024; // 100MB chunks for multi-part

class DatabaseBackup {
  constructor(options = {}) {
    this.outputDir = options.outputDir || path.join(__dirname, '../backups');
    this.encryptionKey = options.encryptionKey || process.env.BACKUP_ENCRYPTION_KEY;
    this.metadataOnly = options.metadataOnly || false;
    this.dbUrl = process.env.DATABASE_URL;
    
    if (!this.encryptionKey) {
      throw new Error('BACKUP_ENCRYPTION_KEY is required');
    }
    
    if (this.encryptionKey.length !== 64) {
      throw new Error('BACKUP_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }
  }

  async run() {
    try {
      console.log('🚀 Starting database backup process...');
      
      // Ensure backup directory exists
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
        console.log(`✅ Created backup directory: ${this.outputDir}`);
      }

      if (this.metadataOnly) {
        return await this.listBackups();
      }

      const timestamp = this.generateTimestamp();
      const backupId = `backup-${timestamp}`;
      const sqlFile = path.join(this.outputDir, `${backupId}.sql`);
      const gzFile = `${sqlFile}.gz`;
      const encFile = `${gzFile}.enc`;
      const metaFile = path.join(this.outputDir, `${backupId}.meta.json`);

      console.log(`📊 Backup ID: ${backupId}`);
      console.log(`📁 Output directory: ${this.outputDir}`);

      // Step 1: Create database dump
      console.log('\n📦 Step 1/5: Creating database dump...');
      await this.createDump(sqlFile);
      
      // Step 2: Compress dump
      console.log('\n🗜️  Step 2/5: Compressing dump file...');
      await this.compressFile(sqlFile, gzFile);
      
      // Step 3: Encrypt compressed file
      console.log('\n🔐 Step 3/5: Encrypting backup...');
      const { checksum, authTag, iv } = await this.encryptFile(gzFile, encFile);
      
      // Step 4: Generate metadata
      console.log('\n📝 Step 4/5: Generating metadata...');
      const metadata = await this.generateMetadata(encFile, checksum, authTag, iv, timestamp);
      fs.writeFileSync(metaFile, JSON.stringify(metadata, null, 2));
      
      // Step 5: Cleanup temporary files
      console.log('\n🧹 Step 5/5: Cleaning up temporary files...');
      fs.unlinkSync(sqlFile);
      fs.unlinkSync(gzFile);

      console.log('\n✅ Backup completed successfully!');
      console.log(`📄 Encrypted backup: ${encFile}`);
      console.log(`📄 Metadata: ${metaFile}`);
      console.log(`📊 Size: ${this.formatBytes(metadata.fileSize)}`);
      console.log(`🔑 Checksum: ${metadata.checksum}`);

      // Apply retention policy
      await this.applyRetentionPolicy();

      return {
        success: true,
        backupId,
        filePath: encFile,
        metadata
      };
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      throw error;
    }
  }

  async createDump(outputFile) {
    return new Promise((resolve, reject) => {
      if (!this.dbUrl) {
        return reject(new Error('DATABASE_URL not found'));
      }

      const dumpStream = spawn('pg_dump', [
        '--no-owner',
        '--no-privileges',
        '--clean',
        '--if-exists',
        this.dbUrl
      ]);

      const writeStream = fs.createWriteStream(outputFile);
      
      dumpStream.stdout.pipe(writeStream);
      
      dumpStream.stderr.on('data', (data) => {
        const message = data.toString();
        if (message.toLowerCase().includes('error')) {
          console.error('pg_dump error:', message);
        }
      });

      dumpStream.on('error', (error) => {
        reject(new Error(`pg_dump process error: ${error.message}`));
      });

      writeStream.on('error', (error) => {
        reject(new Error(`Write stream error: ${error.message}`));
      });

      writeStream.on('finish', () => {
        const stats = fs.statSync(outputFile);
        console.log(`✅ Database dump created: ${this.formatBytes(stats.size)}`);
        resolve();
      });
    });
  }

  async compressFile(inputFile, outputFile) {
    const readStream = fs.createReadStream(inputFile);
    const writeStream = fs.createWriteStream(outputFile);
    const gzip = zlib.createGzip({ level: 9 });

    await pipeline(readStream, gzip, writeStream);
    
    const stats = fs.statSync(outputFile);
    const originalStats = fs.statSync(inputFile);
    const ratio = ((1 - stats.size / originalStats.size) * 100).toFixed(2);
    
    console.log(`✅ File compressed: ${this.formatBytes(stats.size)} (${ratio}% reduction)`);
  }

  async encryptFile(inputFile, outputFile) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = Buffer.from(this.encryptionKey, 'hex');
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

    const readStream = fs.createReadStream(inputFile);
    const writeStream = fs.createWriteStream(outputFile);
    
    // Write IV at the beginning of the file
    writeStream.write(iv);

    const hash = crypto.createHash('sha256');

    // Stream encryption
    await new Promise((resolve, reject) => {
      readStream.on('data', (chunk) => {
        hash.update(chunk);
        const encrypted = cipher.update(chunk);
        writeStream.write(encrypted);
      });

      readStream.on('end', () => {
        try {
          const finalBuffer = cipher.final();
          writeStream.write(finalBuffer);
          
          const authTag = cipher.getAuthTag();
          writeStream.write(authTag);
          
          writeStream.end(() => {
            const checksum = hash.digest('hex');
            console.log(`✅ File encrypted with AES-256-GCM`);
            resolve({ checksum, authTag: authTag.toString('hex'), iv: iv.toString('hex') });
          });
        } catch (error) {
          reject(error);
        }
      });

      readStream.on('error', reject);
      writeStream.on('error', reject);
    });

    const stats = fs.statSync(outputFile);
    const checksum = await this.calculateFileChecksum(inputFile);
    const authTag = cipher.getAuthTag().toString('hex');

    return { checksum, authTag, iv: iv.toString('hex') };
  }

  async calculateFileChecksum(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  async generateMetadata(filePath, checksum, authTag, iv, timestamp) {
    const stats = fs.statSync(filePath);
    const retentionDate = this.calculateRetentionExpiry(timestamp);

    return {
      backupId: `backup-${timestamp}`,
      timestamp,
      createdAt: new Date().toISOString(),
      filePath: path.relative(process.cwd(), filePath),
      fileName: path.basename(filePath),
      fileSize: stats.size,
      fileSizeFormatted: this.formatBytes(stats.size),
      checksum,
      authTag,
      iv,
      encrypted: true,
      algorithm: ENCRYPTION_ALGORITHM,
      retentionExpiresAt: retentionDate,
      retentionType: this.getRetentionType(timestamp),
      dbInfo: {
        url: this.dbUrl ? this.dbUrl.split('@')[1] : 'unknown',
        dumpVersion: 'pg_dump (PostgreSQL)'
      }
    };
  }

  calculateRetentionExpiry(timestamp) {
    const date = new Date(timestamp.replace(/(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})/, '$1-$2-$3T$4:$5:$6'));
    const retentionType = this.getRetentionType(timestamp);

    switch (retentionType) {
      case 'yearly':
        // Unlimited retention for yearly backups
        return null;
      case 'monthly':
        // Keep for 12 months
        date.setMonth(date.getMonth() + 12);
        return date.toISOString();
      case 'daily':
      default:
        // Keep for 30 days
        date.setDate(date.getDate() + 30);
        return date.toISOString();
    }
  }

  getRetentionType(timestamp) {
    const date = new Date(timestamp.replace(/(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})/, '$1-$2-$3T$4:$5:$6'));
    
    // Yearly: January 1st backups
    if (date.getMonth() === 0 && date.getDate() === 1) {
      return 'yearly';
    }
    
    // Monthly: First day of month backups
    if (date.getDate() === 1) {
      return 'monthly';
    }
    
    return 'daily';
  }

  async applyRetentionPolicy() {
    console.log('\n🗑️  Applying retention policy...');
    
    const backups = this.getAllBackups();
    const now = new Date();
    let deletedCount = 0;

    for (const backup of backups) {
      if (backup.metadata.retentionExpiresAt) {
        const expiryDate = new Date(backup.metadata.retentionExpiresAt);
        
        if (expiryDate < now) {
          console.log(`   Deleting expired backup: ${backup.backupId}`);
          
          // Delete backup file
          if (fs.existsSync(backup.encFile)) {
            fs.unlinkSync(backup.encFile);
          }
          
          // Delete metadata file
          if (fs.existsSync(backup.metaFile)) {
            fs.unlinkSync(backup.metaFile);
          }
          
          deletedCount++;
        }
      }
    }

    console.log(`✅ Retention policy applied: ${deletedCount} backup(s) deleted`);
  }

  getAllBackups() {
    const backups = [];
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

  async listBackups() {
    console.log('\n📋 Available backups:\n');
    
    const backups = this.getAllBackups();
    
    if (backups.length === 0) {
      console.log('   No backups found.');
      return { backups: [] };
    }

    for (const backup of backups) {
      const exists = fs.existsSync(backup.encFile);
      const status = exists ? '✅' : '❌';
      
      console.log(`${status} ${backup.backupId}`);
      console.log(`   Created: ${backup.metadata.createdAt}`);
      console.log(`   Size: ${backup.metadata.fileSizeFormatted}`);
      console.log(`   Type: ${backup.metadata.retentionType}`);
      console.log(`   Expires: ${backup.metadata.retentionExpiresAt || 'Never'}`);
      console.log(`   File: ${backup.encFile}`);
      console.log('');
    }

    console.log(`Total backups: ${backups.length}`);
    
    return { backups };
  }

  generateTimestamp() {
    const now = new Date();
    return now.toISOString()
      .replace(/T/, '-')
      .replace(/:/g, '-')
      .replace(/\..+/, '')
      .substring(0, 19);
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
    if (args[i] === '--output-dir' && args[i + 1]) {
      options.outputDir = args[i + 1];
      i++;
    } else if (args[i] === '--encryption-key' && args[i + 1]) {
      options.encryptionKey = args[i + 1];
      i++;
    } else if (args[i] === '--metadata-only') {
      options.metadataOnly = true;
    }
  }

  const backup = new DatabaseBackup(options);
  
  backup.run()
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

module.exports = DatabaseBackup;
