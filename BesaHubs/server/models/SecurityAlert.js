const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SecurityAlert = sequelize.define('SecurityAlert', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  alertType: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Type of security alert: BRUTE_FORCE, MULTIPLE_IPS, RATE_LIMIT, TOKEN_REUSE, MFA_BYPASS, ADMIN_UNUSUAL_IP'
  },
  severity: {
    type: DataTypes.ENUM('INFO', 'WARNING', 'CRITICAL'),
    allowNull: false,
    defaultValue: 'INFO'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'User ID associated with the alert (if applicable)'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Email of user associated with the alert'
  },
  ip: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'IP address associated with the alert'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User agent string'
  },
  details: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional details about the alert (count, patterns, etc.)'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Human-readable description of the alert'
  },
  recommendedAction: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Recommended action to take'
  },
  resolved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether the alert has been resolved'
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resolvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Admin user ID who resolved the alert'
  },
  resolutionNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'security_alerts',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['email']
    },
    {
      fields: ['ip']
    },
    {
      fields: ['severity']
    },
    {
      fields: ['alertType']
    },
    {
      fields: ['resolved']
    },
    {
      fields: ['createdAt']
    }
  ]
});

SecurityAlert.prototype.resolve = async function(adminUserId, notes) {
  this.resolved = true;
  this.resolvedAt = new Date();
  this.resolvedBy = adminUserId;
  this.resolutionNotes = notes;
  await this.save();
};

module.exports = SecurityAlert;
