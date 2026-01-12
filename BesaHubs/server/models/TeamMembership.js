const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TeamMembership = sequelize.define('TeamMembership', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  teamId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Teams',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  isLead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'TeamMemberships',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['team_id', 'user_id']
    }
  ]
});

module.exports = TeamMembership;
