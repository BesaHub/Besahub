const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EmailLog = sequelize.define('EmailLog', {
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
  contactId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'contacts',
      key: 'id'
    }
  },
  dealId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'deals',
      key: 'id'
    }
  },
  propertyId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'properties',
      key: 'id'
    }
  },
  to: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Comma-separated email addresses'
  },
  cc: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  bcc: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'failed', 'delivered', 'opened'),
    defaultValue: 'draft'
  },
  attachments: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  sendgridMessageId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'EmailLogs',
  underscored: true,
  timestamps: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['contact_id'] },
    { fields: ['deal_id'] },
    { fields: ['status'] },
    { fields: ['created_at'] }
  ]
});

module.exports = EmailLog;
