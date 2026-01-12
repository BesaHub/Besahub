const moment = require('moment');
const { Op } = require('sequelize');
const { appLogger } = require('../config/logger');
const { Lease, Debt, Trigger, Property, Contact, Company, User } = require('../models');
const notificationService = require('./notificationService');

/**
 * Trigger Detection Service
 * Scans leases and debt for upcoming expirations/maturities and creates triggers
 */

const LEASE_EXPIRATION_THRESHOLDS = [
  { months: 3, priority: 'high' },
  { months: 6, priority: 'high' },
  { months: 9, priority: 'medium' },
  { months: 12, priority: 'medium' }
];

const DEBT_MATURITY_THRESHOLDS = [
  { months: 6, priority: 'critical' },
  { months: 12, priority: 'high' }
];

/**
 * Map trigger priority to notification priority
 */
const mapTriggerPriorityToNotification = (triggerPriority) => {
  const priorityMap = {
    'critical': 'urgent',
    'high': 'high',
    'medium': 'medium',
    'low': 'low'
  };
  return priorityMap[triggerPriority] || 'medium';
};

/**
 * Get users who should be notified about a trigger
 * Returns the property's assigned agent and all admin/manager users
 */
const getUsersToNotify = async (propertyId) => {
  try {
    const users = new Set();

    if (propertyId) {
      const property = await Property.findByPk(propertyId, {
        attributes: ['listingAgentId']
      });

      if (property && property.listingAgentId) {
        users.add(property.listingAgentId);
      }
    }

    const adminAndManagers = await User.findAll({
      where: {
        role: {
          [Op.in]: ['admin', 'manager']
        },
        isActive: true
      },
      attributes: ['id']
    });

    adminAndManagers.forEach(user => users.add(user.id));

    const userArray = Array.from(users);

    if (userArray.length === 0) {
      appLogger.warn('No users found to notify for trigger', {
        service: 'trigger-service',
        propertyId
      });
    }

    return userArray;
  } catch (error) {
    appLogger.error('Error getting users to notify', {
      service: 'trigger-service',
      error: error.message,
      propertyId
    });
    return [];
  }
};

/**
 * Create notifications for a trigger
 */
const createNotificationsForTrigger = async (trigger, triggerMetadata, io = null) => {
  try {
    const usersToNotify = await getUsersToNotify(triggerMetadata.propertyId);

    if (usersToNotify.length === 0) {
      return;
    }

    const isLease = trigger.entityType === 'lease';
    const notificationType = isLease ? 'LEASE_EXPIRING' : 'DEBT_MATURING';

    let title, body;

    if (isLease) {
      const monthsRemaining = Math.round(triggerMetadata.monthsUntilExpiration);
      const daysRemaining = Math.round(triggerMetadata.monthsUntilExpiration * 30);
      
      title = monthsRemaining === 1 
        ? 'Lease Expiring in 1 Month' 
        : `Lease Expiring in ${monthsRemaining} Months`;
      
      body = `The lease at ${triggerMetadata.propertyName || 'a property'} (Tenant: ${triggerMetadata.tenantName || 'Unknown'}) expires in ${daysRemaining} days on ${moment(trigger.triggerDate).format('YYYY-MM-DD')}.`;
      
      if (triggerMetadata.monthlyRent) {
        body += ` Monthly rent: $${triggerMetadata.monthlyRent.toLocaleString()}.`;
      }
    } else {
      const monthsRemaining = Math.round(triggerMetadata.monthsUntilMaturity);
      const daysRemaining = Math.round(triggerMetadata.monthsUntilMaturity * 30);
      
      title = monthsRemaining === 1 
        ? 'Debt Maturing in 1 Month' 
        : `Debt Maturing in ${monthsRemaining} Months`;
      
      body = `The ${triggerMetadata.loanType || 'loan'} at ${triggerMetadata.propertyName || 'a property'} (Lender: ${triggerMetadata.lenderName || 'Unknown'}) matures in ${daysRemaining} days on ${moment(trigger.triggerDate).format('YYYY-MM-DD')}.`;
      
      if (triggerMetadata.amount) {
        body += ` Amount: $${triggerMetadata.amount.toLocaleString()}.`;
      }
    }

    const notificationPriority = mapTriggerPriorityToNotification(trigger.priority);

    const notificationPromises = usersToNotify.map(userId => {
      const notificationData = {
        userId,
        type: notificationType,
        title,
        body,
        priority: notificationPriority,
        entityType: trigger.entityType,
        entityId: trigger.entityId,
        metadata: {
          property_id: triggerMetadata.propertyId,
          trigger_id: trigger.id,
          ...triggerMetadata
        }
      };

      return notificationService.create(notificationData, io);
    });

    await Promise.all(notificationPromises);

    appLogger.info('Notifications created for trigger', {
      service: 'trigger-service',
      triggerId: trigger.id,
      notificationType,
      userCount: usersToNotify.length
    });
  } catch (error) {
    appLogger.error('Error creating notifications for trigger', {
      service: 'trigger-service',
      triggerId: trigger.id,
      error: error.message
    });
  }
};

/**
 * Check if a trigger already exists for the given entity and trigger date
 */
const triggerExists = async (entityType, entityId, triggerDate) => {
  try {
    const existingTrigger = await Trigger.findOne({
      where: {
        entityType,
        entityId,
        triggerDate: moment(triggerDate).format('YYYY-MM-DD'),
        status: {
          [Op.in]: ['pending', 'active']
        }
      }
    });

    return existingTrigger;
  } catch (error) {
    appLogger.error('Error checking trigger existence', {
      service: 'trigger-service',
      error: error.message,
      entityType,
      entityId
    });
    return null;
  }
};

/**
 * Create or update a trigger
 */
const createOrUpdateTrigger = async (triggerData, io = null) => {
  try {
    const existing = await triggerExists(
      triggerData.entityType,
      triggerData.entityId,
      triggerData.triggerDate
    );

    let trigger;
    let action;

    if (existing) {
      // Update existing trigger
      await existing.update({
        priority: triggerData.priority,
        metadata: triggerData.metadata,
        status: 'active'
      });

      appLogger.debug('Trigger updated', {
        service: 'trigger-service',
        triggerId: existing.id,
        type: triggerData.type
      });

      trigger = existing;
      action = 'updated';
    } else {
      // Create new trigger
      const newTrigger = await Trigger.create(triggerData);

      appLogger.debug('Trigger created', {
        service: 'trigger-service',
        triggerId: newTrigger.id,
        type: triggerData.type
      });

      trigger = newTrigger;
      action = 'created';
    }

    if (action === 'created') {
      await createNotificationsForTrigger(trigger, triggerData.metadata, io);
    }

    return { trigger, action };
  } catch (error) {
    appLogger.error('Error creating/updating trigger', {
      service: 'trigger-service',
      error: error.message,
      triggerData
    });
    throw error;
  }
};

/**
 * Detect lease expirations and create triggers
 * Scans all active leases and creates triggers for upcoming expirations
 */
const detectLeaseExpirations = async (io = null) => {
  const results = {
    scanned: 0,
    created: 0,
    updated: 0,
    errors: 0,
    triggers: []
  };

  try {
    appLogger.info('Starting lease expiration detection', { service: 'trigger-service' });

    // Get all active leases
    const leases = await Lease.findAll({
      where: {
        status: 'active'
      },
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'name', 'address', 'city', 'state']
        },
        {
          model: Contact,
          as: 'tenant',
          attributes: ['id', 'firstName', 'lastName', 'companyName']
        }
      ]
    });

    results.scanned = leases.length;

    appLogger.info(`Found ${leases.length} active leases to scan`, { service: 'trigger-service' });

    // Process each lease
    for (const lease of leases) {
      try {
        const endDate = moment(lease.endDate);
        const now = moment();

        // Skip if lease already expired
        if (endDate.isBefore(now, 'day')) {
          continue;
        }

        // Check each threshold
        for (const threshold of LEASE_EXPIRATION_THRESHOLDS) {
          const thresholdDate = moment().add(threshold.months, 'months');

          // If lease expires within this threshold window
          if (endDate.isSameOrBefore(thresholdDate, 'day') && endDate.isAfter(now, 'day')) {
            const monthsUntilExpiration = endDate.diff(now, 'months', true);
            const totalValue = parseFloat(lease.monthlyRent) * Math.ceil(monthsUntilExpiration);

            const triggerData = {
              type: 'lease_expiration',
              entityType: 'lease',
              entityId: lease.id,
              triggerDate: lease.endDate,
              priority: threshold.priority,
              status: 'active',
              metadata: {
                propertyId: lease.propertyId,
                tenantId: lease.tenantId,
                monthsUntilExpiration: Math.round(monthsUntilExpiration * 10) / 10,
                monthlyRent: parseFloat(lease.monthlyRent),
                totalValue: Math.round(totalValue * 100) / 100,
                propertyName: lease.property?.name,
                tenantName: lease.tenant?.companyName || 
                           `${lease.tenant?.firstName} ${lease.tenant?.lastName}`,
                squareFeet: lease.squareFeet
              }
            };

            const result = await createOrUpdateTrigger(triggerData, io);
            
            if (result.action === 'created') {
              results.created++;
            } else if (result.action === 'updated') {
              results.updated++;
            }

            results.triggers.push(result.trigger);

            // Only create one trigger per lease (use the closest threshold)
            break;
          }
        }
      } catch (error) {
        results.errors++;
        appLogger.error('Error processing lease for triggers', {
          service: 'trigger-service',
          leaseId: lease.id,
          error: error.message
        });
      }
    }

    appLogger.info('Lease expiration detection completed', {
      service: 'trigger-service',
      ...results
    });

    return results;
  } catch (error) {
    appLogger.error('Lease expiration detection failed', {
      service: 'trigger-service',
      error: error.message
    });
    throw error;
  }
};

/**
 * Detect debt maturities and create triggers
 * Scans all debt records and creates triggers for upcoming maturities
 */
const detectDebtMaturities = async (io = null) => {
  const results = {
    scanned: 0,
    created: 0,
    updated: 0,
    errors: 0,
    triggers: []
  };

  try {
    appLogger.info('Starting debt maturity detection', { service: 'trigger-service' });

    // Get all debt records
    const debts = await Debt.findAll({
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'name', 'address', 'city', 'state']
        },
        {
          model: Company,
          as: 'lender',
          attributes: ['id', 'name', 'companyType']
        }
      ]
    });

    results.scanned = debts.length;

    appLogger.info(`Found ${debts.length} debt records to scan`, { service: 'trigger-service' });

    // Process each debt record
    for (const debt of debts) {
      try {
        const maturityDate = moment(debt.maturityDate);
        const now = moment();

        // Skip if debt already matured
        if (maturityDate.isBefore(now, 'day')) {
          continue;
        }

        // Check each threshold
        for (const threshold of DEBT_MATURITY_THRESHOLDS) {
          const thresholdDate = moment().add(threshold.months, 'months');

          // If debt matures within this threshold window
          if (maturityDate.isSameOrBefore(thresholdDate, 'day') && maturityDate.isAfter(now, 'day')) {
            const monthsUntilMaturity = maturityDate.diff(now, 'months', true);

            const triggerData = {
              type: 'debt_maturity',
              entityType: 'debt',
              entityId: debt.id,
              triggerDate: debt.maturityDate,
              priority: threshold.priority,
              status: 'active',
              metadata: {
                propertyId: debt.propertyId,
                lenderId: debt.lenderId,
                amount: parseFloat(debt.amount),
                interestRate: parseFloat(debt.interestRate),
                dscr: debt.dscr ? parseFloat(debt.dscr) : null,
                monthsUntilMaturity: Math.round(monthsUntilMaturity * 10) / 10,
                loanType: debt.loanType,
                propertyName: debt.property?.name,
                lenderName: debt.lender?.name,
                isHealthy: debt.dscr ? parseFloat(debt.dscr) >= 1.25 : null
              }
            };

            const result = await createOrUpdateTrigger(triggerData, io);
            
            if (result.action === 'created') {
              results.created++;
            } else if (result.action === 'updated') {
              results.updated++;
            }

            results.triggers.push(result.trigger);

            // Only create one trigger per debt (use the closest threshold)
            break;
          }
        }
      } catch (error) {
        results.errors++;
        appLogger.error('Error processing debt for triggers', {
          service: 'trigger-service',
          debtId: debt.id,
          error: error.message
        });
      }
    }

    appLogger.info('Debt maturity detection completed', {
      service: 'trigger-service',
      ...results
    });

    return results;
  } catch (error) {
    appLogger.error('Debt maturity detection failed', {
      service: 'trigger-service',
      error: error.message
    });
    throw error;
  }
};

/**
 * Run complete trigger detection process
 * Executes both lease expiration and debt maturity detection
 */
const runTriggerDetection = async (io = null) => {
  const startTime = Date.now();

  try {
    appLogger.info('Starting trigger detection process', { service: 'trigger-service' });

    // Run both detection processes
    const [leaseResults, debtResults] = await Promise.all([
      detectLeaseExpirations(io),
      detectDebtMaturities(io)
    ]);

    const summary = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      leases: {
        scanned: leaseResults.scanned,
        created: leaseResults.created,
        updated: leaseResults.updated,
        errors: leaseResults.errors
      },
      debt: {
        scanned: debtResults.scanned,
        created: debtResults.created,
        updated: debtResults.updated,
        errors: debtResults.errors
      },
      totals: {
        scanned: leaseResults.scanned + debtResults.scanned,
        created: leaseResults.created + debtResults.created,
        updated: leaseResults.updated + debtResults.updated,
        errors: leaseResults.errors + debtResults.errors
      }
    };

    appLogger.info('Trigger detection process completed', {
      service: 'trigger-service',
      summary
    });

    return summary;
  } catch (error) {
    appLogger.error('Trigger detection process failed', {
      service: 'trigger-service',
      error: error.message,
      duration: Date.now() - startTime
    });
    throw error;
  }
};

module.exports = {
  detectLeaseExpirations,
  detectDebtMaturities,
  runTriggerDetection
};
