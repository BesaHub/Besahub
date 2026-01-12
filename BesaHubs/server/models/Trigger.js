const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Trigger = sequelize.define('Trigger', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('lease_expiration', 'debt_maturity', 'property_alert', 'deal_alert', 'custom'),
    allowNull: false
  },
  entityType: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  entityId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  triggerDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true
    }
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium',
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'dismissed', 'actioned'),
    defaultValue: 'pending',
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['type'] },
    { fields: ['entity_type', 'entity_id'] },
    { fields: ['trigger_date'] },
    { fields: ['status'] },
    { fields: ['priority'] },
    { fields: ['status', 'trigger_date'] },
    { fields: ['type', 'status'] },
    { fields: [{ attribute: 'created_at', order: 'DESC' }] }
  ]
});

// Instance methods
Trigger.prototype.isActive = function() {
  return this.status === 'active';
};

Trigger.prototype.isPending = function() {
  return this.status === 'pending';
};

Trigger.prototype.isDue = function() {
  const now = new Date();
  return this.triggerDate <= now && ['pending', 'active'].includes(this.status);
};

Trigger.prototype.getDaysUntilTrigger = function() {
  const now = new Date();
  return Math.floor((this.triggerDate - now) / (1000 * 60 * 60 * 24));
};

Trigger.prototype.dismiss = async function() {
  this.status = 'dismissed';
  return await this.save();
};

Trigger.prototype.markActioned = async function() {
  this.status = 'actioned';
  return await this.save();
};

Trigger.prototype.activate = async function() {
  this.status = 'active';
  return await this.save();
};

module.exports = Trigger;
