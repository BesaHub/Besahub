const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { encryptValue, decryptValue } = require('../utils/encryption');

const Company = sequelize.define('Company', {
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
  legalName: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 200]
    }
  },
  dbaName: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 200]
    }
  },
  
  // Company Type and Industry
  companyType: {
    type: DataTypes.ENUM(
      'corporation', 'llc', 'partnership', 'sole_proprietorship',
      'trust', 'non_profit', 'government', 'other'
    )
  },
  industry: {
    type: DataTypes.ENUM(
      'real_estate', 'commercial_real_estate', 'real_estate_investment', 'real_estate_development', 'property_management',
      'retail', 'hospitality', 'healthcare', 'manufacturing', 'technology',
      'finance', 'legal', 'construction', 'other'
    )
  },
  
  // Contact Information
  primaryEmail: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  primaryPhone: {
    type: DataTypes.STRING,
    validate: {
      is: /^[\d\s\-\+\(\)\.]+$/
    }
  },
  fax: {
    type: DataTypes.STRING,
    validate: {
      is: /^[\d\s\-\+\(\)\.]+$/
    }
  },
  website: {
    type: DataTypes.STRING,
    validate: {
      isUrl: true
    }
  },
  
  // Address Information
  address: {
    type: DataTypes.STRING
  },
  city: {
    type: DataTypes.STRING
  },
  state: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 2]
    }
  },
  zipCode: {
    type: DataTypes.STRING,
    validate: {
      is: /^\d{5}(-\d{4})?$/
    }
  },
  country: {
    type: DataTypes.STRING,
    defaultValue: 'US'
  },
  
  // Business Information
  taxId: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 20]
    }
  },
  dunsNumber: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 20]
    }
  },
  licenseNumber: {
    type: DataTypes.STRING
  },
  incorporationDate: {
    type: DataTypes.DATE
  },
  incorporationState: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 2]
    }
  },
  
  // Financial Information
  annualRevenue: {
    type: DataTypes.DECIMAL(15, 2),
    validate: {
      min: 0
    }
  },
  employeeCount: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0
    }
  },
  creditRating: {
    type: DataTypes.ENUM('AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'CC', 'C', 'D', 'unrated'),
    defaultValue: 'unrated'
  },
  netWorth: {
    type: DataTypes.DECIMAL(15, 2),
    validate: {
      min: 0
    }
  },
  
  // CRE Specific
  portfolioValue: {
    type: DataTypes.DECIMAL(15, 2),
    validate: {
      min: 0
    }
  },
  propertyTypes: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  investmentCriteria: {
    type: DataTypes.JSONB,
    defaultValue: {
      minInvestment: null,
      maxInvestment: null,
      preferredLocations: [],
      capRateRange: { min: null, max: null },
      cashOnCashRange: { min: null, max: null }
    }
  },
  
  // Relationships
  primaryContactId: {
    type: DataTypes.UUID,
    references: {
      model: 'contacts',
      key: 'id'
    }
  },
  assignedAgentId: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  parentCompanyId: {
    type: DataTypes.UUID,
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  
  // Lead Management
  leadSource: {
    type: DataTypes.ENUM(
      'referral', 'website', 'cold_call', 'email_campaign', 'social_media',
      'networking', 'advertisement', 'trade_show', 'existing_client', 'other'
    )
  },
  leadStatus: {
    type: DataTypes.ENUM(
      'cold', 'warm', 'hot', 'qualified', 'customer', 'inactive'
    ),
    defaultValue: 'cold'
  },
  
  // Social Media
  linkedInUrl: {
    type: DataTypes.STRING,
    validate: {
      isUrl: true
    }
  },
  facebookUrl: {
    type: DataTypes.STRING,
    validate: {
      isUrl: true
    }
  },
  twitterUrl: {
    type: DataTypes.STRING,
    validate: {
      isUrl: true
    }
  },
  
  // Description and Notes
  description: {
    type: DataTypes.TEXT
  },
  notes: {
    type: DataTypes.TEXT
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  
  // Tracking
  lastContactDate: {
    type: DataTypes.DATE
  },
  nextFollowUpDate: {
    type: DataTypes.DATE
  },
  
  // System fields
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  logo: {
    type: DataTypes.STRING
  },
  
  // Custom fields
  customFields: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  underscored: true,
  hooks: {
    /**
     * SECURITY: Encrypt PII fields before creating company
     * - Email: primaryEmail
     * - Phone: primaryPhone, fax
     * - Tax ID: taxId (EIN/Tax identification number)
     */
    beforeCreate: async (company) => {
      try {
        if (process.env.ENCRYPTION_KEY) {
          // Encrypt email
          if (company.primaryEmail) {
            company.primaryEmail = await encryptValue(company.primaryEmail);
          }
          
          // Encrypt phone fields
          if (company.primaryPhone) {
            company.primaryPhone = await encryptValue(company.primaryPhone);
          }
          if (company.fax) {
            company.fax = await encryptValue(company.fax);
          }
          
          // Encrypt tax ID (sensitive business PII)
          if (company.taxId) {
            company.taxId = await encryptValue(company.taxId);
          }
        }
      } catch (error) {
        console.warn('⚠️ Company PII encryption failed:', error.message);
      }
    },
    
    /**
     * SECURITY: Encrypt changed PII fields on update
     */
    beforeUpdate: async (company) => {
      try {
        if (process.env.ENCRYPTION_KEY) {
          // Encrypt email if changed
          if (company.changed('primaryEmail') && company.primaryEmail) {
            company.primaryEmail = await encryptValue(company.primaryEmail);
          }
          
          // Encrypt phone fields if changed
          if (company.changed('primaryPhone') && company.primaryPhone) {
            company.primaryPhone = await encryptValue(company.primaryPhone);
          }
          if (company.changed('fax') && company.fax) {
            company.fax = await encryptValue(company.fax);
          }
          
          // Encrypt tax ID if changed
          if (company.changed('taxId') && company.taxId) {
            company.taxId = await encryptValue(company.taxId);
          }
        }
      } catch (error) {
        console.warn('⚠️ Company PII encryption failed:', error.message);
      }
    },
    
    /**
     * SECURITY: Decrypt PII fields after reading from database
     */
    afterFind: async (result) => {
      if (!result || !process.env.ENCRYPTION_KEY) return;
      
      const decryptCompany = async (company) => {
        if (!company) return;
        
        try {
          // Decrypt email
          if (company.primaryEmail && Buffer.isBuffer(company.primaryEmail)) {
            company.primaryEmail = await decryptValue(company.primaryEmail);
          }
          
          // Decrypt phone fields
          if (company.primaryPhone && Buffer.isBuffer(company.primaryPhone)) {
            company.primaryPhone = await decryptValue(company.primaryPhone);
          }
          if (company.fax && Buffer.isBuffer(company.fax)) {
            company.fax = await decryptValue(company.fax);
          }
          
          // Decrypt tax ID
          if (company.taxId && Buffer.isBuffer(company.taxId)) {
            company.taxId = await decryptValue(company.taxId);
          }
        } catch (error) {
          console.warn('⚠️ Company PII decryption failed:', error.message);
        }
      };
      
      // Handle both single instance and arrays
      if (Array.isArray(result)) {
        await Promise.all(result.map(decryptCompany));
      } else {
        await decryptCompany(result);
      }
    }
  },
  indexes: [
    { fields: ['name'] },
    { fields: ['industry', 'company_type'] },
    { fields: ['assigned_agent_id'] },
    { fields: ['lead_status'] },
    { fields: ['city', 'state'] },
    { fields: ['primary_contact_id'] },
    { fields: [{ attribute: 'created_at', order: 'DESC' }] }
  ]
});

// Instance methods
Company.prototype.getFullAddress = function() {
  if (!this.address) return null;
  return `${this.address}, ${this.city}, ${this.state} ${this.zipCode}`.trim();
};

Company.prototype.updateLastContact = async function() {
  this.lastContactDate = new Date();
  await this.save();
};

Company.prototype.isQualifiedLead = function() {
  return ['qualified', 'hot'].includes(this.leadStatus);
};

Company.prototype.getInvestmentRange = function() {
  const criteria = this.investmentCriteria || {};
  if (!criteria.minInvestment && !criteria.maxInvestment) return null;
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  if (criteria.minInvestment && criteria.maxInvestment) {
    return `${formatter.format(criteria.minInvestment)} - ${formatter.format(criteria.maxInvestment)}`;
  } else if (criteria.minInvestment) {
    return `${formatter.format(criteria.minInvestment)}+`;
  } else if (criteria.maxInvestment) {
    return `Up to ${formatter.format(criteria.maxInvestment)}`;
  }
  
  return null;
};

Company.prototype.matchesInvestmentCriteria = function(property) {
  const criteria = this.investmentCriteria || {};
  
  // Check investment amount
  if (criteria.minInvestment && property.listPrice < criteria.minInvestment) return false;
  if (criteria.maxInvestment && property.listPrice > criteria.maxInvestment) return false;
  
  // Check location
  if (criteria.preferredLocations && criteria.preferredLocations.length > 0) {
    const propertyLocation = `${property.city}, ${property.state}`;
    if (!criteria.preferredLocations.some(loc => 
      propertyLocation.toLowerCase().includes(loc.toLowerCase())
    )) return false;
  }
  
  // Check cap rate
  if (property.capRate) {
    if (criteria.capRateRange?.min && property.capRate < criteria.capRateRange.min) return false;
    if (criteria.capRateRange?.max && property.capRate > criteria.capRateRange.max) return false;
  }
  
  return true;
};

module.exports = Company;