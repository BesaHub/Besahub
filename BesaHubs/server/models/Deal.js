const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const dealStages = [
  'prospecting', 'qualification', 'proposal', 'negotiation', 
  'contract', 'due_diligence', 'closing', 'won', 'lost'
];

const dealTypes = ['sale', 'lease', 'investment'];

const Deal = sequelize.define('Deal', {
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
  dealType: {
    type: DataTypes.ENUM(...dealTypes),
    allowNull: false
  },
  stage: {
    type: DataTypes.ENUM(...dealStages),
    defaultValue: 'prospecting'
  },
  
  // Financial Information
  value: {
    type: DataTypes.DECIMAL(15, 2),
    validate: {
      min: 0
    }
  },
  commission: {
    type: DataTypes.DECIMAL(12, 2),
    validate: {
      min: 0
    }
  },
  commissionRate: {
    type: DataTypes.DECIMAL(5, 4),
    validate: {
      min: 0,
      max: 1
    }
  },
  
  // Lease specific fields
  leaseTermMonths: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1
    }
  },
  monthlyRent: {
    type: DataTypes.DECIMAL(10, 2),
    validate: {
      min: 0
    }
  },
  annualRent: {
    type: DataTypes.DECIMAL(12, 2),
    validate: {
      min: 0
    }
  },
  securityDeposit: {
    type: DataTypes.DECIMAL(10, 2),
    validate: {
      min: 0
    }
  },
  
  // Relationships
  propertyId: {
    type: DataTypes.UUID,
    references: {
      model: 'properties',
      key: 'id'
    }
  },
  primaryContactId: {
    type: DataTypes.UUID,
    references: {
      model: 'contacts',
      key: 'id'
    }
  },
  listingAgentId: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  buyerAgentId: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  // Timeline
  expectedCloseDate: {
    type: DataTypes.DATE
  },
  actualCloseDate: {
    type: DataTypes.DATE
  },
  contractDate: {
    type: DataTypes.DATE
  },
  leaseStartDate: {
    type: DataTypes.DATE
  },
  leaseEndDate: {
    type: DataTypes.DATE
  },
  
  // Probability and Status
  probability: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    validate: {
      min: 0,
      max: 100
    }
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  
  // Deal Details
  description: {
    type: DataTypes.TEXT
  },
  terms: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  
  // Competition and Market
  competitors: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  lostReason: {
    type: DataTypes.ENUM(
      'price', 'timing', 'location', 'terms', 'competition', 
      'financing', 'condition', 'other', 'no_response'
    )
  },
  lostReasonNotes: {
    type: DataTypes.TEXT
  },
  
  // Marketing and Lead Source
  leadSource: {
    type: DataTypes.ENUM(
      'referral', 'website', 'cold_call', 'email_campaign', 'social_media',
      'networking', 'advertisement', 'mls', 'existing_client', 'other'
    )
  },
  referralSource: {
    type: DataTypes.STRING
  },
  
  // Documents and Files
  documents: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  
  // Tracking
  stageHistory: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  activities: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  
  // System fields
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  // Custom fields
  customFields: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['property_id'] },
    { fields: ['primary_contact_id'] },
    { fields: ['listing_agent_id'] },
    { fields: ['buyer_agent_id'] },
    { fields: ['stage', 'deal_type'] },
    { fields: ['expected_close_date'] },
    { fields: ['actual_close_date'] },
    { fields: [{ attribute: 'created_at', order: 'DESC' }] },
    { fields: ['value'] }
  ]
});

// Instance methods
Deal.prototype.updateStage = async function(newStage, userId) {
  const oldStage = this.stage;
  this.stage = newStage;
  
  // Add to stage history
  const stageHistory = this.stageHistory || [];
  stageHistory.push({
    from: oldStage,
    to: newStage,
    changedBy: userId,
    changedAt: new Date(),
    probability: this.probability
  });
  this.stageHistory = stageHistory;
  
  // Update probability based on stage
  const stageProbabilities = {
    'prospecting': 10,
    'qualification': 25,
    'proposal': 40,
    'negotiation': 60,
    'contract': 80,
    'due_diligence': 90,
    'closing': 95,
    'won': 100,
    'lost': 0
  };
  
  if (stageProbabilities[newStage] !== undefined) {
    this.probability = stageProbabilities[newStage];
  }
  
  // Set close date if won
  if (newStage === 'won' && !this.actualCloseDate) {
    this.actualCloseDate = new Date();
  }
  
  await this.save();
};

Deal.prototype.calculateCommission = function() {
  if (!this.value || !this.commissionRate) return 0;
  return this.value * this.commissionRate;
};

Deal.prototype.getDaysInStage = function() {
  const stageHistory = this.stageHistory || [];
  const currentStageEntry = stageHistory
    .reverse()
    .find(entry => entry.to === this.stage);
  
  if (!currentStageEntry) return 0;
  
  const stageStartDate = new Date(currentStageEntry.changedAt);
  const now = new Date();
  return Math.floor((now - stageStartDate) / (1000 * 60 * 60 * 24));
};

Deal.prototype.isOverdue = function() {
  if (!this.expectedCloseDate) return false;
  return new Date() > new Date(this.expectedCloseDate) && this.stage !== 'won' && this.stage !== 'lost';
};

Deal.prototype.getWeightedValue = function() {
  return (this.value || 0) * (this.probability / 100);
};

module.exports = Deal;
module.exports.dealStages = dealStages;
module.exports.dealTypes = dealTypes;