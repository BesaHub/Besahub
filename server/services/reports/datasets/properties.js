const { sequelize } = require('../../../config/database');
const { Property, User } = require('../../../models');
const { Op } = require('sequelize');
const { appLogger } = require('../../../config/logger');

const ALLOWED_COLUMNS = [
  'id', 'name', 'propertyType', 'status', 'address', 'city', 'state', 'zipCode',
  'listPrice', 'squareFeet', 'listingAgentId', 'createdAt', 'updatedAt'
];

const METRICS = {
  count: () => sequelize.fn('COUNT', sequelize.col('Property.id')),
  avg_price: () => sequelize.fn('AVG', sequelize.col('listPrice')),
  total_value: () => sequelize.fn('SUM', sequelize.col('listPrice')),
  avg_sqft: () => sequelize.fn('AVG', sequelize.col('squareFeet'))
};

const GROUP_BY_FIELDS = {
  propertyType: 'propertyType',
  status: 'status',
  city: 'city',
  state: 'state',
  listingAgent: 'listingAgentId'
};

function applyRBAC(whereConditions, userId, userRole) {
  if (userRole === 'admin') {
    return whereConditions;
  }

  if (userRole !== 'manager') {
    whereConditions.listingAgentId = userId;
  }

  return whereConditions;
}

function buildWhereClause(filters, userId, userRole) {
  const whereConditions = {};

  if (filters.propertyType) {
    whereConditions.propertyType = Array.isArray(filters.propertyType) 
      ? { [Op.in]: filters.propertyType } 
      : filters.propertyType;
  }

  if (filters.status) {
    whereConditions.status = Array.isArray(filters.status) ? { [Op.in]: filters.status } : filters.status;
  }

  if (filters.price_range && (filters.price_range.min || filters.price_range.max)) {
    whereConditions.listPrice = {};
    if (filters.price_range.min) whereConditions.listPrice[Op.gte] = filters.price_range.min;
    if (filters.price_range.max) whereConditions.listPrice[Op.lte] = filters.price_range.max;
  }

  if (filters.sqft_range && (filters.sqft_range.min || filters.sqft_range.max)) {
    whereConditions.squareFeet = {};
    if (filters.sqft_range.min) whereConditions.squareFeet[Op.gte] = filters.sqft_range.min;
    if (filters.sqft_range.max) whereConditions.squareFeet[Op.lte] = filters.sqft_range.max;
  }

  if (filters.city) {
    whereConditions.city = Array.isArray(filters.city) ? { [Op.in]: filters.city } : filters.city;
  }

  if (filters.state) {
    whereConditions.state = Array.isArray(filters.state) ? { [Op.in]: filters.state } : filters.state;
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

    const results = await Property.findAll(queryOptions);

    const summary = {
      totalRecords: results.length
    };

    if (!groupBy) {
      summary.metrics = results[0] || {};
    }

    const chartData = results.map(row => ({ ...row }));

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
    appLogger.error('Properties dataset resolver error', {
      service: 'properties-resolver',
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
