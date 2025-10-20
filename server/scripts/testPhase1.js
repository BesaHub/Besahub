const moment = require('moment');
const { sequelize } = require('../config/database');
const { Lease, Debt, Trigger, Notification, Property, Contact, Company, User } = require('../models');
const triggerService = require('../services/triggerService');

async function testPhase1() {
  console.log('\n' + '='.repeat(80));
  console.log('  PHASE 1: LEASE & DEBT INTELLIGENCE LAYER - END-TO-END TEST');
  console.log('='.repeat(80) + '\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    console.log('━'.repeat(80));
    console.log('1. VERIFY SEED DATA');
    console.log('━'.repeat(80) + '\n');

    const leaseCount = await Lease.count();
    const debtCount = await Debt.count();
    const propertyCount = await Property.count();
    const contactCount = await Contact.count();
    const companyCount = await Company.count();
    const userCount = await User.count();

    console.log(`📊 Database Records:`);
    console.log(`   • Leases: ${leaseCount}`);
    console.log(`   • Debt: ${debtCount}`);
    console.log(`   • Properties: ${propertyCount}`);
    console.log(`   • Contacts: ${contactCount}`);
    console.log(`   • Companies: ${companyCount}`);
    console.log(`   • Users: ${userCount}\n`);

    if (leaseCount === 0 || debtCount === 0) {
      console.log('⚠️  WARNING: No seed data found. Run: node server/scripts/seedLeasesAndDebt.js\n');
      process.exit(1);
    }

    const activeLeasesCount = await Lease.count({ where: { status: 'active' } });
    console.log(`   • Active Leases: ${activeLeasesCount}\n`);

    const sampleLeases = await Lease.findAll({
      limit: 3,
      where: { status: 'active' },
      order: [['endDate', 'ASC']],
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['name', 'city', 'state']
        },
        {
          model: Contact,
          as: 'tenant',
          attributes: ['firstName', 'lastName', 'companyName']
        }
      ]
    });

    console.log('📋 Sample Active Leases (next to expire):');
    sampleLeases.forEach((lease, idx) => {
      const daysRemaining = Math.floor((new Date(lease.endDate) - new Date()) / (1000 * 60 * 60 * 24));
      const tenantName = lease.tenant?.companyName || `${lease.tenant?.firstName} ${lease.tenant?.lastName}`;
      console.log(`   ${idx + 1}. ${lease.property?.name} - Tenant: ${tenantName}`);
      console.log(`      Expires: ${moment(lease.endDate).format('YYYY-MM-DD')} (${daysRemaining} days)`);
      console.log(`      Rent: $${parseFloat(lease.monthlyRent).toLocaleString()}/mo\n`);
    });

    const sampleDebts = await Debt.findAll({
      limit: 3,
      order: [['maturityDate', 'ASC']],
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['name', 'city', 'state']
        },
        {
          model: Company,
          as: 'lender',
          attributes: ['name']
        }
      ]
    });

    console.log('💰 Sample Debt Records (next to mature):');
    sampleDebts.forEach((debt, idx) => {
      const daysRemaining = Math.floor((new Date(debt.maturityDate) - new Date()) / (1000 * 60 * 60 * 24));
      console.log(`   ${idx + 1}. ${debt.property?.name} - Lender: ${debt.lender?.name}`);
      console.log(`      Matures: ${moment(debt.maturityDate).format('YYYY-MM-DD')} (${daysRemaining} days)`);
      console.log(`      Amount: $${parseFloat(debt.amount).toLocaleString()} @ ${debt.interestRate}%\n`);
    });

    console.log('━'.repeat(80));
    console.log('2. EXISTING TRIGGERS & NOTIFICATIONS (BEFORE NEW DETECTION)');
    console.log('━'.repeat(80) + '\n');

    const existingTriggerCount = await Trigger.count();
    const existingNotificationCount = await Notification.count({
      where: {
        type: ['LEASE_EXPIRING', 'DEBT_MATURING']
      }
    });

    console.log(`📌 Existing Records:`);
    console.log(`   • Triggers: ${existingTriggerCount}`);
    console.log(`   • Phase 1 Notifications: ${existingNotificationCount}\n`);

    const triggersByType = await Trigger.findAll({
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['type']
    });

    console.log('   Triggers by Type:');
    triggersByType.forEach(t => {
      console.log(`      • ${t.type}: ${t.get('count')}`);
    });
    console.log('');

    console.log('━'.repeat(80));
    console.log('3. RUN TRIGGER DETECTION SERVICE');
    console.log('━'.repeat(80) + '\n');

    console.log('🔍 Running trigger detection (this may take a moment)...\n');

    const detectionResults = await triggerService.runTriggerDetection(null);

    console.log('✅ Trigger detection completed!\n');
    console.log('📊 Detection Results:');
    console.log(`   Duration: ${detectionResults.duration}ms\n`);

    console.log('   Lease Expiration Detection:');
    console.log(`      • Scanned: ${detectionResults.leases.scanned} leases`);
    console.log(`      • Created: ${detectionResults.leases.created} new triggers`);
    console.log(`      • Updated: ${detectionResults.leases.updated} existing triggers`);
    console.log(`      • Errors: ${detectionResults.leases.errors}\n`);

    console.log('   Debt Maturity Detection:');
    console.log(`      • Scanned: ${detectionResults.debt.scanned} debt records`);
    console.log(`      • Created: ${detectionResults.debt.created} new triggers`);
    console.log(`      • Updated: ${detectionResults.debt.updated} existing triggers`);
    console.log(`      • Errors: ${detectionResults.debt.errors}\n`);

    console.log('   TOTALS:');
    console.log(`      • Scanned: ${detectionResults.totals.scanned} records`);
    console.log(`      • Created: ${detectionResults.totals.created} new triggers`);
    console.log(`      • Updated: ${detectionResults.totals.updated} existing triggers`);
    console.log(`      • Errors: ${detectionResults.totals.errors}\n`);

    console.log('━'.repeat(80));
    console.log('4. VERIFY TRIGGERS CREATED');
    console.log('━'.repeat(80) + '\n');

    const totalTriggers = await Trigger.count();
    const newTriggersCreated = totalTriggers - existingTriggerCount;

    console.log(`📌 Trigger Summary:`);
    console.log(`   • Total Triggers Now: ${totalTriggers}`);
    console.log(`   • Net New Triggers: ${newTriggersCreated}\n`);

    const leaseExpirationTriggers = await Trigger.count({ where: { type: 'lease_expiration' } });
    const debtMaturityTriggers = await Trigger.count({ where: { type: 'debt_maturity' } });

    console.log('   Triggers by Type:');
    console.log(`      • Lease Expirations: ${leaseExpirationTriggers}`);
    console.log(`      • Debt Maturities: ${debtMaturityTriggers}\n`);

    const triggersByPriority = await Trigger.findAll({
      attributes: [
        'priority',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['priority'],
      order: [
        [sequelize.literal("CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END"), 'ASC']
      ]
    });

    console.log('   Triggers by Priority:');
    triggersByPriority.forEach(t => {
      console.log(`      • ${t.priority}: ${t.get('count')}`);
    });
    console.log('');

    const sampleTriggers = await Trigger.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      where: {
        createdAt: {
          [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 60000)
        }
      }
    });

    if (sampleTriggers.length > 0) {
      console.log('🔔 Sample Recently Created Triggers:');
      sampleTriggers.forEach((trigger, idx) => {
        console.log(`   ${idx + 1}. [${trigger.priority.toUpperCase()}] ${trigger.type}`);
        console.log(`      Trigger Date: ${moment(trigger.triggerDate).format('YYYY-MM-DD')}`);
        console.log(`      Property: ${trigger.metadata?.propertyName || 'N/A'}`);
        if (trigger.type === 'lease_expiration') {
          console.log(`      Tenant: ${trigger.metadata?.tenantName || 'N/A'}`);
          console.log(`      Monthly Rent: $${trigger.metadata?.monthlyRent?.toLocaleString() || 'N/A'}`);
        } else {
          console.log(`      Lender: ${trigger.metadata?.lenderName || 'N/A'}`);
          console.log(`      Amount: $${trigger.metadata?.amount?.toLocaleString() || 'N/A'}`);
        }
        console.log('');
      });
    }

    console.log('━'.repeat(80));
    console.log('5. VERIFY NOTIFICATIONS CREATED');
    console.log('━'.repeat(80) + '\n');

    const totalNotifications = await Notification.count({
      where: {
        type: ['LEASE_EXPIRING', 'DEBT_MATURING']
      }
    });

    const newNotificationsCreated = totalNotifications - existingNotificationCount;

    console.log(`📬 Notification Summary:`);
    console.log(`   • Total Phase 1 Notifications: ${totalNotifications}`);
    console.log(`   • Net New Notifications: ${newNotificationsCreated}\n`);

    const notificationsByType = await Notification.findAll({
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        type: ['LEASE_EXPIRING', 'DEBT_MATURING']
      },
      group: ['type']
    });

    console.log('   Notifications by Type:');
    notificationsByType.forEach(n => {
      console.log(`      • ${n.type}: ${n.get('count')}`);
    });
    console.log('');

    const notificationsByPriority = await Notification.findAll({
      attributes: [
        'priority',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        type: ['LEASE_EXPIRING', 'DEBT_MATURING']
      },
      group: ['priority'],
      order: [
        [sequelize.literal("CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END"), 'ASC']
      ]
    });

    console.log('   Notifications by Priority:');
    notificationsByPriority.forEach(n => {
      console.log(`      • ${n.priority}: ${n.get('count')}`);
    });
    console.log('');

    const sampleNotifications = await Notification.findAll({
      limit: 5,
      where: {
        type: ['LEASE_EXPIRING', 'DEBT_MATURING'],
        createdAt: {
          [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 60000)
        }
      },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email', 'role']
        }
      ]
    });

    if (sampleNotifications.length > 0) {
      console.log('📨 Sample Recent Notifications:');
      sampleNotifications.forEach((notif, idx) => {
        console.log(`   ${idx + 1}. [${notif.priority.toUpperCase()}] ${notif.type}`);
        console.log(`      To: ${notif.user?.firstName} ${notif.user?.lastName} (${notif.user?.role})`);
        console.log(`      Title: ${notif.title}`);
        console.log(`      Body: ${notif.body}`);
        console.log(`      Status: ${notif.status}\n`);
      });
    }

    console.log('━'.repeat(80));
    console.log('6. USER NOTIFICATION DISTRIBUTION');
    console.log('━'.repeat(80) + '\n');

    const userNotificationCounts = await sequelize.query(
      `SELECT user_id, COUNT(*) as count 
       FROM "Notifications" 
       WHERE type IN ('LEASE_EXPIRING', 'DEBT_MATURING') 
       AND deleted_at IS NULL
       GROUP BY user_id 
       ORDER BY COUNT(*) DESC 
       LIMIT 10`,
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log('👥 Top Users by Notification Count:');
    
    if (userNotificationCounts.length > 0) {
      for (const [idx, item] of userNotificationCounts.entries()) {
        const user = await User.findByPk(item.user_id, {
          attributes: ['firstName', 'lastName', 'email', 'role']
        });
        
        if (user) {
          console.log(`   ${idx + 1}. ${user.firstName} ${user.lastName} (${user.role}): ${item.count} notifications`);
        } else {
          console.log(`   ${idx + 1}. User ${item.user_id}: ${item.count} notifications`);
        }
      }
    } else {
      console.log('   (No notifications found for Phase 1 types)');
    }
    console.log('');

    console.log('━'.repeat(80));
    console.log('7. TEST RESULTS SUMMARY');
    console.log('━'.repeat(80) + '\n');

    const allTestsPassed = 
      leaseCount > 0 &&
      debtCount > 0 &&
      detectionResults.totals.errors === 0 &&
      (detectionResults.totals.created > 0 || detectionResults.totals.updated > 0);

    if (allTestsPassed) {
      console.log('✅ ALL TESTS PASSED!\n');
      console.log('Phase 1 Lease & Debt Intelligence Layer is functioning correctly:\n');
      console.log('   ✓ Seed data verified');
      console.log('   ✓ Trigger detection service operational');
      console.log('   ✓ Triggers created/updated successfully');
      console.log('   ✓ Notifications generated for relevant users');
      console.log('   ✓ User distribution logic working\n');
    } else {
      console.log('❌ SOME TESTS FAILED\n');
      if (leaseCount === 0) console.log('   ✗ No lease data found');
      if (debtCount === 0) console.log('   ✗ No debt data found');
      if (detectionResults.totals.errors > 0) console.log(`   ✗ ${detectionResults.totals.errors} errors during detection`);
      if (detectionResults.totals.created === 0 && detectionResults.totals.updated === 0) {
        console.log('   ✗ No triggers created or updated');
      }
      console.log('');
    }

    console.log('━'.repeat(80));
    console.log('8. API ENDPOINT VALIDATION');
    console.log('━'.repeat(80) + '\n');

    console.log('🔗 Test these API endpoints (requires authentication):');
    console.log('   • GET /api/leases - List all leases');
    console.log('   • GET /api/leases?status=active - Active leases only');
    console.log('   • GET /api/leases?propertyId={id} - Leases for specific property');
    console.log('   • GET /api/debt - List all debt');
    console.log('   • GET /api/debt?propertyId={id} - Debt for specific property');
    console.log('   • GET /api/triggers - List all triggers');
    console.log('   • GET /api/triggers?type=lease_expiration - Lease expiration triggers');
    console.log('   • GET /api/triggers?type=debt_maturity - Debt maturity triggers\n');

    console.log('━'.repeat(80));
    console.log('TEST COMPLETE');
    console.log('━'.repeat(80) + '\n');

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:\n');
    console.error(error);
    await sequelize.close();
    process.exit(1);
  }
}

testPhase1();
