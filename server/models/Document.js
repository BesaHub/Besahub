const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Document = sequelize.define('Document', {
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
      len: [1, 255]
    }
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  
  // File Information
  fileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileSize: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0
    }
  },
  mimeType: {
    type: DataTypes.STRING
  },
  fileExtension: {
    type: DataTypes.STRING
  },
  
  // Document Type and Category
  documentType: {
    type: DataTypes.ENUM(
      'contract', 'lease', 'financial', 'legal', 'marketing', 'inspection',
      'survey', 'insurance', 'permit', 'correspondence', 'image', 'other'
    ),
    defaultValue: 'other'
  },
  category: {
    type: DataTypes.ENUM(
      'purchase_agreement', 'lease_agreement', 'listing_agreement', 'offer_letter',
      'financial_statement', 'rent_roll', 'operating_statement', 'appraisal',
      'environmental_report', 'survey', 'title_report', 'insurance_certificate',
      'permit', 'inspection_report', 'marketing_material', 'photo', 'floorplan',
      'email', 'letter', 'memo', 'other'
    )
  },
  
  // Status and Workflow
  status: {
    type: DataTypes.ENUM('draft', 'pending_review', 'approved', 'executed', 'expired', 'archived'),
    defaultValue: 'draft'
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  parentDocumentId: {
    type: DataTypes.UUID,
    references: {
      model: 'documents',
      key: 'id'
    }
  },
  
  // E-Signature Integration
  eSignatureStatus: {
    type: DataTypes.ENUM('not_required', 'pending', 'partial', 'completed', 'declined'),
    defaultValue: 'not_required'
  },
  eSignatureEnvelopeId: {
    type: DataTypes.STRING
  },
  signers: {
    type: DataTypes.JSONB,
    defaultValue: []
    // Example: [{ email: 'user@example.com', name: 'John Doe', status: 'pending', signedAt: null }]
  },
  
  // Relationships
  uploadedById: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  contactId: {
    type: DataTypes.UUID,
    references: {
      model: 'contacts',
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
  companyId: {
    type: DataTypes.UUID,
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  
  // Access Control
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  accessLevel: {
    type: DataTypes.ENUM('private', 'team', 'company', 'client', 'public'),
    defaultValue: 'private'
  },
  allowedUsers: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: []
  },
  
  // Expiration and Reminders
  expirationDate: {
    type: DataTypes.DATE
  },
  reminderDates: {
    type: DataTypes.ARRAY(DataTypes.DATE),
    defaultValue: []
  },
  
  // Metadata
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  customFields: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  
  // Tracking
  downloadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastAccessedAt: {
    type: DataTypes.DATE
  },
  
  // External Storage
  storageProvider: {
    type: DataTypes.ENUM('local', 'aws_s3', 'google_drive', 'dropbox', 'onedrive'),
    defaultValue: 'local'
  },
  externalId: {
    type: DataTypes.STRING
  },
  publicUrl: {
    type: DataTypes.STRING
  },
  
  // OCR and Content
  hasOcr: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ocrText: {
    type: DataTypes.TEXT
  },
  
  // Checksum for integrity
  checksum: {
    type: DataTypes.STRING
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['property_id'] },
    { fields: ['deal_id'] },
    { fields: ['contact_id'] },
    { fields: ['company_id'] },
    { fields: ['uploaded_by_id'] },
    { fields: [{ attribute: 'created_at', order: 'DESC' }] },
    { fields: ['document_type'] }
  ]
});

// Instance methods
Document.prototype.incrementDownloadCount = async function() {
  this.downloadCount += 1;
  this.lastAccessedAt = new Date();
  await this.save();
};

Document.prototype.isExpired = function() {
  if (!this.expirationDate) return false;
  return new Date() > new Date(this.expirationDate);
};

Document.prototype.getDaysUntilExpiration = function() {
  if (!this.expirationDate) return null;
  const today = new Date();
  const expiration = new Date(this.expirationDate);
  const diffTime = expiration - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

Document.prototype.isSignedByAll = function() {
  if (!this.signers || this.signers.length === 0) return true;
  return this.signers.every(signer => signer.status === 'completed');
};

Document.prototype.getSigningProgress = function() {
  if (!this.signers || this.signers.length === 0) return 100;
  const completed = this.signers.filter(signer => signer.status === 'completed').length;
  return Math.round((completed / this.signers.length) * 100);
};

Document.prototype.createNewVersion = async function(newFilePath, uploadedById) {
  const newDocument = await Document.create({
    name: this.name,
    originalName: this.originalName,
    description: this.description,
    fileName: this.fileName,
    filePath: newFilePath,
    fileSize: this.fileSize,
    mimeType: this.mimeType,
    fileExtension: this.fileExtension,
    documentType: this.documentType,
    category: this.category,
    version: this.version + 1,
    parentDocumentId: this.parentDocumentId || this.id,
    uploadedById,
    contactId: this.contactId,
    propertyId: this.propertyId,
    dealId: this.dealId,
    companyId: this.companyId,
    accessLevel: this.accessLevel,
    tags: this.tags,
    customFields: this.customFields
  });
  
  return newDocument;
};

module.exports = Document;