const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Property = sequelize.define('Property', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  // ========== BASIC INFO ==========
  // Property Title
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 200]
    }
  },
  // Property ID (internal tracking)
  internalPropertyId: {
    type: DataTypes.STRING,
    unique: true
  },
  mlsNumber: {
    type: DataTypes.STRING,
    unique: true,
    validate: {
      len: [0, 50]
    }
  },
  // Property Type
  propertyType: {
    type: DataTypes.ENUM(
      'office', 'retail', 'industrial', 'land', 'multifamily', 
      'warehouse', 'hotel', 'mixed_use', 'medical', 'restaurant', 'other'
    ),
    allowNull: false
  },
  // Status (For Sale, For Lease, Sold, Leased)
  status: {
    type: DataTypes.ENUM(
      'for_sale', 'for_lease', 'sold', 'leased', 'off_market', 'coming_soon'
    ),
    defaultValue: 'for_sale'
  },
  listingType: {
    type: DataTypes.ENUM('sale', 'lease', 'both'),
    allowNull: false,
    defaultValue: 'sale'
  },
  // Address (Street, City, State, ZIP)
  address: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 2]
    }
  },
  zipCode: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^\d{5}(-\d{4})?$/
    }
  },
  county: {
    type: DataTypes.STRING
  },
  // Listing Date
  listingDate: {
    type: DataTypes.DATE
  },
  // Expiration Date
  expirationDate: {
    type: DataTypes.DATE
  },
  
  // ========== FINANCIALS ==========
  // Sale Price / Rent Price
  listPrice: {
    type: DataTypes.DECIMAL(12, 2),
    validate: {
      min: 0
    }
  },
  leaseRate: {
    type: DataTypes.DECIMAL(10, 2),
    validate: {
      min: 0
    }
  },
  leaseRateUnit: {
    type: DataTypes.ENUM('monthly', 'annual', 'per_sqft_monthly', 'per_sqft_annual'),
    defaultValue: 'per_sqft_annual'
  },
  // Price per Sq Ft or per Month
  pricePerSquareFoot: {
    type: DataTypes.DECIMAL(10, 2),
    validate: {
      min: 0
    }
  },
  // Gross Income
  grossIncome: {
    type: DataTypes.DECIMAL(12, 2),
    validate: {
      min: 0
    }
  },
  // Operating Expenses
  operatingExpenses: {
    type: DataTypes.DECIMAL(10, 2),
    validate: {
      min: 0
    }
  },
  // Property Taxes
  propertyTaxes: {
    type: DataTypes.DECIMAL(10, 2),
    validate: {
      min: 0
    }
  },
  // HOA Fees (optional)
  hoaFees: {
    type: DataTypes.DECIMAL(10, 2),
    validate: {
      min: 0
    }
  },
  // Cap Rate
  capRate: {
    type: DataTypes.DECIMAL(5, 4),
    validate: {
      min: 0,
      max: 1
    }
  },
  // NOI (Net Operating Income)
  netOperatingIncome: {
    type: DataTypes.DECIMAL(12, 2)
  },
  // Lease Terms (e.g., 3-year NNN)
  leaseType: {
    type: DataTypes.ENUM('NNN', 'Gross', 'Modified', 'Full Service'),
    allowNull: true
  },
  leaseTermsDescription: {
    type: DataTypes.STRING,
    comment: 'e.g., 3-year NNN, 5-year Gross'
  },
  leaseTerms: {
    type: DataTypes.JSONB,
    defaultValue: {
      minTerm: null,
      maxTerm: null,
      renewalOptions: null,
      securityDeposit: null,
      personalGuaranteeRequired: false
    }
  },
  
  // ========== PROPERTY DETAILS ==========
  // Building Size (sq ft) - mapped to totalSquareFootage for compatibility
  totalSquareFootage: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0
    }
  },
  availableSquareFootage: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0
    }
  },
  // Lot Size (sq ft or acres) - mapped to lotSize for compatibility
  lotSize: {
    type: DataTypes.DECIMAL(12, 2),
    validate: {
      min: 0
    }
  },
  lotSizeUnit: {
    type: DataTypes.ENUM('sqft', 'acres'),
    defaultValue: 'sqft'
  },
  // Year Built
  yearBuilt: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1800,
      max: new Date().getFullYear() + 5
    }
  },
  // Renovation Year (optional)
  renovationYear: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1800,
      max: new Date().getFullYear() + 5
    }
  },
  // Number of Units (if multifamily)
  numberOfUnits: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0
    }
  },
  // Zoning
  zoning: {
    type: DataTypes.STRING
  },
  // Parking Spaces
  parkingSpaces: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0
    }
  },
  parkingRatio: {
    type: DataTypes.DECIMAL(4, 2),
    validate: {
      min: 0
    }
  },
  // Ceiling Height (optional)
  ceilingHeight: {
    type: DataTypes.DECIMAL(4, 1),
    validate: {
      min: 0
    }
  },
  clearHeight: {
    type: DataTypes.DECIMAL(4, 1),
    validate: {
      min: 0
    }
  },
  buildingClass: {
    type: DataTypes.ENUM('A', 'B', 'C'),
    allowNull: true
  },
  floors: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1
    }
  },
  loadingDocks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  driveInDoors: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  lotDimensions: {
    type: DataTypes.STRING
  },
  
  // ========== CONTACTS ==========
  // Owner Name
  ownerName: {
    type: DataTypes.STRING
  },
  // Owner Email
  ownerEmail: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  // Owner Phone
  ownerPhone: {
    type: DataTypes.STRING
  },
  // Owner ID reference (for contact management)
  ownerId: {
    type: DataTypes.UUID,
    references: {
      model: 'contacts',
      key: 'id'
    }
  },
  // Listing Agent
  listingAgent: {
    type: DataTypes.STRING
  },
  listingAgentId: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Brokerage
  brokerage: {
    type: DataTypes.STRING
  },
  // Co-Broker Split %
  coBrokerSplit: {
    type: DataTypes.DECIMAL(5, 2),
    validate: {
      min: 0,
      max: 100
    }
  },
  landlordName: {
    type: DataTypes.STRING
  },
  tenantRoster: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  
  // ========== MARKETING INFO ==========
  // Property Description
  description: {
    type: DataTypes.TEXT
  },
  marketingRemarks: {
    type: DataTypes.TEXT
  },
  // Key Highlights (short bullet points)
  keyHighlights: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  keyFeatures: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  highlights: {
    type: DataTypes.TEXT
  },
  // Image Gallery
  images: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  // Floor Plans
  floorPlans: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  sitePlans: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  // Brochure / Offering Memorandum upload
  offeringMemorandum: {
    type: DataTypes.STRING
  },
  brochure: {
    type: DataTypes.STRING
  },
  documents: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  amenities: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  marketingStatus: {
    type: DataTypes.ENUM('draft', 'published', 'expired', 'suspended'),
    defaultValue: 'draft'
  },
  
  // ========== TRANSACTION INFO ==========
  // Listing Status (Active, Under Contract, Closed)
  transactionStatus: {
    type: DataTypes.ENUM('active', 'under_contract', 'closed', 'cancelled'),
    defaultValue: 'active'
  },
  // Date Sold / Leased
  dateSoldLeased: {
    type: DataTypes.DATE
  },
  // Final Sale Price or Lease Rate
  finalSalePrice: {
    type: DataTypes.DECIMAL(12, 2),
    validate: {
      min: 0
    }
  },
  finalLeaseRate: {
    type: DataTypes.DECIMAL(10, 2),
    validate: {
      min: 0
    }
  },
  // Buyer / Tenant Name (optional)
  buyerTenantName: {
    type: DataTypes.STRING
  },
  closeDate: {
    type: DataTypes.DATE
  },
  
  // ========== ADDITIONAL FIELDS ==========
  // Notes (free text)
  notes: {
    type: DataTypes.TEXT
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  
  // Property Features
  occupancyPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  vacancyPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  utilities: {
    type: DataTypes.JSONB,
    defaultValue: {
      electricity: false,
      gas: false,
      water: false,
      sewer: false,
      internet: false
    }
  },
  availabilityDate: {
    type: DataTypes.DATE
  },
  
  // Tracking
  daysOnMarket: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  inquiries: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  showings: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  // System fields
  linkedDeals: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: []
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  source: {
    type: DataTypes.STRING,
    defaultValue: 'manual'
  },
  lastSyncedAt: {
    type: DataTypes.DATE
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['property_type', 'status'] },
    { fields: ['city', 'state'] },
    { fields: ['list_price'] },
    { fields: ['total_square_footage'] },
    { fields: ['listing_agent_id'] },
    { fields: ['owner_id'] },
    { fields: ['status'] },
    { fields: ['listing_type', 'marketing_status'] },
    { fields: ['transaction_status'] },
    { fields: [{ attribute: 'created_at', order: 'DESC' }] }
  ]
});

// Instance methods
Property.prototype.getFullAddress = function() {
  return `${this.address}, ${this.city}, ${this.state} ${this.zipCode}`;
};

Property.prototype.incrementViews = async function() {
  this.views += 1;
  await this.save();
};

Property.prototype.incrementInquiries = async function() {
  this.inquiries += 1;
  await this.save();
};

Property.prototype.updateDaysOnMarket = function() {
  if (this.createdAt) {
    const now = new Date();
    const created = new Date(this.createdAt);
    this.daysOnMarket = Math.floor((now - created) / (1000 * 60 * 60 * 24));
  }
};

module.exports = Property;
