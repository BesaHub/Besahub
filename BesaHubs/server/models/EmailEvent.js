const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const eventTypes = [
  'processed',
  'delivered',
  'open',
  'click',
  'bounce',
  'dropped',
  'spamreport',
  'unsubscribe'
];

const EmailEvent = sequelize.define('EmailEvent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  contactId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'contacts',
      key: 'id'
    }
  },
  campaignId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'campaigns',
      key: 'id'
    }
  },
  messageId: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  eventType: {
    type: DataTypes.ENUM(...eventTypes),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  eventTimestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true
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
    { fields: ['contact_id'] },
    { fields: ['campaign_id'] },
    { fields: ['event_type'] },
    { fields: ['event_timestamp'] },
    { fields: ['message_id'] },
    { fields: ['contact_id', 'event_type'] },
    { fields: ['campaign_id', 'event_type'] },
    { fields: [{ attribute: 'event_timestamp', order: 'DESC' }] }
  ]
});

module.exports = EmailEvent;
module.exports.eventTypes = eventTypes;
