const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const campaignTypes = ['email', 'newsletter', 'property_promo', 'investor_update', 'event'];
const campaignStatuses = ['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled'];
const recipientTypes = ['all_contacts', 'filtered', 'custom_list', 'specific'];

const Campaign = sequelize.define('Campaign', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 200]
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  type: {
    type: DataTypes.ENUM(...campaignTypes),
    allowNull: false,
    defaultValue: 'email'
  },
  status: {
    type: DataTypes.ENUM(...campaignStatuses),
    defaultValue: 'draft',
    allowNull: false
  },
  
  // Email Content
  subject: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 300]
    }
  },
  emailBody: {
    type: DataTypes.TEXT
  },
  plainTextBody: {
    type: DataTypes.TEXT
  },
  templateId: {
    type: DataTypes.STRING
  },
  
  // Recipients
  recipientType: {
    type: DataTypes.ENUM(...recipientTypes),
    defaultValue: 'all_contacts',
    allowNull: false
  },
  recipientFilters: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  recipientList: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  
  // Scheduling
  scheduledDate: {
    type: DataTypes.DATE
  },
  sentDate: {
    type: DataTypes.DATE
  },
  
  // Relationships
  createdById: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  propertyId: {
    type: DataTypes.UUID,
    references: {
      model: 'properties',
      key: 'id'
    }
  },
  dealId: {
    type: DataTypes.UUID,
    references: {
      model: 'deals',
      key: 'id'
    }
  },
  
  // Analytics
  totalRecipients: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  sentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  openedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  clickedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  bouncedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  unsubscribedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  
  // Metadata
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  attachments: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  
  // System fields
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['created_by_id'] },
    { fields: ['property_id'] },
    { fields: ['deal_id'] },
    { fields: ['status', 'type'] },
    { fields: ['scheduled_date'] },
    { fields: ['sent_date'] },
    { fields: [{ attribute: 'created_at', order: 'DESC' }] },
    { fields: ['is_active'] }
  ]
});

// Instance methods
Campaign.prototype.getOpenRate = function() {
  if (this.sentCount === 0) return 0;
  return ((this.openedCount / this.sentCount) * 100).toFixed(2);
};

Campaign.prototype.getClickRate = function() {
  if (this.sentCount === 0) return 0;
  return ((this.clickedCount / this.sentCount) * 100).toFixed(2);
};

Campaign.prototype.getBounceRate = function() {
  if (this.sentCount === 0) return 0;
  return ((this.bouncedCount / this.sentCount) * 100).toFixed(2);
};

Campaign.prototype.getUnsubscribeRate = function() {
  if (this.sentCount === 0) return 0;
  return ((this.unsubscribedCount / this.sentCount) * 100).toFixed(2);
};

Campaign.prototype.canBeSent = function() {
  return ['draft', 'scheduled', 'paused'].includes(this.status);
};

Campaign.prototype.canBePaused = function() {
  return this.status === 'sending';
};

Campaign.prototype.canBeCancelled = function() {
  return ['draft', 'scheduled', 'paused'].includes(this.status);
};

Campaign.prototype.markAsSending = async function() {
  if (!this.canBeSent()) {
    throw new Error(`Cannot send campaign with status: ${this.status}`);
  }
  this.status = 'sending';
  await this.save();
};

Campaign.prototype.markAsSent = async function() {
  this.status = 'sent';
  this.sentDate = new Date();
  await this.save();
};

Campaign.prototype.pause = async function() {
  if (!this.canBePaused()) {
    throw new Error(`Cannot pause campaign with status: ${this.status}`);
  }
  this.status = 'paused';
  await this.save();
};

Campaign.prototype.cancel = async function() {
  if (!this.canBeCancelled()) {
    throw new Error(`Cannot cancel campaign with status: ${this.status}`);
  }
  this.status = 'cancelled';
  await this.save();
};

Campaign.prototype.schedule = async function(scheduledDate) {
  if (!this.canBeSent()) {
    throw new Error(`Cannot schedule campaign with status: ${this.status}`);
  }
  this.status = 'scheduled';
  this.scheduledDate = scheduledDate;
  await this.save();
};

module.exports = Campaign;
module.exports.campaignTypes = campaignTypes;
module.exports.campaignStatuses = campaignStatuses;
module.exports.recipientTypes = recipientTypes;
