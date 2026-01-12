const { sequelize } = require('../../../config/database');
const { User, Deal } = require('../../../models');
const { Op } = require('sequelize');
const { appLogger } = require('../../../config/logger');

const ALLOWED_COLUMNS = [
  'id', 'firstName', 'lastName', 'email', 'role', 'department', 
  'isActive', 'createdAt'
];

const METRICS = {
  count: () => sequelize.fn('COUNT', sequelize.col('User.id')),
  total_deals: () => sequelize.fn('COUNT', sequelize.col('Deals.id')),
  total_commission: () => sequelize.fn('SUM', sequelize.col('Deals.commission')),
  avg_win_rate: () => sequelize.literal(`
    CAST(SUM(CASE WHEN "Deals"."stage" = 'won' THEN 1 ELSE 0 END) AS FLOAT) 
    / NULLIF(COUNT("Deals"."id"), 0) * 100
  `)
};

const GROUP_BY_FIELDS = {
  role: 'role',
  department: 'department',
  month: sequelize.fn('DATE_TRUNC', 'month', sequelize.col('User.createdAt'))
};

function applyRBAC(whereConditions, userId, userRole) {
  if (userRole === 'admin') {
    return whereConditions;
  }

  if (userRole === 'manager') {
    return whereConditions;
  }

  whereConditions.id = userId;
  return whereConditions;
}

function buildWhereClause(filters, userId, userRole) {
  const whereConditions = {};

  if (filters.role) {
    whereConditions.role = Array.isArray(filters.role) ? { [Op.in]: filters.role } : filters.role;
  }

  if (filters.department) {
    whereConditions.department = Array.isArray(filters.department) 
      ? { [Op.in]: filters.department } 
      : filters.department;
  }

  if (filters.isActive !== undefined) {
    whereConditions.isActive = filters.isActive;
  }

  return applyRBAC(whereConditions, userId, userRole);
}

async function resolve(query, userId, userRole) {
  try {
    const {
      metrics = ['count'],
      groupBy,
      filters = {},
      limit = 100,
      offset = 0
    } = query;

    const whereClause = buildWhereClause(filters, userId, userRole);

    const attributes = [];
    const needsDeals = metrics.some(m => ['total_deals', 'total_commission', 'avg_win_rate'].includes(m));

    metrics.forEach(metric => {
      if (METRICS[metric]) {
        attributes.push([METRICS[metric](), metric]);
      }
    });

    if (groupBy && GROUP_BY_FIELDS[groupBy]) {
      attributes.unshift([GROUP_BY_FIELDS[groupBy], groupBy]);
    }

    const queryOptions = {
      attributes,
      where: whereClause,
      include: needsDeals ? [{
        model: Deal,
        as: 'Deals',
        attributes: [],
        required: false,
        where: {
          [Op.or]: [
            { listingAgentId: sequelize.col('User.id') },
            { buyerAgentId: sequelize.col('User.id') }
          ]
        }
      }] : [],
      raw: true,
      nest: true
    };

    if (groupBy && GROUP_BY_FIELDS[groupBy]) {
      queryOptions.group = [GROUP_BY_FIELDS[groupBy]];
    }

    if (limit) queryOptions.limit = parseInt(limit);
    if (offset) queryOptions.offset = parseInt(offset);

    const results = await User.findAll(queryOptions);

    const summary = {
      totalRecords: results.length
    };

    if (!groupBy) {
      summary.metrics = results[0] || {};
    }

    const chartData = results.map(row => {
      const item = { ...row };
      if (groupBy && row[groupBy] instanceof Date) {
        item[groupBy] = row[groupBy].toISOString().split('T')[0];
      }
      return item;
    });

    const fields = attributes.map(attr => {
      if (Array.isArray(attr)) {
        return { name: attr[1], type: 'number' };
      }
      return { name: attr, type: 'string' };
    });

    return {
      rows: results,
      fields,
      summary,
      chartData
    };

  } catch (error) {
    appLogger.error('Agents dataset resolver error', {
      service: 'agents-resolver',
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

module.exports = {
  resolve,
  ALLOWED_COLUMNS
};
