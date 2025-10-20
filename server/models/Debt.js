const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Debt = sequelize.define('Debt', {
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
  lenderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  interestRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: 0,
      max: 100
    }
  },
  maturityDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true
    }
  },
  dscr: {
    type: DataTypes.DECIMAL(5, 2),
    validate: {
      min: 0
    }
  },
  loanType: {
    type: DataTypes.ENUM('mortgage', 'bridge', 'mezzanine', 'construction', 'other'),
    allowNull: false,
    defaultValue: 'mortgage'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['property_id'] },
    { fields: ['lender_id'] },
    { fields: ['loan_type'] },
    { fields: ['maturity_date'] },
    { fields: ['property_id', 'loan_type'] },
    { fields: [{ attribute: 'created_at', order: 'DESC' }] }
  ]
});

// Instance methods
Debt.prototype.getMonthlyPayment = function() {
  const principal = parseFloat(this.amount);
  const monthlyRate = parseFloat(this.interestRate) / 100 / 12;
  const now = new Date();
  const monthsRemaining = (this.maturityDate.getFullYear() - now.getFullYear()) * 12 + 
                          (this.maturityDate.getMonth() - now.getMonth());
  
  if (monthsRemaining <= 0 || monthlyRate === 0) return 0;
  
  // Standard loan payment formula: P * [r(1+r)^n] / [(1+r)^n - 1]
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, monthsRemaining)) / 
                  (Math.pow(1 + monthlyRate, monthsRemaining) - 1);
  
  return Math.round(payment * 100) / 100;
};

Debt.prototype.getAnnualDebtService = function() {
  return this.getMonthlyPayment() * 12;
};

Debt.prototype.getDaysUntilMaturity = function() {
  const now = new Date();
  return Math.floor((this.maturityDate - now) / (1000 * 60 * 60 * 24));
};

Debt.prototype.getMonthsUntilMaturity = function() {
  const now = new Date();
  const monthsDiff = (this.maturityDate.getFullYear() - now.getFullYear()) * 12 + 
                     (this.maturityDate.getMonth() - now.getMonth());
  return monthsDiff;
};

Debt.prototype.isMaturing = function(daysThreshold = 180) {
  const daysUntil = this.getDaysUntilMaturity();
  return daysUntil <= daysThreshold && daysUntil > 0;
};

Debt.prototype.isHealthy = function() {
  return this.dscr && parseFloat(this.dscr) >= 1.25;
};

module.exports = Debt;
