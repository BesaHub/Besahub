const { sequelize } = require('../../../config/database');
const { Contact, Deal } = require('../../../models');
const { Op } = require('sequelize');
const { appLogger } = require('../../../config/logger');

const ALLOWED_COLUMNS = [
  'id', 'firstName', 'lastName', 'companyName', 'contactRole', 'leadStatus',
  'leadSource', 'primaryEmail', 'primaryPhone', 'assignedAgentId', 'createdAt'
];

const METRICS = {
  count: () => sequelize.fn('COUNT', sequelize.col('Contact.id')),
  conversion_rate: () => sequelize.literal(`
    CAST(COUNT(DISTINCT CASE WHEN "Deals"."id" IS NOT NULL THEN "Contact"."id" END) AS FLOAT) 
    / NULLIF(COUNT(DISTINCT "Contact"."id"), 0) * 100
  `)
};

const GROUP_BY_FIELDS = {
  contactRole: 'contactRole',
  leadStatus: 'leadStatus',
  leadSource: 'leadSource',
  assignedAgent: 'assignedAgentId'
};

function applyRBAC(whereConditions, userId, userRole) {
  if (userRole === 'admin') {
    return whereConditions;
  }

  if (userRole !== 'manager') {
    whereConditions.assignedAgentId = userId;
  }

  return whereConditions;
}

function buildWhereClause(filters, userId, userRole) {
  const whereConditions = {};

  if (filters.contactRole) {
    whereConditions.contactRole = Array.isArray(filters.contactRole) 
      ? { [Op.in]: filters.contactRole } 
      : filters.contactRole;
  }

  if (filters.leadStatus) {
    whereConditions.leadStatus = Array.isArray(filters.leadStatus) 
      ? { [Op.in]: filters.leadStatus } 
      : filters.leadStatus;
  }

  if (filters.leadSource) {
    whereConditions.leadSource = Array.isArray(filters.leadSource) 
      ? { [Op.in]: filters.leadSource } 
      : filters.leadSource;
  }

  if (filters.tags && Array.isArray(filters.tags)) {
    whereConditions.tags = { [Op.overlap]: filters.tags };
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
      include: metrics.includes('conversion_rate') ? [{
        model: Deal,
        as: 'Deals',
        attributes: [],
        required: false
      }] : [],
      raw: true,
      nest: true
    };

    if (groupBy && GROUP_BY_FIELDS[groupBy]) {
      queryOptions.group = [GROUP_BY_FIELDS[groupBy]];
    }

    if (limit) queryOptions.limit = parseInt(limit);
    if (offset) queryOptions.offset = parseInt(offset);

    const results = await Contact.findAll(queryOptions);

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
    appLogger.error('Contacts dataset resolver error', {
      service: 'contacts-resolver',
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
