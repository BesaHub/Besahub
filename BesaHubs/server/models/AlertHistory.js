const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AlertHistory = sequelize.define('AlertHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  leaseId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'leases',
      key: 'id'
    }
  },
  debtId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'debts',
      key: 'id'
    }
  },
  alertType: {
    type: DataTypes.ENUM('90day', '60day', '30day', '7day'),
    allowNull: false
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  sentTo: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  notificationId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'notifications',
      key: 'id'
    }
  },
  acknowledged: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  acknowledgedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['lease_id'] },
    { fields: ['debt_id'] },
    { fields: ['sent_to'] },
    { fields: ['alert_type'] },
    { fields: ['sent_at'] },
    { 
      unique: true, 
      fields: ['lease_id', 'alert_type'],
      name: 'unique_lease_alert'
    },
    { 
      unique: true, 
      fields: ['debt_id', 'alert_type'],
      name: 'unique_debt_alert'
    }
  ],
  validate: {
    eitherLeaseOrDebt() {
      if (!this.leaseId && !this.debtId) {
        throw new Error('AlertHistory must reference either a lease or debt');
      }
      if (this.leaseId && this.debtId) {
        throw new Error('AlertHistory cannot reference both lease and debt');
      }
    }
  }
});

module.exports = AlertHistory;
