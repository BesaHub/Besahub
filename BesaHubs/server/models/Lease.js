const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Lease = sequelize.define('Lease', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  propertyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'properties',
      key: 'id'
    }
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'contacts',
      key: 'id'
    }
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true
    }
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true,
      isAfterStart(value) {
        if (this.startDate && value <= this.startDate) {
          throw new Error('End date must be after start date');
        }
      }
    }
  },
  monthlyRent: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  squareFeet: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0
    }
  },
  terms: {
    type: DataTypes.TEXT
  },
  options: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'terminated', 'pending'),
    defaultValue: 'pending',
    allowNull: false
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['property_id'] },
    { fields: ['tenant_id'] },
    { fields: ['status'] },
    { fields: ['start_date'] },
    { fields: ['end_date'] },
    { fields: ['status', 'end_date'] },
    { fields: [{ attribute: 'created_at', order: 'DESC' }] }
  ]
});

// Instance methods
Lease.prototype.isActive = function() {
  const now = new Date();
  return this.status === 'active' && this.startDate <= now && this.endDate >= now;
};

Lease.prototype.isExpiring = function(daysThreshold = 90) {
  const now = new Date();
  const daysUntilExpiration = Math.floor((this.endDate - now) / (1000 * 60 * 60 * 24));
  return this.status === 'active' && daysUntilExpiration <= daysThreshold && daysUntilExpiration > 0;
};

Lease.prototype.getDaysRemaining = function() {
  const now = new Date();
  return Math.floor((this.endDate - now) / (1000 * 60 * 60 * 24));
};

Lease.prototype.getMonthsRemaining = function() {
  const now = new Date();
  const monthsDiff = (this.endDate.getFullYear() - now.getFullYear()) * 12 + 
                     (this.endDate.getMonth() - now.getMonth());
  return monthsDiff;
};

Lease.prototype.getAnnualRent = function() {
  return parseFloat(this.monthlyRent) * 12;
};

module.exports = Lease;
