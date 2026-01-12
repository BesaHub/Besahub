const { sequelize } = require('../../../config/database');
const { Deal, User, Property, Contact } = require('../../../models');
const { Op } = require('sequelize');
const { appLogger } = require('../../../config/logger');

const ALLOWED_COLUMNS = [
  'id', 'name', 'dealType', 'stage', 'value', 'commission', 'commissionRate',
  'probability', 'expectedCloseDate', 'actualCloseDate', 'listingAgentId',
  'buyerAgentId', 'createdAt', 'updatedAt'
];

const METRICS = {
  count: () => sequelize.fn('COUNT', sequelize.col('Deal.id')),
  sum: () => sequelize.fn('SUM', sequelize.col('value')),
  avg: () => sequelize.fn('AVG', sequelize.col('value')),
  win_rate: () => sequelize.literal(`
    CAST(SUM(CASE WHEN stage = 'won' THEN 1 ELSE 0 END) AS FLOAT) / NULLIF(COUNT(*), 0) * 100
  `),
  commission_total: () => sequelize.fn('SUM', sequelize.col('commission'))
};

const GROUP_BY_FIELDS = {
  stage: 'stage',
  dealType: 'dealType',
  listingAgent: 'listingAgentId',
  month: sequelize.fn('DATE_TRUNC', 'month', sequelize.col('Deal.createdAt')),
  quarter: sequelize.fn('DATE_TRUNC', 'quarter', sequelize.col('Deal.createdAt'))
};

function applyRBAC(whereConditions, userId, userRole) {
  if (userRole === 'admin') {
    return whereConditions;
  }

  if (userRole === 'manager') {
    whereConditions[Op.or] = [
      { listingAgentId: userId },
      { buyerAgentId: userId }
    ];
  } else {
    whereConditions[Op.or] = [
      { listingAgentId: userId },
      { buyerAgentId: userId }
    ];
  }

  return whereConditions;
}

function buildWhereClause(filters, userId, userRole) {
  const whereConditions = {};

  if (filters.stage) {
    whereConditions.stage = Array.isArray(filters.stage) ? { [Op.in]: filters.stage } : filters.stage;
  }

  if (filters.dealType) {
    whereConditions.dealType = Array.isArray(filters.dealType) ? { [Op.in]: filters.dealType } : filters.dealType;
  }

  if (filters.value_min || filters.value_max) {
    whereConditions.value = {};
    if (filters.value_min) whereConditions.value[Op.gte] = filters.value_min;
    if (filters.value_max) whereConditions.value[Op.lte] = filters.value_max;
  }

  if (filters.probability) {
    whereConditions.probability = filters.probability;
  }

  if (filters.date_range && filters.date_range.start && filters.date_range.end) {
    whereConditions.createdAt = {
      [Op.between]: [new Date(filters.date_range.start), new Date(filters.date_range.end)]
    };
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
      raw: true,
      nest: true
    };

    if (groupBy && GROUP_BY_FIELDS[groupBy]) {
      queryOptions.group = [GROUP_BY_FIELDS[groupBy]];
    }

    if (limit) queryOptions.limit = parseInt(limit);
    if (offset) queryOptions.offset = parseInt(offset);

    const results = await Deal.findAll(queryOptions);

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
    appLogger.error('Deals dataset resolver error', {
      service: 'deals-resolver',
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
