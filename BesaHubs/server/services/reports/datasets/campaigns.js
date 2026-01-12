const { sequelize } = require('../../../config/database');
const { Campaign } = require('../../../models');
const { Op } = require('sequelize');
const { appLogger } = require('../../../config/logger');

const ALLOWED_COLUMNS = [
  'id', 'name', 'type', 'status', 'openRate', 'clickRate', 'sentCount',
  'createdById', 'scheduledDate', 'sentDate', 'createdAt'
];

const METRICS = {
  count: () => sequelize.fn('COUNT', sequelize.col('Campaign.id')),
  avg_open_rate: () => sequelize.fn('AVG', sequelize.col('openRate')),
  avg_click_rate: () => sequelize.fn('AVG', sequelize.col('clickRate')),
  total_sent: () => sequelize.fn('SUM', sequelize.col('sentCount'))
};

const GROUP_BY_FIELDS = {
  type: 'type',
  status: 'status',
  month: sequelize.fn('DATE_TRUNC', 'month', sequelize.col('Campaign.createdAt')),
  createdBy: 'createdById'
};

function applyRBAC(whereConditions, userId, userRole) {
  if (userRole === 'admin') {
    return whereConditions;
  }

  if (userRole !== 'manager') {
    whereConditions.createdById = userId;
  }

  return whereConditions;
}

function buildWhereClause(filters, userId, userRole) {
  const whereConditions = {};

  if (filters.type) {
    whereConditions.type = Array.isArray(filters.type) ? { [Op.in]: filters.type } : filters.type;
  }

  if (filters.status) {
    whereConditions.status = Array.isArray(filters.status) ? { [Op.in]: filters.status } : filters.status;
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

    const results = await Campaign.findAll(queryOptions);

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
    appLogger.error('Campaigns dataset resolver error', {
      service: 'campaigns-resolver',
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
