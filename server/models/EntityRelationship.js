const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EntityRelationship = sequelize.define('EntityRelationship', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sourceEntityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'entities',
      key: 'id'
    }
  },
  targetEntityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'entities',
      key: 'id'
    },
    validate: {
      notSameAsSource(value) {
        if (value === this.sourceEntityId) {
          throw new Error('Entity cannot have a relationship with itself');
        }
      }
    }
  },
  relationshipType: {
    type: DataTypes.ENUM(
      'parent_subsidiary', 'partner', 'affiliate', 'beneficial_owner',
      'controlled_by', 'manages', 'advises', 'guarantor', 'member',
      'shareholder', 'trustee', 'beneficiary', 'other'
    ),
    allowNull: false
  },
  relationshipStrength: {
    type: DataTypes.ENUM('direct', 'indirect', 'controlling', 'non_controlling'),
    defaultValue: 'direct'
  },
  ownershipPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    validate: {
      min: 0,
      max: 100
    }
  },
  startDate: {
    type: DataTypes.DATE,
    validate: {
      isDate: true
    }
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isDate: true,
      isAfterStart(value) {
        if (value && this.startDate && value <= this.startDate) {
          throw new Error('End date must be after start date');
        }
      }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
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
    { fields: ['source_entity_id'] },
    { fields: ['target_entity_id'] },
    { fields: ['source_entity_id', 'target_entity_id', 'is_active'] },
    { fields: ['relationship_type'] },
    { fields: ['relationship_type', 'is_active'] },
    { fields: ['relationship_strength'] },
    { fields: ['is_active'] },
    { fields: ['created_by'] },
    { fields: [{ attribute: 'created_at', order: 'DESC' }] }
  ]
});

// Instance methods
EntityRelationship.prototype.isCurrent = function() {
  const now = new Date();
  return this.isActive && (!this.endDate || this.endDate >= now);
};

EntityRelationship.prototype.isHistorical = function() {
  return this.endDate && this.endDate < new Date();
};

EntityRelationship.prototype.getDuration = function() {
  const start = this.startDate || this.createdAt;
  const end = this.endDate || new Date();
  
  if (!start) return null;
  
  const years = (end.getFullYear() - start.getFullYear());
  const months = (end.getMonth() - start.getMonth());
  const totalMonths = years * 12 + months;
  
  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
    totalMonths
  };
};

EntityRelationship.prototype.isControllingRelationship = function() {
  return this.relationshipStrength === 'controlling' || 
         (this.ownershipPercentage && parseFloat(this.ownershipPercentage) > 50);
};

EntityRelationship.prototype.getRelationshipLabel = function() {
  return this.relationshipType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

module.exports = EntityRelationship;
