const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const eventStatuses = ['confirmed', 'tentative', 'cancelled'];

const CalendarEvent = sequelize.define('CalendarEvent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  calendarAccountId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'calendar_accounts',
      key: 'id'
    }
  },
  externalId: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 500]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  start: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true
    }
  },
  end: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true,
      isAfterStart(value) {
        if (this.start && new Date(value) <= new Date(this.start)) {
          throw new Error('End date must be after start date');
        }
      }
    }
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [0, 500]
    }
  },
  attendees: {
    type: DataTypes.JSONB,
    defaultValue: [],
    validate: {
      isArray(value) {
        if (value && !Array.isArray(value)) {
          throw new Error('Attendees must be an array');
        }
      }
    }
  },
  status: {
    type: DataTypes.ENUM(...eventStatuses),
    defaultValue: 'confirmed',
    allowNull: false
  },
  isAllDay: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  timezone: {
    type: DataTypes.STRING,
    defaultValue: 'UTC',
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    validate: {
      isValidJSON(value) {
        if (value && typeof value !== 'object') {
          throw new Error('Metadata must be a valid JSON object');
        }
      }
    }
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['calendar_account_id'] },
    { 
      fields: ['calendar_account_id', 'external_id'],
      unique: true
    },
    { fields: ['start'] },
    { fields: ['end'] },
    { fields: ['status'] },
    { fields: ['calendar_account_id', 'start'] },
    { fields: [{ attribute: 'start', order: 'ASC' }] }
  ]
});

CalendarEvent.prototype.getDuration = function() {
  if (!this.start || !this.end) return 0;
  const startTime = new Date(this.start);
  const endTime = new Date(this.end);
  return (endTime - startTime) / (1000 * 60);
};

CalendarEvent.prototype.isUpcoming = function() {
  return new Date(this.start) > new Date();
};

CalendarEvent.prototype.isPast = function() {
  return new Date(this.end) < new Date();
};

CalendarEvent.prototype.isOngoing = function() {
  const now = new Date();
  return new Date(this.start) <= now && now <= new Date(this.end);
};

module.exports = CalendarEvent;
module.exports.eventStatuses = eventStatuses;
