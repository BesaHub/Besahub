const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM(
      'DEAL_STAGE_CHANGED',
      'TASK_DUE_SOON',
      'TASK_OVERDUE',
      'PROPERTY_STATUS_CHANGE',
      'DOCUMENT_UPLOADED',
      'CONTACT_ASSIGNED',
      'REPORT_READY',
      'SYSTEM_ALERT',
      'LEASE_EXPIRING',
      'DEBT_MATURING'
    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  entityType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('unread', 'read', 'archived'),
    defaultValue: 'unread'
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'Notifications',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      fields: ['user_id', 'status', 'created_at']
    },
    {
      fields: ['user_id', 'status'],
      where: {
        status: 'unread'
      },
      name: 'notifications_unread_idx'
    }
  ]
});

module.exports = Notification;
