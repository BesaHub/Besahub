const { sequelize } = require('../../../config/database');
const { Task, User } = require('../../../models');
const { Op } = require('sequelize');
const { appLogger } = require('../../../config/logger');

const ALLOWED_COLUMNS = [
  'id', 'title', 'taskType', 'status', 'priority', 'dueDate', 'completedDate',
  'assignedToId', 'createdById', 'estimatedDuration', 'actualDuration', 'createdAt'
];

const METRICS = {
  count: () => sequelize.fn('COUNT', sequelize.col('Task.id')),
  completion_rate: () => sequelize.literal(`
    CAST(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS FLOAT) / NULLIF(COUNT(*), 0) * 100
  `),
  avg_duration: () => sequelize.fn('AVG', sequelize.col('actualDuration')),
  overdue_count: () => sequelize.literal(`
    SUM(CASE WHEN due_date < NOW() AND status != 'completed' THEN 1 ELSE 0 END)
  `)
};

const GROUP_BY_FIELDS = {
  status: 'status',
  priority: 'priority',
  taskType: 'taskType',
  assignedTo: 'assignedToId',
  month: sequelize.fn('DATE_TRUNC', 'month', sequelize.col('Task.createdAt'))
};

function applyRBAC(whereConditions, userId, userRole) {
  if (userRole === 'admin') {
    return whereConditions;
  }

  if (userRole === 'manager') {
    whereConditions[Op.or] = [
      { assignedToId: userId },
      { createdById: userId }
    ];
  } else {
    whereConditions.assignedToId = userId;
  }

  return whereConditions;
}

function buildWhereClause(filters, userId, userRole) {
  const whereConditions = {};

  if (filters.status) {
    whereConditions.status = Array.isArray(filters.status) ? { [Op.in]: filters.status } : filters.status;
  }

  if (filters.priority) {
    whereConditions.priority = Array.isArray(filters.priority) ? { [Op.in]: filters.priority } : filters.priority;
  }

  if (filters.assignedTo) {
    whereConditions.assignedToId = filters.assignedTo;
  }

  if (filters.dueDate_range && filters.dueDate_range.start && filters.dueDate_range.end) {
    whereConditions.dueDate = {
      [Op.between]: [new Date(filters.dueDate_range.start), new Date(filters.dueDate_range.end)]
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

    const results = await Task.findAll(queryOptions);

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
    appLogger.error('Tasks dataset resolver error', {
      service: 'tasks-resolver',
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
