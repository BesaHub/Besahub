const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { encryptValue, decryptValue } = require('../utils/encryption');

const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('individual', 'company'),
    defaultValue: 'individual'
  },
  
  // Personal Information
  firstName: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 50]
    }
  },
  lastName: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 50]
    }
  },
  companyName: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 200]
    }
  },
  title: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 100]
    }
  },
  
  // Contact Information
  primaryEmail: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  secondaryEmail: {
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
  secondaryPhone: {
    type: DataTypes.STRING,
    validate: {
      is: /^[\d\s\-\+\(\)\.]+$/
    }
  },
  mobilePhone: {
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
  mailingAddress: {
    type: DataTypes.STRING
  },
  mailingCity: {
    type: DataTypes.STRING
  },
  mailingState: {
    type: DataTypes.STRING,
    validate: {
      len: [0, 2]
    }
  },
  mailingZipCode: {
    type: DataTypes.STRING,
    validate: {
      is: /^\d{5}(-\d{4})?$/
    }
  },
  
  // CRE Specific Fields
  contactRole: {
    type: DataTypes.ENUM(
      'tenant', 'landlord', 'buyer', 'seller', 'investor', 
      'broker', 'attorney', 'lender', 'contractor', 'vendor', 'other'
    ),
    allowNull: false,
    defaultValue: 'other'
  },
  leadSource: {
    type: DataTypes.ENUM(
      'referral', 'website', 'cold_call', 'email_campaign', 'social_media',
      'networking', 'advertisement', 'trade_show', 'other'
    )
  },
  leadStatus: {
    type: DataTypes.ENUM(
      'cold', 'warm', 'hot', 'qualified', 'converted', 'lost', 'inactive'
    ),
    defaultValue: 'cold'
  },
  creditRating: {
    type: DataTypes.ENUM('A', 'B', 'C', 'D', 'unrated'),
    defaultValue: 'unrated'
  },
  netWorth: {
    type: DataTypes.DECIMAL(15, 2),
    validate: {
      min: 0
    }
  },
  liquidity: {
    type: DataTypes.DECIMAL(15, 2),
    validate: {
      min: 0
    }
  },
  
  // Property Preferences (for tenants/buyers)
  propertyTypeInterest: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  budgetMin: {
    type: DataTypes.DECIMAL(12, 2),
    validate: {
      min: 0
    }
  },
  budgetMax: {
    type: DataTypes.DECIMAL(12, 2),
    validate: {
      min: 0
    }
  },
  squareFootageMin: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0
    }
  },
  squareFootageMax: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0
    }
  },
  preferredLocations: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  timeframe: {
    type: DataTypes.ENUM('immediate', '30_days', '60_days', '90_days', '6_months', '1_year', 'flexible')
  },
  
  // Relationship Management
  companyId: {
    type: DataTypes.UUID,
    references: {
      model: 'companies',
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
  parentContactId: {
    type: DataTypes.UUID,
    references: {
      model: 'contacts',
      key: 'id'
    }
  },
  
  // Communication Preferences
  preferredContactMethod: {
    type: DataTypes.ENUM('email', 'phone', 'text', 'mail'),
    defaultValue: 'email'
  },
  communicationFrequency: {
    type: DataTypes.ENUM('daily', 'weekly', 'bi_weekly', 'monthly', 'quarterly', 'as_needed'),
    defaultValue: 'as_needed'
  },
  doNotCall: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  doNotEmail: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  doNotText: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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
  
  // Notes and Tracking
  notes: {
    type: DataTypes.TEXT
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
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
  source: {
    type: DataTypes.STRING,
    defaultValue: 'manual'
  },
  avatar: {
    type: DataTypes.STRING
  },
  
  // Custom fields for CRE
  customFields: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  underscored: true,
  hooks: {
    /**
     * SECURITY: Encrypt PII fields before creating contact
     * - Emails: primaryEmail, secondaryEmail
     * - Phones: primaryPhone, secondaryPhone, mobilePhone, fax
     */
    beforeCreate: async (contact) => {
      try {
        if (process.env.ENCRYPTION_KEY) {
          // Encrypt email fields
          if (contact.primaryEmail) {
            contact.primaryEmail = await encryptValue(contact.primaryEmail);
          }
          if (contact.secondaryEmail) {
            contact.secondaryEmail = await encryptValue(contact.secondaryEmail);
          }
          
          // Encrypt phone fields
          if (contact.primaryPhone) {
            contact.primaryPhone = await encryptValue(contact.primaryPhone);
          }
          if (contact.secondaryPhone) {
            contact.secondaryPhone = await encryptValue(contact.secondaryPhone);
          }
          if (contact.mobilePhone) {
            contact.mobilePhone = await encryptValue(contact.mobilePhone);
          }
          if (contact.fax) {
            contact.fax = await encryptValue(contact.fax);
          }
        }
      } catch (error) {
        console.warn('⚠️ Contact PII encryption failed:', error.message);
      }
    },
    
    /**
     * SECURITY: Encrypt changed PII fields on update
     */
    beforeUpdate: async (contact) => {
      try {
        if (process.env.ENCRYPTION_KEY) {
          // Encrypt email fields if changed
          if (contact.changed('primaryEmail') && contact.primaryEmail) {
            contact.primaryEmail = await encryptValue(contact.primaryEmail);
          }
          if (contact.changed('secondaryEmail') && contact.secondaryEmail) {
            contact.secondaryEmail = await encryptValue(contact.secondaryEmail);
          }
          
          // Encrypt phone fields if changed
          if (contact.changed('primaryPhone') && contact.primaryPhone) {
            contact.primaryPhone = await encryptValue(contact.primaryPhone);
          }
          if (contact.changed('secondaryPhone') && contact.secondaryPhone) {
            contact.secondaryPhone = await encryptValue(contact.secondaryPhone);
          }
          if (contact.changed('mobilePhone') && contact.mobilePhone) {
            contact.mobilePhone = await encryptValue(contact.mobilePhone);
          }
          if (contact.changed('fax') && contact.fax) {
            contact.fax = await encryptValue(contact.fax);
          }
        }
      } catch (error) {
        console.warn('⚠️ Contact PII encryption failed:', error.message);
      }
    },
    
    /**
     * SECURITY: Decrypt PII fields after reading from database
     */
    afterFind: async (result) => {
      if (!result || !process.env.ENCRYPTION_KEY) return;
      
      const decryptContact = async (contact) => {
        if (!contact) return;
        
        try {
          // Decrypt email fields
          if (contact.primaryEmail && Buffer.isBuffer(contact.primaryEmail)) {
            contact.primaryEmail = await decryptValue(contact.primaryEmail);
          }
          if (contact.secondaryEmail && Buffer.isBuffer(contact.secondaryEmail)) {
            contact.secondaryEmail = await decryptValue(contact.secondaryEmail);
          }
          
          // Decrypt phone fields
          if (contact.primaryPhone && Buffer.isBuffer(contact.primaryPhone)) {
            contact.primaryPhone = await decryptValue(contact.primaryPhone);
          }
          if (contact.secondaryPhone && Buffer.isBuffer(contact.secondaryPhone)) {
            contact.secondaryPhone = await decryptValue(contact.secondaryPhone);
          }
          if (contact.mobilePhone && Buffer.isBuffer(contact.mobilePhone)) {
            contact.mobilePhone = await decryptValue(contact.mobilePhone);
          }
          if (contact.fax && Buffer.isBuffer(contact.fax)) {
            contact.fax = await decryptValue(contact.fax);
          }
        } catch (error) {
          console.warn('⚠️ Contact PII decryption failed:', error.message);
        }
      };
      
      // Handle both single instance and arrays
      if (Array.isArray(result)) {
        await Promise.all(result.map(decryptContact));
      } else {
        await decryptContact(result);
      }
    }
  },
  indexes: [
    { fields: ['assigned_agent_id'] },
    { fields: ['lead_status'] },
    { fields: ['lead_source', 'contact_role'] },
    { fields: ['primary_email'] },
    { fields: [{ attribute: 'created_at', order: 'DESC' }] }
  ]
});

// Instance methods
Contact.prototype.getFullName = function() {
  if (this.type === 'company') {
    return this.companyName || 'Unnamed Company';
  }
  return `${this.firstName || ''} ${this.lastName || ''}`.trim() || 'Unknown';
};

Contact.prototype.getDisplayName = function() {
  const fullName = this.getFullName();
  if (this.type === 'individual' && this.companyName) {
    return `${fullName} (${this.companyName})`;
  }
  return fullName;
};

Contact.prototype.getPrimaryContact = function() {
  return this.primaryEmail || this.primaryPhone || this.mobilePhone;
};

Contact.prototype.getFullAddress = function() {
  if (!this.mailingAddress) return null;
  return `${this.mailingAddress}, ${this.mailingCity}, ${this.mailingState} ${this.mailingZipCode}`.trim();
};

Contact.prototype.isQualifiedLead = function() {
  return ['qualified', 'hot'].includes(this.leadStatus);
};

Contact.prototype.updateLastContact = async function() {
  this.lastContactDate = new Date();
  await this.save();
};

module.exports = Contact;