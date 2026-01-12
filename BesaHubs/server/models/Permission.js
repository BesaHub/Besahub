const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  resource: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Resource name: properties, contacts, deals, etc.'
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Action: create, read, update, delete, list'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'Permissions',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['resource', 'action']
    }
  ]
});

module.exports = Permission;
