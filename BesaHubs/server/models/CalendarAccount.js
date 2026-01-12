const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const providers = ['google', 'microsoft'];

const CalendarAccount = sequelize.define('CalendarAccount', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  provider: {
    type: DataTypes.ENUM(...providers),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isDate: true
    }
  },
  scopes: {
    type: DataTypes.JSONB,
    defaultValue: [],
    validate: {
      isArray(value) {
        if (value && !Array.isArray(value)) {
          throw new Error('Scopes must be an array');
        }
      }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  lastSyncedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isDate: true
    }
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['provider'] },
    { fields: ['email'] },
    { fields: ['user_id', 'provider'] },
    { fields: ['is_active'] },
    { fields: [{ attribute: 'last_synced_at', order: 'DESC' }] }
  ]
});

CalendarAccount.prototype.isTokenExpired = function() {
  if (!this.expiresAt) return true;
  return new Date() >= new Date(this.expiresAt);
};

CalendarAccount.prototype.needsSync = function(intervalMinutes = 15) {
  if (!this.lastSyncedAt) return true;
  const lastSync = new Date(this.lastSyncedAt);
  const now = new Date();
  const diffMinutes = (now - lastSync) / (1000 * 60);
  return diffMinutes >= intervalMinutes;
};

module.exports = CalendarAccount;
module.exports.providers = providers;
