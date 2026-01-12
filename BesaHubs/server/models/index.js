const { sequelize } = require('../config/database');
const User = require('./User');
const Property = require('./Property');
const Contact = require('./Contact');
const Deal = require('./Deal');
const Task = require('./Task');
const Document = require('./Document');
const Activity = require('./Activity');
const Company = require('./Company');
const Notification = require('./Notification');
const CallLog = require('./CallLog');
const EmailLog = require('./EmailLog');
const Role = require('./Role');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');
const Team = require('./Team');
const TeamMembership = require('./TeamMembership');
const UserRole = require('./UserRole');
const Lease = require('./Lease');
const Debt = require('./Debt');
const Trigger = require('./Trigger');
const Entity = require('./Entity');
const PropertyOwnership = require('./PropertyOwnership');
const EntityRelationship = require('./EntityRelationship');
const SecurityAlert = require('./SecurityAlert');
const BackupLog = require('./BackupLog');
const AlertHistory = require('./AlertHistory');
const Campaign = require('./Campaign');
const EmailEvent = require('./EmailEvent');
const CalendarAccount = require('./CalendarAccount');
const CalendarEvent = require('./CalendarEvent');
const Dashboard = require('./Dashboard');
const Widget = require('./Widget');

// Define associations
const defineAssociations = () => {
  // User associations
  User.hasMany(Property, { foreignKey: 'listingAgentId', as: 'listedProperties' });
  User.hasMany(Contact, { foreignKey: 'assignedAgentId', as: 'assignedContacts' });
  User.hasMany(Deal, { foreignKey: 'listingAgentId', as: 'listingDeals' });
  User.hasMany(Deal, { foreignKey: 'buyerAgentId', as: 'buyerDeals' });
  User.hasMany(Task, { foreignKey: 'assignedToId', as: 'assignedTasks' });
  User.hasMany(Task, { foreignKey: 'createdById', as: 'createdTasks' });
  User.hasMany(Activity, { foreignKey: 'userId', as: 'userActivities' });

  // Property associations
  Property.belongsTo(User, { foreignKey: 'listingAgentId', as: 'assignedAgent' });
  Property.belongsTo(Contact, { foreignKey: 'ownerId', as: 'ownerContact' });
  Property.hasMany(Deal, { foreignKey: 'propertyId', as: 'deals' });
  Property.hasMany(Task, { foreignKey: 'propertyId', as: 'tasks' });
  Property.hasMany(Document, { foreignKey: 'propertyId', as: 'propertyDocuments' });
  Property.hasMany(Activity, { foreignKey: 'propertyId', as: 'propertyActivities' });

  // Contact associations
  Contact.belongsTo(User, { foreignKey: 'assignedAgentId', as: 'assignedAgent' });
  Contact.belongsTo(Contact, { foreignKey: 'parentContactId', as: 'parentContact' });
  Contact.hasMany(Contact, { foreignKey: 'parentContactId', as: 'childContacts' });
  Contact.hasMany(Property, { foreignKey: 'ownerId', as: 'ownedProperties' });
  Contact.hasMany(Deal, { foreignKey: 'primaryContactId', as: 'deals' });
  Contact.hasMany(Task, { foreignKey: 'contactId', as: 'tasks' });
  Contact.hasMany(Activity, { foreignKey: 'contactId', as: 'contactActivities' });
  Contact.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

  // Deal associations
  Deal.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });
  Deal.belongsTo(Contact, { foreignKey: 'primaryContactId', as: 'primaryContact' });
  Deal.belongsTo(User, { foreignKey: 'listingAgentId', as: 'listingAgent' });
  Deal.belongsTo(User, { foreignKey: 'buyerAgentId', as: 'buyerAgent' });
  Deal.hasMany(Task, { foreignKey: 'dealId', as: 'tasks' });
  Deal.hasMany(Document, { foreignKey: 'dealId', as: 'dealDocuments' });
  Deal.hasMany(Activity, { foreignKey: 'dealId', as: 'dealActivities' });

  // Task associations
  Task.belongsTo(User, { foreignKey: 'assignedToId', as: 'assignedTo' });
  Task.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
  Task.belongsTo(Contact, { foreignKey: 'contactId', as: 'contact' });
  Task.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });
  Task.belongsTo(Deal, { foreignKey: 'dealId', as: 'deal' });
  Task.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

  // Document associations
  Document.belongsTo(User, { foreignKey: 'uploadedById', as: 'uploadedBy' });
  Document.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });
  Document.belongsTo(Deal, { foreignKey: 'dealId', as: 'deal' });
  Document.belongsTo(Contact, { foreignKey: 'contactId', as: 'contact' });
  Document.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

  // Activity associations
  Activity.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  Activity.belongsTo(Contact, { foreignKey: 'contactId', as: 'contact' });
  Activity.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });
  Activity.belongsTo(Deal, { foreignKey: 'dealId', as: 'deal' });
  Activity.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

  // Company associations
  Company.hasMany(Contact, { foreignKey: 'companyId', as: 'contacts' });
  Company.hasMany(Task, { foreignKey: 'companyId', as: 'tasks' });
  Company.hasMany(Document, { foreignKey: 'companyId', as: 'companyDocuments' });
  Company.hasMany(Activity, { foreignKey: 'companyId', as: 'companyActivities' });
  Company.belongsTo(User, { foreignKey: 'assignedAgentId', as: 'assignedAgent' });
  Company.belongsTo(Contact, { foreignKey: 'primaryContactId', as: 'primaryContact' });

  // Notification associations
  Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

  // CallLog associations
  CallLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  CallLog.belongsTo(Contact, { foreignKey: 'contactId', as: 'contact' });
  CallLog.belongsTo(Deal, { foreignKey: 'dealId', as: 'deal' });
  CallLog.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });

  User.hasMany(CallLog, { foreignKey: 'userId', as: 'callLogs' });
  Contact.hasMany(CallLog, { foreignKey: 'contactId', as: 'callLogs' });
  Deal.hasMany(CallLog, { foreignKey: 'dealId', as: 'callLogs' });
  Property.hasMany(CallLog, { foreignKey: 'propertyId', as: 'callLogs' });

  // EmailLog associations
  EmailLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  EmailLog.belongsTo(Contact, { foreignKey: 'contactId', as: 'contact' });
  EmailLog.belongsTo(Deal, { foreignKey: 'dealId', as: 'deal' });
  EmailLog.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });

  User.hasMany(EmailLog, { foreignKey: 'userId', as: 'emailLogs' });
  Contact.hasMany(EmailLog, { foreignKey: 'contactId', as: 'emailLogs' });
  Deal.hasMany(EmailLog, { foreignKey: 'dealId', as: 'emailLogs' });
  Property.hasMany(EmailLog, { foreignKey: 'propertyId', as: 'emailLogs' });

  // RBAC associations
  // User <-> Role (many-to-many through UserRole)
  User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId', as: 'roles' });
  Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId', as: 'users' });

  // Role <-> Permission (many-to-many through RolePermission)
  Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'roleId', as: 'permissions' });
  Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permissionId', as: 'roles' });

  // User <-> Team (many-to-many through TeamMembership)
  User.belongsToMany(Team, { through: TeamMembership, foreignKey: 'userId', as: 'teams' });
  Team.belongsToMany(User, { through: TeamMembership, foreignKey: 'teamId', as: 'members' });

  // Team leader association
  Team.belongsTo(User, { foreignKey: 'leaderId', as: 'leader' });
  User.hasMany(Team, { foreignKey: 'leaderId', as: 'ledTeams' });

  // Team hierarchy (self-reference for parent/child)
  Team.belongsTo(Team, { foreignKey: 'parentTeamId', as: 'parentTeam' });
  Team.hasMany(Team, { foreignKey: 'parentTeamId', as: 'childTeams' });

  // Direct associations for junction tables
  UserRole.belongsTo(User, { foreignKey: 'userId' });
  UserRole.belongsTo(Role, { foreignKey: 'roleId' });
  RolePermission.belongsTo(Role, { foreignKey: 'roleId' });
  RolePermission.belongsTo(Permission, { foreignKey: 'permissionId' });
  TeamMembership.belongsTo(Team, { foreignKey: 'teamId' });
  TeamMembership.belongsTo(User, { foreignKey: 'userId' });

  // Lease associations
  Lease.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });
  Lease.belongsTo(Contact, { foreignKey: 'tenantId', as: 'tenant' });
  Property.hasMany(Lease, { foreignKey: 'propertyId', as: 'leases' });
  Contact.hasMany(Lease, { foreignKey: 'tenantId', as: 'leases' });

  // Debt associations
  Debt.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });
  Debt.belongsTo(Company, { foreignKey: 'lenderId', as: 'lender' });
  Property.hasMany(Debt, { foreignKey: 'propertyId', as: 'debts' });
  Company.hasMany(Debt, { foreignKey: 'lenderId', as: 'lendedDebts' });

  // Trigger associations (polymorphic - flexible relationships)
  // Note: Triggers use entityType and entityId for polymorphic relationships
  // We don't create direct foreign key constraints to allow flexibility

  // Entity associations
  Entity.belongsTo(Contact, { foreignKey: 'contactId', as: 'contact' });
  Entity.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
  Entity.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
  Entity.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });
  Entity.hasMany(PropertyOwnership, { foreignKey: 'entityId', as: 'propertyOwnerships' });
  Entity.hasMany(EntityRelationship, { foreignKey: 'sourceEntityId', as: 'sourceRelationships' });
  Entity.hasMany(EntityRelationship, { foreignKey: 'targetEntityId', as: 'targetRelationships' });

  Contact.hasMany(Entity, { foreignKey: 'contactId', as: 'entities' });
  Company.hasMany(Entity, { foreignKey: 'companyId', as: 'entities' });

  // PropertyOwnership associations
  PropertyOwnership.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });
  PropertyOwnership.belongsTo(Entity, { foreignKey: 'entityId', as: 'entity' });
  PropertyOwnership.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
  PropertyOwnership.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

  Property.hasMany(PropertyOwnership, { foreignKey: 'propertyId', as: 'propertyOwnerships' });

  // EntityRelationship associations
  EntityRelationship.belongsTo(Entity, { foreignKey: 'sourceEntityId', as: 'sourceEntity' });
  EntityRelationship.belongsTo(Entity, { foreignKey: 'targetEntityId', as: 'targetEntity' });
  EntityRelationship.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
  EntityRelationship.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

  // SecurityAlert associations
  SecurityAlert.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  SecurityAlert.belongsTo(User, { foreignKey: 'resolvedBy', as: 'resolver' });
  
  User.hasMany(SecurityAlert, { foreignKey: 'userId', as: 'securityAlerts' });
  User.hasMany(SecurityAlert, { foreignKey: 'resolvedBy', as: 'resolvedSecurityAlerts' });

  // AlertHistory associations
  AlertHistory.belongsTo(Lease, { foreignKey: 'leaseId', as: 'lease' });
  AlertHistory.belongsTo(Debt, { foreignKey: 'debtId', as: 'debt' });
  AlertHistory.belongsTo(User, { foreignKey: 'sentTo', as: 'recipient' });
  AlertHistory.belongsTo(Notification, { foreignKey: 'notificationId', as: 'notification' });

  Lease.hasMany(AlertHistory, { foreignKey: 'leaseId', as: 'alertHistory' });
  Debt.hasMany(AlertHistory, { foreignKey: 'debtId', as: 'alertHistory' });

  // Campaign associations
  Campaign.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
  Campaign.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });
  Campaign.belongsTo(Deal, { foreignKey: 'dealId', as: 'deal' });

  User.hasMany(Campaign, { foreignKey: 'createdById', as: 'campaigns' });
  Property.hasMany(Campaign, { foreignKey: 'propertyId', as: 'campaigns' });
  Deal.hasMany(Campaign, { foreignKey: 'dealId', as: 'campaigns' });

  // EmailEvent associations
  EmailEvent.belongsTo(Contact, { foreignKey: 'contactId', as: 'contact' });
  EmailEvent.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });

  Contact.hasMany(EmailEvent, { foreignKey: 'contactId', as: 'emailEvents' });
  Campaign.hasMany(EmailEvent, { foreignKey: 'campaignId', as: 'emailEvents' });

  // CalendarAccount associations
  CalendarAccount.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  
  User.hasMany(CalendarAccount, { foreignKey: 'userId', as: 'calendarAccounts' });

  // CalendarEvent associations
  CalendarEvent.belongsTo(CalendarAccount, { foreignKey: 'calendarAccountId', as: 'calendarAccount' });
  
  CalendarAccount.hasMany(CalendarEvent, { foreignKey: 'calendarAccountId', as: 'calendarEvents' });

  // Dashboard associations
  Dashboard.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  
  User.hasMany(Dashboard, { foreignKey: 'userId', as: 'dashboards' });

  // Widget associations
  Widget.belongsTo(Dashboard, { foreignKey: 'dashboardId', as: 'dashboard' });
  
  Dashboard.hasMany(Widget, { foreignKey: 'dashboardId', as: 'widgets' });
};

// Initialize associations
defineAssociations();

// Export all models
module.exports = {
  sequelize,
  User,
  Property,
  Contact,
  Deal,
  Task,
  Document,
  Activity,
  Company,
  Notification,
  CallLog,
  EmailLog,
  Role,
  Permission,
  RolePermission,
  Team,
  TeamMembership,
  UserRole,
  Lease,
  Debt,
  Trigger,
  Entity,
  PropertyOwnership,
  EntityRelationship,
  SecurityAlert,
  BackupLog,
  AlertHistory,
  Campaign,
  EmailEvent,
  CalendarAccount,
  CalendarEvent,
  Dashboard,
  Widget,
  defineAssociations
};