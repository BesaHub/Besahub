const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Dashboard = sequelize.define('Dashboard', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isShared: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  sharedWith: {
    type: DataTypes.JSONB,
    defaultValue: [],
    validate: {
      isArray(value) {
        if (value && !Array.isArray(value)) {
          throw new Error('SharedWith must be an array');
        }
      }
    }
  },
  layout: {
    type: DataTypes.JSONB,
    defaultValue: {},
    validate: {
      isValidJSON(value) {
        if (value && typeof value !== 'object') {
          throw new Error('Layout must be a valid JSON object');
        }
      }
    }
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['is_shared'] },
    { fields: ['is_default'] },
    { fields: ['is_active'] },
    { fields: ['user_id', 'is_default'] },
    { fields: ['user_id', 'is_active'] },
    { fields: [{ attribute: 'created_at', order: 'DESC' }] }
  ],
  hooks: {
    beforeCreate: async (dashboard) => {
      if (dashboard.isDefault) {
        await Dashboard.update(
          { isDefault: false },
          { 
            where: { 
              userId: dashboard.userId,
              isDefault: true
            }
          }
        );
      }
    },
    beforeUpdate: async (dashboard) => {
      if (dashboard.changed('isDefault') && dashboard.isDefault) {
        await Dashboard.update(
          { isDefault: false },
          { 
            where: { 
              userId: dashboard.userId,
              isDefault: true,
              id: { [sequelize.Sequelize.Op.ne]: dashboard.id }
            }
          }
        );
      }
    }
  }
});

Dashboard.prototype.isSharedWithUser = function(userId) {
  if (!this.isShared) return false;
  if (!this.sharedWith || this.sharedWith.length === 0) return false;
  return this.sharedWith.includes(userId);
};

Dashboard.prototype.addSharedUser = async function(userId) {
  if (!this.sharedWith) {
    this.sharedWith = [];
  }
  if (!this.sharedWith.includes(userId)) {
    this.sharedWith.push(userId);
    this.isShared = true;
    await this.save();
  }
};

Dashboard.prototype.removeSharedUser = async function(userId) {
  if (this.sharedWith && this.sharedWith.includes(userId)) {
    this.sharedWith = this.sharedWith.filter(id => id !== userId);
    if (this.sharedWith.length === 0) {
      this.isShared = false;
    }
    await this.save();
  }
};

module.exports = Dashboard;
