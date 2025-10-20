const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BackupLog = sequelize.define('BackupLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  backupId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    field: 'backup_id'
  },
  filePath: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'file_path'
  },
  fileSize: {
    type: DataTypes.BIGINT,
    field: 'file_size'
  },
  checksum: {
    type: DataTypes.STRING(64)
  },
  encrypted: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'completed',
    validate: {
      isIn: [['completed', 'failed', 'deleted']]
    }
  },
  retentionExpiresAt: {
    type: DataTypes.DATE,
    field: 'retention_expires_at'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  errorLog: {
    type: DataTypes.TEXT,
    field: 'error_log'
  }
}, {
  tableName: 'backup_logs',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['backup_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['retention_expires_at']
    }
  ]
});

module.exports = BackupLog;
