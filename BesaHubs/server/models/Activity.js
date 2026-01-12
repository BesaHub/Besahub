const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Activity = sequelize.define('Activity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM(
      'call', 'email', 'meeting', 'property_visit', 'showing', 'note',
      'task_completed', 'document_uploaded', 'deal_stage_change', 'property_update',
      'contact_update', 'system_event', 'other'
    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 200]
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  
  // Activity Details
  duration: {
    type: DataTypes.INTEGER, // in minutes
    validate: {
      min: 0
    }
  },
  outcome: {
    type: DataTypes.ENUM('successful', 'unsuccessful', 'follow_up_required', 'no_answer'),
    defaultValue: 'successful'
  },
  
  // Communication specific
  direction: {
    type: DataTypes.ENUM('inbound', 'outbound'),
    defaultValue: 'outbound'
  },
  communicationMethod: {
    type: DataTypes.ENUM('phone', 'email', 'text', 'in_person', 'video_call'),
    defaultValue: 'phone'
  },
  
  // Meeting/Call specific
  attendees: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  location: {
    type: DataTypes.STRING
  },
  
  // Email specific
  emailSubject: {
    type: DataTypes.STRING
  },
  emailBody: {
    type: DataTypes.TEXT
  },
  emailAttachments: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  
  // Relationships
  userId: {
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
  taskId: {
    type: DataTypes.UUID,
    references: {
      model: 'tasks',
      key: 'id'
    }
  },
  
  // Follow-up
  followUpRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  followUpDate: {
    type: DataTypes.DATE
  },
  followUpNotes: {
    type: DataTypes.TEXT
  },
  
  // System tracking
  isSystemGenerated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  source: {
    type: DataTypes.STRING,
    defaultValue: 'manual'
  },
  
  // Additional data
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  underscored: true,
  indexes: [
    { fields: ['user_id', 'type', 'created_at'] },
    { fields: ['contact_id', 'created_at'] },
    { fields: ['property_id', 'created_at'] },
    { fields: ['deal_id', 'created_at'] },
    { fields: ['company_id'] }
  ]
});

// Static methods for creating specific activity types
Activity.createCall = async function(data) {
  return await Activity.create({
    type: 'call',
    title: `Call with ${data.contactName || 'Contact'}`,
    description: data.notes || '',
    duration: data.duration,
    outcome: data.outcome || 'successful',
    direction: data.direction || 'outbound',
    communicationMethod: 'phone',
    userId: data.userId,
    contactId: data.contactId,
    propertyId: data.propertyId,
    dealId: data.dealId,
    followUpRequired: data.followUpRequired || false,
    followUpDate: data.followUpDate,
    followUpNotes: data.followUpNotes
  });
};

Activity.createEmail = async function(data) {
  return await Activity.create({
    type: 'email',
    title: data.subject || 'Email Communication',
    description: data.body || '',
    direction: data.direction || 'outbound',
    communicationMethod: 'email',
    emailSubject: data.subject,
    emailBody: data.body,
    emailAttachments: data.attachments || [],
    userId: data.userId,
    contactId: data.contactId,
    propertyId: data.propertyId,
    dealId: data.dealId,
    followUpRequired: data.followUpRequired || false,
    followUpDate: data.followUpDate
  });
};

Activity.createMeeting = async function(data) {
  return await Activity.create({
    type: 'meeting',
    title: data.title || 'Meeting',
    description: data.notes || '',
    duration: data.duration,
    outcome: data.outcome || 'successful',
    location: data.location,
    attendees: data.attendees || [],
    userId: data.userId,
    contactId: data.contactId,
    propertyId: data.propertyId,
    dealId: data.dealId,
    followUpRequired: data.followUpRequired || false,
    followUpDate: data.followUpDate,
    followUpNotes: data.followUpNotes
  });
};

Activity.createPropertyShowing = async function(data) {
  return await Activity.create({
    type: 'showing',
    title: `Property Showing - ${data.propertyName || 'Property'}`,
    description: data.notes || '',
    duration: data.duration || 60,
    outcome: data.outcome || 'successful',
    location: data.location,
    attendees: data.attendees || [],
    userId: data.userId,
    contactId: data.contactId,
    propertyId: data.propertyId,
    dealId: data.dealId,
    followUpRequired: data.followUpRequired || true,
    followUpDate: data.followUpDate,
    followUpNotes: data.followUpNotes
  });
};

Activity.createNote = async function(data) {
  return await Activity.create({
    type: 'note',
    title: data.title || 'Note',
    description: data.content,
    userId: data.userId,
    contactId: data.contactId,
    propertyId: data.propertyId,
    dealId: data.dealId,
    companyId: data.companyId
  });
};

Activity.createSystemEvent = async function(data) {
  return await Activity.create({
    type: 'system_event',
    title: data.title,
    description: data.description,
    userId: data.userId,
    contactId: data.contactId,
    propertyId: data.propertyId,
    dealId: data.dealId,
    isSystemGenerated: true,
    source: data.source || 'system',
    metadata: data.metadata || {}
  });
};

// Instance methods
Activity.prototype.createFollowUpTask = async function() {
  if (!this.followUpRequired || !this.followUpDate) return null;
  
  const Task = require('./Task');
  
  const followUpTask = await Task.create({
    title: `Follow up on: ${this.title}`,
    description: this.followUpNotes || `Follow up required from ${this.type} activity`,
    taskType: 'follow_up',
    dueDate: this.followUpDate,
    assignedToId: this.userId,
    createdById: this.userId,
    contactId: this.contactId,
    propertyId: this.propertyId,
    dealId: this.dealId,
    companyId: this.companyId
  });
  
  return followUpTask;
};

module.exports = Activity;