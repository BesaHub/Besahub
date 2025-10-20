const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const widgetTypes = ['kpi', 'bar', 'line', 'pie', 'table', 'funnel'];
const datasets = ['deals', 'tasks', 'properties', 'contacts', 'campaigns', 'agents'];

const Widget = sequelize.define('Widget', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  dashboardId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'dashboards',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM(...widgetTypes),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  dataset: {
    type: DataTypes.ENUM(...datasets),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  query: {
    type: DataTypes.JSONB,
    defaultValue: {},
    validate: {
      isValidJSON(value) {
        if (value && typeof value !== 'object') {
          throw new Error('Query must be a valid JSON object');
        }
      }
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 200]
    }
  },
  position: {
    type: DataTypes.JSONB,
    defaultValue: { x: 0, y: 0, w: 4, h: 4 },
    validate: {
      isValidPosition(value) {
        if (!value || typeof value !== 'object') {
          throw new Error('Position must be a valid JSON object');
        }
        if (!('x' in value) || !('y' in value) || !('w' in value) || !('h' in value)) {
          throw new Error('Position must contain x, y, w, and h properties');
        }
      }
    }
  },
  refreshInterval: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 86400
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['dashboard_id'] },
    { fields: ['type'] },
    { fields: ['dataset'] },
    { fields: ['is_active'] },
    { fields: ['dashboard_id', 'type'] },
    { fields: ['dashboard_id', 'dataset'] },
    { fields: [{ attribute: 'created_at', order: 'DESC' }] }
  ]
});

Widget.prototype.shouldRefresh = function() {
  if (!this.refreshInterval) return false;
  if (!this.updatedAt) return true;
  const lastUpdate = new Date(this.updatedAt);
  const now = new Date();
  const diffSeconds = (now - lastUpdate) / 1000;
  return diffSeconds >= this.refreshInterval;
};

Widget.prototype.getDefaultQuery = function() {
  const defaultQueries = {
    deals: { filters: {}, groupBy: 'stage', metrics: ['count', 'value'] },
    tasks: { filters: {}, groupBy: 'status', metrics: ['count'] },
    properties: { filters: {}, groupBy: 'propertyType', metrics: ['count', 'totalValue'] },
    contacts: { filters: {}, groupBy: 'leadStatus', metrics: ['count'] },
    campaigns: { filters: {}, groupBy: 'status', metrics: ['count', 'openRate'] },
    agents: { filters: {}, groupBy: 'role', metrics: ['count', 'dealsCount'] }
  };
  return defaultQueries[this.dataset] || {};
};

module.exports = Widget;
module.exports.widgetTypes = widgetTypes;
module.exports.datasets = datasets;
