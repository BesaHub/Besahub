const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { appLogger } = require('../config/logger');
const { sanitizeCSVCell } = require('../utils/csvSanitizer');

/**
 * AuditLogService - Immutable Audit Log Management
 * 
 * SECURITY FEATURES:
 * - Append-only file-based storage (no DELETE/UPDATE operations)
 * - Hash chain verification to detect tampering
 * - Each entry contains hash of previous entry (SHA-256)
 * - Automatic daily rotation with 90-day retention
 * - Compressed archives for historical logs
 * 
 * IMMUTABILITY:
 * - No methods provided to delete or modify audit logs
 * - All write operations go through winston logger (append-only)
 * - Hash chain breaks if any entry is tampered with
 */
class AuditLogService {
  constructor() {
    this.logsDir = path.join(__dirname, '../logs');
  }

  /**
   * Verify the integrity of the hash chain in audit logs
   * @param {Array} logs - Array of log entries to verify
   * @returns {Object} Verification result with status and details
   */
  verifyHashChain(logs) {
    if (!logs || logs.length === 0) {
      return { valid: true, message: 'No logs to verify' };
    }

    const results = {
      valid: true,
      totalEntries: logs.length,
      verifiedEntries: 0,
      tamperedEntries: [],
      brokenChains: []
    };

    // Sort logs by timestamp to verify chronological order
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    for (let i = 0; i < sortedLogs.length; i++) {
      const entry = sortedLogs[i];
      
      // Skip entries without hash (older logs before hash chain was implemented)
      if (!entry.hash) {
        continue;
      }

      // Verify the hash matches the entry content
      const entryWithoutHash = { ...entry };
      delete entryWithoutHash.hash;
      const expectedHash = this.calculateHash(entryWithoutHash, entry.previousHash);
      
      if (entry.hash !== expectedHash) {
        results.valid = false;
        results.tamperedEntries.push({
          index: i,
          timestamp: entry.timestamp,
          correlationId: entry.correlationId,
          expectedHash: expectedHash.substring(0, 16) + '...',
          actualHash: entry.hash.substring(0, 16) + '...',
          reason: 'Hash mismatch - entry may have been tampered'
        });
      }

      // Verify chain continuity (current previousHash should match previous entry's hash)
      if (i > 0 && sortedLogs[i - 1].hash) {
        if (entry.previousHash !== sortedLogs[i - 1].hash) {
          results.valid = false;
          results.brokenChains.push({
            index: i,
            timestamp: entry.timestamp,
            correlationId: entry.correlationId,
            reason: 'Chain broken - previousHash does not match previous entry hash'
          });
        }
      }

      results.verifiedEntries++;
    }

    if (!results.valid) {
      appLogger.error('🚨 SECURITY ALERT: Audit log tampering detected!', {
        tamperedCount: results.tamperedEntries.length,
        brokenChains: results.brokenChains.length,
        tamperedEntries: results.tamperedEntries,
        brokenChains: results.brokenChains
      });
    }

    return results;
  }

  /**
   * Calculate hash for an entry (must match algorithm in auditLogger.js)
   * @param {Object} data - Entry data
   * @param {string} previousHash - Hash of previous entry
   * @returns {string} SHA-256 hash
   */
  calculateHash(data, previousHash) {
    const content = JSON.stringify(data) + (previousHash || '');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async getAuditLogs(options = {}) {
    const {
      startDate,
      endDate,
      eventType,
      userId,
      email,
      statusCode,
      correlationId,
      ipAddress,
      limit = 100,
      offset = 0,
      verifyIntegrity = false
    } = options;

    try {
      const logs = await this.readAllAuditLogs();
      
      // Verify hash chain integrity if requested
      if (verifyIntegrity) {
        const verification = this.verifyHashChain(logs);
        if (!verification.valid) {
          appLogger.warn('⚠️ Hash chain verification failed during log retrieval', verification);
        }
      }
      
      let filteredLogs = logs;

      if (startDate) {
        const start = new Date(startDate);
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= start);
      }

      if (endDate) {
        const end = new Date(endDate);
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= end);
      }

      if (eventType) {
        filteredLogs = filteredLogs.filter(log => log.eventType === eventType);
      }

      if (userId) {
        filteredLogs = filteredLogs.filter(log => log.user?.id === userId);
      }

      if (email) {
        filteredLogs = filteredLogs.filter(log => 
          log.user?.email?.toLowerCase().includes(email.toLowerCase())
        );
      }

      if (statusCode) {
        filteredLogs = filteredLogs.filter(log => 
          log.response?.statusCode === parseInt(statusCode)
        );
      }

      if (correlationId) {
        filteredLogs = filteredLogs.filter(log => 
          log.correlationId?.includes(correlationId)
        );
      }

      if (ipAddress) {
        filteredLogs = filteredLogs.filter(log => 
          log.request?.ip?.includes(ipAddress)
        );
      }

      const totalCount = filteredLogs.length;
      const paginatedLogs = filteredLogs
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(offset, offset + limit);

      return {
        logs: paginatedLogs,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      };
    } catch (error) {
      appLogger.error('Error fetching audit logs:', error);
      throw new Error('Failed to fetch audit logs');
    }
  }

  async getAuditLogById(correlationId) {
    try {
      const logs = await this.readAllAuditLogs();
      const log = logs.find(l => l.correlationId === correlationId);
      
      if (!log) {
        return null;
      }

      return log;
    } catch (error) {
      appLogger.error('Error fetching audit log by ID:', error);
      throw new Error('Failed to fetch audit log');
    }
  }

  async getAuditLogStats(options = {}) {
    const {
      startDate,
      endDate
    } = options;

    try {
      const logs = await this.readAllAuditLogs();
      
      let filteredLogs = logs;

      if (startDate) {
        const start = new Date(startDate);
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= start);
      }

      if (endDate) {
        const end = new Date(endDate);
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= end);
      }

      const eventsByType = {};
      const eventsByUser = {};
      const eventsByStatusCode = {};
      let failedLogins = 0;
      let successfulLogins = 0;
      let adminActions = 0;
      let securityEvents = 0;

      filteredLogs.forEach(log => {
        const eventType = log.eventType || 'UNKNOWN';
        eventsByType[eventType] = (eventsByType[eventType] || 0) + 1;

        if (log.user?.email) {
          eventsByUser[log.user.email] = (eventsByUser[log.user.email] || 0) + 1;
        }

        const statusCode = log.response?.statusCode;
        if (statusCode) {
          eventsByStatusCode[statusCode] = (eventsByStatusCode[statusCode] || 0) + 1;
        }

        if (eventType === 'USER_LOGIN') {
          if (statusCode >= 200 && statusCode < 300) {
            successfulLogins++;
          } else {
            failedLogins++;
          }
        }

        if (eventType === 'ADMIN_ACTION') {
          adminActions++;
        }

        if (['PASSWORD_CHANGE', 'PASSWORD_RESET', 'MFA_OPERATION', 'USER_DELETE'].includes(eventType)) {
          securityEvents++;
        }
      });

      const topUsers = Object.entries(eventsByUser)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([email, count]) => ({ email, count }));

      const topEventTypes = Object.entries(eventsByType)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => ({ type, count }));

      return {
        summary: {
          totalEvents: filteredLogs.length,
          failedLogins,
          successfulLogins,
          adminActions,
          securityEvents,
          uniqueUsers: Object.keys(eventsByUser).length
        },
        eventsByType: topEventTypes,
        eventsByStatusCode: Object.entries(eventsByStatusCode).map(([code, count]) => ({
          statusCode: parseInt(code),
          count
        })),
        topUsers,
        dateRange: {
          start: startDate || (filteredLogs.length > 0 ? filteredLogs[filteredLogs.length - 1].timestamp : null),
          end: endDate || (filteredLogs.length > 0 ? filteredLogs[0].timestamp : null)
        }
      };
    } catch (error) {
      appLogger.error('Error fetching audit log stats:', error);
      throw new Error('Failed to fetch audit log statistics');
    }
  }

  async readAllAuditLogs() {
    try {
      if (!fs.existsSync(this.logsDir)) {
        return [];
      }

      const files = fs.readdirSync(this.logsDir)
        .filter(file => file.startsWith('audit-') && (file.endsWith('.log') || file.endsWith('.log.gz')))
        .map(file => {
          const filePath = path.join(this.logsDir, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            path: filePath,
            mtime: stats.mtime
          };
        })
        .sort((a, b) => b.mtime - a.mtime);

      const allLogs = [];

      for (const file of files) {
        try {
          let content;
          
          if (file.filename.endsWith('.gz')) {
            const compressedContent = fs.readFileSync(file.path);
            content = zlib.gunzipSync(compressedContent).toString('utf-8');
          } else {
            content = fs.readFileSync(file.path, 'utf-8');
          }

          const lines = content.trim().split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              
              if (parsed.correlationId && parsed.timestamp) {
                allLogs.push(parsed);
              }
            } catch (parseError) {
              appLogger.warn('Failed to parse audit log line', { line, error: parseError.message });
            }
          }
        } catch (fileError) {
          appLogger.warn('Failed to read audit log file', { file: file.filename, error: fileError.message });
        }
      }

      return allLogs;
    } catch (error) {
      appLogger.error('Error reading audit logs:', error);
      return [];
    }
  }

  async exportToCSV(options = {}) {
    try {
      const { logs } = await this.getAuditLogs({ ...options, limit: 10000, offset: 0 });
      
      const csvHeader = 'Timestamp,Correlation ID,Event Type,User Email,User Role,IP Address,Method,Path,Status Code,Duration\n';
      
      const csvRows = logs.map(log => {
        // SECURITY: Sanitize all cell values to prevent CSV formula injection on export
        const timestamp = sanitizeCSVCell(log.timestamp ?? '');
        const correlationId = sanitizeCSVCell(log.correlationId ?? '');
        const eventType = sanitizeCSVCell(log.eventType ?? '');
        const userEmail = sanitizeCSVCell(log.user?.email ?? '');
        const userRole = sanitizeCSVCell(log.user?.role ?? '');
        const ip = sanitizeCSVCell(log.request?.ip ?? '');
        const method = sanitizeCSVCell(log.request?.method ?? '');
        const path = sanitizeCSVCell(log.request?.path ?? '');
        const statusCode = sanitizeCSVCell(log.response?.statusCode ?? '');
        const duration = sanitizeCSVCell(log.response?.duration ?? '');

        return `"${timestamp}","${correlationId}","${eventType}","${userEmail}","${userRole}","${ip}","${method}","${path}","${statusCode}","${duration}"`;
      }).join('\n');

      return csvHeader + csvRows;
    } catch (error) {
      appLogger.error('Error exporting audit logs to CSV:', error);
      throw new Error('Failed to export audit logs');
    }
  }

  getEventTypes() {
    return [
      'USER_LOGIN',
      'USER_LOGOUT',
      'PASSWORD_CHANGE',
      'PASSWORD_RESET',
      'MFA_OPERATION',
      'USER_CREATE',
      'USER_UPDATE',
      'USER_DELETE',
      'PROPERTY_CREATE',
      'PROPERTY_UPDATE',
      'PROPERTY_DELETE',
      'DEAL_CREATE',
      'DEAL_UPDATE',
      'DEAL_DELETE',
      'ADMIN_ACTION',
      'API_REQUEST'
    ];
  }

  /**
   * Verify integrity of all audit logs
   * This method can be called to check for tampering
   * @returns {Object} Verification results
   */
  async verifyAllLogs() {
    try {
      const logs = await this.readAllAuditLogs();
      const verification = this.verifyHashChain(logs);
      
      if (!verification.valid) {
        appLogger.error('🚨 Audit log integrity check FAILED', verification);
      } else {
        appLogger.info('✅ Audit log integrity check passed', {
          totalEntries: verification.totalEntries,
          verifiedEntries: verification.verifiedEntries
        });
      }
      
      return verification;
    } catch (error) {
      appLogger.error('Error verifying audit logs:', error);
      throw new Error('Failed to verify audit logs');
    }
  }
}

module.exports = new AuditLogService();
