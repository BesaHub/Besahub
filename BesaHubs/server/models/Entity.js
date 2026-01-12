const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Entity = sequelize.define('Entity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 200]
    }
  },
  entityType: {
    type: DataTypes.ENUM(
      'individual', 'llc', 'partnership', 'trust', 
      'corporation', 'investment_fund', 'reit', 'other'
    ),
    allowNull: false
  },
  legalName: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 200]
    }
  },
  taxId: {
    type: DataTypes.STRING,
    unique: true,
    validate: {
      len: [0, 50]
    }
  },
  registrationNumber: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 100]
    }
  },
  registrationState: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 2]
    }
  },
  formationDate: {
    type: DataTypes.DATE,
    validate: {
      isDate: true
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
  companyId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  primaryContact: {
    type: DataTypes.JSONB,
    defaultValue: {
      name: null,
      email: null,
      phone: null
    }
  },
  address: {
    type: DataTypes.JSONB,
    defaultValue: {
      street: null,
      city: null,
      state: null,
      zip: null,
      country: 'US'
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
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
    { fields: ['name'] },
    { fields: ['entity_type'] },
    { fields: ['tax_id'], unique: true, where: { tax_id: { [require('sequelize').Op.ne]: null } } },
    { fields: ['is_active'] },
    { fields: ['entity_type', 'is_active'] },
    { fields: ['contact_id'] },
    { fields: ['company_id'] },
    { fields: ['created_by'] },
    { fields: [{ attribute: 'created_at', order: 'DESC' }] }
  ]
});

// Instance methods
Entity.prototype.getDisplayName = function() {
  return this.legalName || this.name;
};

Entity.prototype.getFullAddress = function() {
  if (!this.address || !this.address.street) return null;
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}`.trim();
};

Entity.prototype.hasContact = function() {
  return !!(this.contactId || (this.primaryContact && this.primaryContact.email));
};

Entity.prototype.isIndividual = function() {
  return this.entityType === 'individual';
};

Entity.prototype.isCorporate = function() {
  return ['llc', 'corporation', 'partnership', 'trust', 'investment_fund', 'reit'].includes(this.entityType);
};

module.exports = Entity;
