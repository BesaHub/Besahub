const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 200]
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  taskType: {
    type: DataTypes.ENUM(
      'call', 'email', 'meeting', 'follow_up', 'property_showing',
      'document_review', 'market_analysis', 'site_visit', 'other'
    ),
    defaultValue: 'other'
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  
  // Scheduling
  dueDate: {
    type: DataTypes.DATE
  },
  startDate: {
    type: DataTypes.DATE
  },
  completedDate: {
    type: DataTypes.DATE
  },
  estimatedDuration: {
    type: DataTypes.INTEGER, // in minutes
    validate: {
      min: 0
    }
  },
  actualDuration: {
    type: DataTypes.INTEGER, // in minutes
    validate: {
      min: 0
    }
  },
  
  // Relationships
  assignedToId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  createdById: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  contactId: {
    type: DataTypes.UUID,
    references: {
      model: 'contacts',
      key: 'id'
    }
  },
  propertyId: {
    type: DataTypes.UUID,
    references: {
      model: 'properties',
      key: 'id'
    }
  },
  dealId: {
    type: DataTypes.UUID,
    references: {
      model: 'deals',
      key: 'id'
    }
  },
  companyId: {
    type: DataTypes.UUID,
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  
  // Reminders and Follow-ups
  reminderDate: {
    type: DataTypes.DATE
  },
  reminderSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recurringPattern: {
    type: DataTypes.JSONB,
    defaultValue: null
    // Example: { type: 'daily', interval: 1, endDate: '2024-12-31' }
  },
  
  // Task outcome
  outcome: {
    type: DataTypes.ENUM(
      'successful', 'unsuccessful', 'rescheduled', 'cancelled', 'no_show'
    )
  },
  notes: {
    type: DataTypes.TEXT
  },
  
  // Attachments and links
  attachments: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  
  // Custom fields
  customFields: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['assigned_to_id', 'status'] },
    { fields: ['due_date', 'status'] },
    { fields: ['company_id'] },
    { fields: ['deal_id'] },
    { fields: ['property_id'] },
    { fields: ['contact_id'] }
  ]
});

// Instance methods
Task.prototype.markCompleted = async function(outcome, notes) {
  this.status = 'completed';
  this.completedDate = new Date();
  if (outcome) this.outcome = outcome;
  if (notes) this.notes = notes;
  await this.save();
};

Task.prototype.isOverdue = function() {
  if (!this.dueDate || this.status === 'completed' || this.status === 'cancelled') {
    return false;
  }
  return new Date() > new Date(this.dueDate);
};

Task.prototype.getDaysUntilDue = function() {
  if (!this.dueDate) return null;
  const today = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

Task.prototype.createRecurringTask = async function() {
  if (!this.isRecurring || !this.recurringPattern) return null;
  
  const { type, interval, endDate } = this.recurringPattern;
  
  // Calculate next due date
  let nextDueDate = new Date(this.dueDate);
  switch (type) {
    case 'daily':
      nextDueDate.setDate(nextDueDate.getDate() + interval);
      break;
    case 'weekly':
      nextDueDate.setDate(nextDueDate.getDate() + (7 * interval));
      break;
    case 'monthly':
      nextDueDate.setMonth(nextDueDate.getMonth() + interval);
      break;
    case 'yearly':
      nextDueDate.setFullYear(nextDueDate.getFullYear() + interval);
      break;
  }
  
  // Don't create if past end date
  if (endDate && nextDueDate > new Date(endDate)) {
    return null;
  }
  
  // Create new task
  const newTask = await Task.create({
    title: this.title,
    description: this.description,
    taskType: this.taskType,
    priority: this.priority,
    dueDate: nextDueDate,
    estimatedDuration: this.estimatedDuration,
    assignedToId: this.assignedToId,
    createdById: this.createdById,
    contactId: this.contactId,
    propertyId: this.propertyId,
    dealId: this.dealId,
    companyId: this.companyId,
    isRecurring: this.isRecurring,
    recurringPattern: this.recurringPattern,
    customFields: this.customFields
  });
  
  return newTask;
};

module.exports = Task;