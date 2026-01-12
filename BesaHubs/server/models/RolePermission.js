const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RolePermission = sequelize.define('RolePermission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Roles',
      key: 'id'
    }
  },
  permissionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Permissions',
      key: 'id'
    }
  }
}, {
  tableName: 'RolePermissions',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['role_id', 'permission_id']
    }
  ]
});

module.exports = RolePermission;
