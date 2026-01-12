const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PropertyOwnership = sequelize.define('PropertyOwnership', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  propertyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'properties',
      key: 'id'
    }
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'entities',
      key: 'id'
    }
  },
  ownershipPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    validate: {
      min: 0,
      max: 100
    }
  },
  ownershipType: {
    type: DataTypes.ENUM('direct', 'indirect', 'beneficial', 'legal', 'equitable'),
    defaultValue: 'direct'
  },
  acquisitionDate: {
    type: DataTypes.DATE,
    validate: {
      isDate: true
    }
  },
  acquisitionPrice: {
    type: DataTypes.DECIMAL(15, 2),
    validate: {
      min: 0
    }
  },
  currentValue: {
    type: DataTypes.DECIMAL(15, 2),
    validate: {
      min: 0
    }
  },
  equityAmount: {
    type: DataTypes.DECIMAL(15, 2),
    validate: {
      min: 0
    }
  },
  ownershipNotes: {
    type: DataTypes.TEXT
  },
  documentReference: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 255]
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  isPrimaryOwner: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  votingRights: {
    type: DataTypes.DECIMAL(5, 2),
    validate: {
      min: 0,
      max: 100
    }
  },
  distributionRights: {
    type: DataTypes.DECIMAL(5, 2),
    validate: {
      min: 0,
      max: 100
    }
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['property_id'] },
    { fields: ['entity_id'] },
    { fields: ['property_id', 'entity_id', 'is_active'] },
    { fields: ['entity_id', 'is_active'] },
    { fields: ['is_primary_owner'] },
    { fields: ['ownership_type'] },
    { fields: ['is_active'] },
    { fields: ['created_by'] },
    { fields: [{ attribute: 'created_at', order: 'DESC' }] }
  ]
});

// Instance methods
PropertyOwnership.prototype.getEquityPercentage = function() {
  if (!this.currentValue || parseFloat(this.currentValue) === 0) return 0;
  const equity = parseFloat(this.equityAmount) || 0;
  const value = parseFloat(this.currentValue);
  return Math.round((equity / value) * 10000) / 100;
};

PropertyOwnership.prototype.getROI = function() {
  if (!this.acquisitionPrice || parseFloat(this.acquisitionPrice) === 0) return 0;
  const currentValue = parseFloat(this.currentValue) || 0;
  const acquisitionPrice = parseFloat(this.acquisitionPrice);
  return Math.round(((currentValue - acquisitionPrice) / acquisitionPrice) * 10000) / 100;
};

PropertyOwnership.prototype.hasVotingControl = function() {
  return this.votingRights && parseFloat(this.votingRights) > 50;
};

PropertyOwnership.prototype.isMajorityOwner = function() {
  return this.ownershipPercentage && parseFloat(this.ownershipPercentage) > 50;
};

PropertyOwnership.prototype.getOwnershipValue = function() {
  if (!this.currentValue || !this.ownershipPercentage) return 0;
  return parseFloat(this.currentValue) * (parseFloat(this.ownershipPercentage) / 100);
};

module.exports = PropertyOwnership;
