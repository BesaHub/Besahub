const { sequelize } = require('../config/database');
const User = require('../models/User');
const Contact = require('../models/Contact');
const Company = require('../models/Company');
const Property = require('../models/Property');
const Deal = require('../models/Deal');
const Task = require('../models/Task');
const Campaign = require('../models/Campaign');
const EmailEvent = require('../models/EmailEvent');
const CalendarAccount = require('../models/CalendarAccount');
const CalendarEvent = require('../models/CalendarEvent');
const Dashboard = require('../models/Dashboard');
const Widget = require('../models/Widget');
const { encrypt: encryptCalendarToken } = require('../utils/calendarEncryption');

const BATCH_SIZE = 100;

let faker;

async function clearPhase1Data() {
  console.log('🗑️  Clearing existing Phase 1 data...');
  
  const clearTable = async (model, name) => {
    try {
      const count = await model.destroy({ where: {}, force: true });
      console.log(`  ✓ Cleared ${count} ${name}`);
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log(`  ⚠ ${name} table doesn't exist yet (will be created)`);
      } else {
        console.log(`  ⚠ Could not clear ${name}: ${error.message}`);
      }
    }
  };
  
  await clearTable(Widget, 'Widgets');
  await clearTable(Dashboard, 'Dashboards');
  await clearTable(CalendarEvent, 'Calendar Events');
  await clearTable(CalendarAccount, 'Calendar Accounts');
  await clearTable(EmailEvent, 'Email Events');
  await clearTable(Campaign, 'Campaigns');
  await clearTable(Task, 'Tasks');
  await clearTable(Deal, 'Deals');
  await clearTable(Property, 'Properties');
  await clearTable(Contact, 'Contacts');
  await clearTable(Company, 'Companies');
  await clearTable(User, 'Users');
  
  console.log('✅ Phase 1 data cleared successfully\n');
}

async function seedUsers(transaction) {
  console.log('👥 Seeding Users (10-15)...');
  
  const roles = ['admin', 'manager', 'agent', 'assistant'];
  const departments = ['Sales', 'Leasing', 'Investment', 'Property Management'];
  
  const users = [
    {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@besahubs.com',
      password: 'AdminPass123!@#',
      phone: '+14155551000',
      role: 'admin',
      title: 'CEO',
      department: 'Executive',
      licenseNumber: 'CA-DRE-01234567',
      licenseState: 'CA',
      commissionRate: 0.03,
      isActive: true,
      emailVerified: true,
      firstRunCompleted: false
    }
  ];
  
  for (let i = 0; i < 14; i++) {
    const role = roles[Math.floor(Math.random() * roles.length)];
    users.push({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email().toLowerCase(),
      password: 'UserPass123!@#',
      phone: faker.phone.number('+1##########'),
      role,
      title: faker.person.jobTitle(),
      department: departments[Math.floor(Math.random() * departments.length)],
      licenseNumber: `${faker.location.state({ abbreviated: true })}-${faker.string.alphanumeric(10).toUpperCase()}`,
      licenseState: faker.location.state({ abbreviated: true }),
      commissionRate: faker.number.float({ min: 0.02, max: 0.05, precision: 0.0001 }),
      isActive: true,
      emailVerified: true,
      firstRunCompleted: true
    });
  }
  
  const createdUsers = await User.bulkCreate(users, { 
    transaction,
    individualHooks: true
  });
  
  console.log(`✅ Created ${createdUsers.length} users\n`);
  return createdUsers;
}

async function seedCompanies(users, transaction) {
  console.log('🏢 Seeding Companies (50)...');
  
  const companyTypes = ['corporation', 'llc', 'partnership', 'trust', 'sole_proprietorship'];
  const industries = ['real_estate_investment', 'real_estate_development', 'commercial_real_estate', 'finance', 'technology', 'retail', 'healthcare', 'manufacturing', 'hospitality', 'other'];
  const leadStatuses = ['cold', 'warm', 'hot', 'qualified', 'customer', 'inactive'];
  
  const companies = [];
  
  for (let i = 0; i < 50; i++) {
    const companyName = faker.company.name();
    companies.push({
      name: companyName,
      legalName: `${companyName} ${faker.helpers.arrayElement(['Inc.', 'LLC', 'Corp.', 'LP'])}`,
      companyType: faker.helpers.arrayElement(companyTypes),
      industry: faker.helpers.arrayElement(industries),
      primaryEmail: faker.internet.email({ provider: companyName.toLowerCase().replace(/\s+/g, '') + '.com' }),
      primaryPhone: faker.phone.number('+1##########'),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode('#####'),
      website: faker.internet.url(),
      annualRevenue: faker.number.int({ min: 1000000, max: 500000000 }),
      employeeCount: faker.number.int({ min: 10, max: 5000 }),
      creditRating: faker.helpers.arrayElement(['A', 'B', 'C', 'D']),
      leadStatus: faker.helpers.arrayElement(leadStatuses),
      assignedAgentId: faker.helpers.arrayElement(users).id
    });
  }
  
  const createdCompanies = await Company.bulkCreate(companies, { transaction });
  console.log(`✅ Created ${createdCompanies.length} companies\n`);
  return createdCompanies;
}

async function seedContacts(users, companies, transaction) {
  console.log('👤 Seeding Contacts (1000+)...');
  
  const contactRoles = ['buyer', 'seller', 'tenant', 'landlord', 'investor', 'broker', 'lender', 'other'];
  const leadStatuses = ['cold', 'warm', 'hot', 'qualified', 'converted', 'lost', 'inactive'];
  const leadSources = ['referral', 'website', 'cold_call', 'email_campaign', 'social_media', 'networking', 'advertisement', 'trade_show', 'other'];
  
  const contacts = [];
  const totalContacts = 1200;
  
  for (let i = 0; i < totalContacts; i++) {
    const company = faker.helpers.arrayElement(companies);
    contacts.push({
      type: 'individual',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      title: faker.person.jobTitle(),
      companyName: company.name,
      companyId: company.id,
      primaryEmail: faker.internet.email().toLowerCase(),
      primaryPhone: faker.phone.number('+1##########'),
      mobilePhone: faker.phone.number('+1##########'),
      contactRole: faker.helpers.arrayElement(contactRoles),
      leadStatus: faker.helpers.arrayElement(leadStatuses),
      leadSource: faker.helpers.arrayElement(leadSources),
      assignedAgentId: faker.helpers.arrayElement(users).id,
      createdAt: faker.date.between({ from: '2024-01-01', to: '2025-10-19' }),
      updatedAt: new Date()
    });
  }
  
  console.log(`  Creating ${totalContacts} contacts in batches...`);
  const createdContacts = [];
  for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
    const batch = contacts.slice(i, i + BATCH_SIZE);
    const batchResult = await Contact.bulkCreate(batch, { transaction });
    createdContacts.push(...batchResult);
    console.log(`  ✓ Created ${Math.min(i + BATCH_SIZE, contacts.length)}/${contacts.length} contacts`);
  }
  
  console.log(`✅ Created ${createdContacts.length} contacts\n`);
  return createdContacts;
}

async function seedProperties(users, contacts, transaction) {
  console.log('🏢 Seeding Properties (200)...');
  
  const propertyTypes = ['office', 'retail', 'industrial', 'land', 'multifamily', 'warehouse', 'hotel', 'mixed_use', 'medical', 'restaurant', 'other'];
  const listingTypes = ['sale', 'lease', 'both'];
  
  const properties = [];
  
  for (let i = 0; i < 200; i++) {
    const propertyType = faker.helpers.arrayElement(propertyTypes);
    const listingType = faker.helpers.arrayElement(listingTypes);
    const squareFootage = faker.number.int({ min: 5000, max: 500000 });
    const pricePerSF = faker.number.float({ min: 100, max: 800, precision: 0.01 });
    
    properties.push({
      name: `${faker.location.streetAddress()} ${faker.helpers.arrayElement(['Building', 'Center', 'Plaza', 'Tower', 'Complex'])}`,
      propertyType,
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode('#####'),
      country: 'USA',
      squareFootage,
      lotSize: faker.number.int({ min: 10000, max: 1000000 }),
      yearBuilt: faker.number.int({ min: 1970, max: 2024 }),
      numberOfUnits: propertyType === 'multifamily' ? faker.number.int({ min: 10, max: 500 }) : null,
      numberOfFloors: faker.number.int({ min: 1, max: 50 }),
      parkingSpaces: faker.number.int({ min: 20, max: 500 }),
      listingType,
      price: Math.round(squareFootage * pricePerSF),
      pricePerSquareFoot: pricePerSF,
      listingAgentId: faker.helpers.arrayElement(users).id,
      ownerId: faker.helpers.arrayElement(contacts).id,
      zoning: faker.helpers.arrayElement(['Commercial', 'Industrial', 'Mixed-Use', 'Residential']),
      createdAt: faker.date.between({ from: '2024-01-01', to: '2025-10-19' }),
      updatedAt: new Date()
    });
  }
  
  const createdProperties = await Property.bulkCreate(properties, { transaction });
  console.log(`✅ Created ${createdProperties.length} properties\n`);
  return createdProperties;
}

async function seedDeals(users, contacts, properties, transaction) {
  console.log('💼 Seeding Deals (600)...');
  
  const dealTypes = ['sale', 'lease', 'investment'];
  const dealStages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'contract', 'due_diligence', 'closing', 'won', 'lost'];
  const stageDistribution = {
    prospecting: 0.15,
    qualification: 0.15,
    proposal: 0.15,
    negotiation: 0.15,
    contract: 0.10,
    due_diligence: 0.10,
    closing: 0.08,
    won: 0.08,
    lost: 0.04
  };
  
  const deals = [];
  
  for (let i = 0; i < 600; i++) {
    const random = Math.random();
    let cumulativeProbability = 0;
    let stage = 'prospecting';
    
    for (const [stageName, probability] of Object.entries(stageDistribution)) {
      cumulativeProbability += probability;
      if (random <= cumulativeProbability) {
        stage = stageName;
        break;
      }
    }
    
    const property = faker.helpers.arrayElement(properties);
    const dealValue = faker.number.int({ min: 50000, max: 5000000 });
    const createdDate = faker.date.between({ from: '2024-01-01', to: '2025-10-19' });
    
    deals.push({
      name: `${faker.company.name()} - ${property.name}`,
      dealType: faker.helpers.arrayElement(dealTypes),
      stage,
      value: dealValue,
      probability: faker.number.int({ min: 10, max: 90 }),
      expectedCloseDate: faker.date.future({ years: 1 }),
      propertyId: property.id,
      primaryContactId: faker.helpers.arrayElement(contacts).id,
      listingAgentId: faker.helpers.arrayElement(users).id,
      buyerAgentId: faker.helpers.arrayElement(users).id,
      description: faker.lorem.sentences(2),
      createdAt: createdDate,
      updatedAt: faker.date.between({ from: createdDate, to: new Date() })
    });
  }
  
  console.log(`  Creating ${deals.length} deals in batches...`);
  const createdDeals = [];
  for (let i = 0; i < deals.length; i += BATCH_SIZE) {
    const batch = deals.slice(i, i + BATCH_SIZE);
    const batchResult = await Deal.bulkCreate(batch, { transaction });
    createdDeals.push(...batchResult);
    console.log(`  ✓ Created ${Math.min(i + BATCH_SIZE, deals.length)}/${deals.length} deals`);
  }
  
  console.log(`✅ Created ${createdDeals.length} deals\n`);
  return createdDeals;
}

async function seedTasks(users, contacts, properties, deals, transaction) {
  console.log('✅ Seeding Tasks (800)...');
  
  const statuses = ['pending', 'in_progress', 'completed', 'cancelled'];
  const priorities = ['urgent', 'high', 'medium', 'low'];
  const types = ['call', 'email', 'meeting', 'site_visit', 'follow_up', 'document_review', 'other'];
  
  const statusDistribution = {
    pending: 0.40,
    in_progress: 0.30,
    completed: 0.25,
    cancelled: 0.05
  };
  
  const priorityDistribution = {
    urgent: 0.10,
    high: 0.30,
    medium: 0.50,
    low: 0.10
  };
  
  const tasks = [];
  
  for (let i = 0; i < 800; i++) {
    let statusRandom = Math.random();
    let status = 'pending';
    let cumulative = 0;
    for (const [s, prob] of Object.entries(statusDistribution)) {
      cumulative += prob;
      if (statusRandom <= cumulative) {
        status = s;
        break;
      }
    }
    
    let priorityRandom = Math.random();
    let priority = 'medium';
    cumulative = 0;
    for (const [p, prob] of Object.entries(priorityDistribution)) {
      cumulative += prob;
      if (priorityRandom <= cumulative) {
        priority = p;
        break;
      }
    }
    
    const daysOffset = faker.number.int({ min: -30, max: 60 });
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysOffset);
    
    const createdDate = faker.date.between({ from: '2024-08-01', to: '2025-10-19' });
    
    const task = {
      title: faker.helpers.arrayElement([
        'Follow up on proposal',
        'Schedule property showing',
        'Review contract documents',
        'Send updated financials',
        'Coordinate site inspection',
        'Prepare marketing materials',
        'Update CRM records',
        'Client check-in call',
        'Request additional documentation',
        'Schedule closing meeting'
      ]),
      description: faker.lorem.sentence(),
      status,
      priority,
      type: faker.helpers.arrayElement(types),
      dueDate,
      assignedToId: faker.helpers.arrayElement(users).id,
      createdById: faker.helpers.arrayElement(users).id,
      createdAt: createdDate,
      updatedAt: status === 'completed' ? faker.date.between({ from: createdDate, to: new Date() }) : new Date()
    };
    
    const randomType = Math.random();
    if (randomType < 0.4) {
      task.dealId = faker.helpers.arrayElement(deals).id;
    } else if (randomType < 0.7) {
      task.contactId = faker.helpers.arrayElement(contacts).id;
    } else if (randomType < 0.9) {
      task.propertyId = faker.helpers.arrayElement(properties).id;
    }
    
    tasks.push(task);
  }
  
  console.log(`  Creating ${tasks.length} tasks in batches...`);
  const createdTasks = [];
  for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
    const batch = tasks.slice(i, i + BATCH_SIZE);
    const batchResult = await Task.bulkCreate(batch, { transaction });
    createdTasks.push(...batchResult);
    console.log(`  ✓ Created ${Math.min(i + BATCH_SIZE, tasks.length)}/${tasks.length} tasks`);
  }
  
  console.log(`✅ Created ${createdTasks.length} tasks\n`);
  return createdTasks;
}

async function seedCampaigns(users, properties, deals, transaction) {
  console.log('📧 Seeding Campaigns (10)...');
  
  const campaignTypes = ['email', 'newsletter', 'property_promo', 'investor_update'];
  const campaignStatuses = ['draft', 'scheduled', 'sent'];
  
  const campaigns = [];
  
  for (let i = 0; i < 10; i++) {
    const status = faker.helpers.arrayElement(campaignStatuses);
    const sentDate = status === 'sent' ? faker.date.between({ from: '2024-08-20', to: '2025-10-19' }) : null;
    const totalRecipients = faker.number.int({ min: 100, max: 1000 });
    const sentCount = status === 'sent' ? totalRecipients : 0;
    
    campaigns.push({
      name: `${faker.helpers.arrayElement(['Q4 2024', 'Fall 2024', 'October', 'Monthly', 'Weekly'])} ${faker.helpers.arrayElement(['Newsletter', 'Property Update', 'Market Report', 'Investor Update'])}`,
      description: faker.lorem.sentences(2),
      type: faker.helpers.arrayElement(campaignTypes),
      status,
      subject: faker.lorem.sentence(),
      emailBody: faker.lorem.paragraphs(3),
      plainTextBody: faker.lorem.paragraphs(2),
      recipientType: 'all_contacts',
      scheduledDate: status === 'scheduled' ? faker.date.future({ days: 30 }) : null,
      sentDate,
      createdById: faker.helpers.arrayElement(users).id,
      propertyId: Math.random() > 0.5 ? faker.helpers.arrayElement(properties).id : null,
      dealId: Math.random() > 0.7 ? faker.helpers.arrayElement(deals).id : null,
      totalRecipients,
      sentCount,
      openedCount: status === 'sent' ? Math.floor(sentCount * faker.number.float({ min: 0.15, max: 0.50, precision: 0.01 })) : 0,
      clickedCount: status === 'sent' ? Math.floor(sentCount * faker.number.float({ min: 0.05, max: 0.15, precision: 0.01 })) : 0,
      bouncedCount: status === 'sent' ? Math.floor(sentCount * faker.number.float({ min: 0.01, max: 0.03, precision: 0.001 })) : 0,
      unsubscribedCount: status === 'sent' ? Math.floor(sentCount * faker.number.float({ min: 0.001, max: 0.01, precision: 0.001 })) : 0,
      createdAt: faker.date.between({ from: '2024-08-01', to: '2025-10-19' }),
      updatedAt: new Date()
    });
  }
  
  const createdCampaigns = await Campaign.bulkCreate(campaigns, { transaction });
  console.log(`✅ Created ${createdCampaigns.length} campaigns\n`);
  return createdCampaigns;
}

async function seedEmailEvents(campaigns, contacts, transaction) {
  console.log('📨 Seeding Email Events (1500+)...');
  
  const eventTypes = ['processed', 'delivered', 'open', 'click', 'bounce', 'unsubscribe'];
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15',
    'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15'
  ];
  
  const events = [];
  const sentCampaigns = campaigns.filter(c => c.status === 'sent');
  
  let totalEvents = 0;
  
  for (const campaign of sentCampaigns) {
    const numRecipients = Math.min(campaign.totalRecipients, 200);
    const selectedContacts = faker.helpers.arrayElements(contacts, numRecipients);
    
    for (const contact of selectedContacts) {
      const messageId = `${campaign.id}-${contact.id}-${faker.string.alphanumeric(16)}`;
      const baseTimestamp = campaign.sentDate || new Date();
      
      events.push({
        contactId: contact.id,
        campaignId: campaign.id,
        messageId,
        eventType: 'processed',
        eventTimestamp: new Date(baseTimestamp.getTime() - 60000),
        metadata: { ip: faker.internet.ipv4() }
      });
      
      if (Math.random() < 0.95) {
        events.push({
          contactId: contact.id,
          campaignId: campaign.id,
          messageId,
          eventType: 'delivered',
          eventTimestamp: new Date(baseTimestamp.getTime()),
          metadata: { ip: faker.internet.ipv4() }
        });
        
        if (Math.random() < 0.40) {
          events.push({
            contactId: contact.id,
            campaignId: campaign.id,
            messageId,
            eventType: 'open',
            eventTimestamp: new Date(baseTimestamp.getTime() + faker.number.int({ min: 300000, max: 86400000 })),
            metadata: {
              ip: faker.internet.ipv4(),
              userAgent: faker.helpers.arrayElement(userAgents)
            }
          });
          
          if (Math.random() < 0.25) {
            events.push({
              contactId: contact.id,
              campaignId: campaign.id,
              messageId,
              eventType: 'click',
              eventTimestamp: new Date(baseTimestamp.getTime() + faker.number.int({ min: 600000, max: 172800000 })),
              metadata: {
                ip: faker.internet.ipv4(),
                userAgent: faker.helpers.arrayElement(userAgents),
                url: faker.internet.url()
              }
            });
          }
        }
      } else if (Math.random() < 0.02) {
        events.push({
          contactId: contact.id,
          campaignId: campaign.id,
          messageId,
          eventType: 'bounce',
          eventTimestamp: new Date(baseTimestamp.getTime() + 30000),
          metadata: {
            reason: faker.helpers.arrayElement(['mailbox_full', 'invalid_email', 'spam_blocked'])
          }
        });
      }
      
      if (Math.random() < 0.01) {
        events.push({
          contactId: contact.id,
          campaignId: campaign.id,
          messageId,
          eventType: 'unsubscribe',
          eventTimestamp: new Date(baseTimestamp.getTime() + faker.number.int({ min: 86400000, max: 604800000 })),
          metadata: { ip: faker.internet.ipv4() }
        });
      }
    }
    
    totalEvents += selectedContacts.length;
  }
  
  console.log(`  Creating ${events.length} email events in batches...`);
  const createdEvents = [];
  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE);
    const batchResult = await EmailEvent.bulkCreate(batch, { transaction });
    createdEvents.push(...batchResult);
    console.log(`  ✓ Created ${Math.min(i + BATCH_SIZE, events.length)}/${events.length} email events`);
  }
  
  console.log(`✅ Created ${createdEvents.length} email events\n`);
  return createdEvents;
}

async function seedCalendarAccounts(users, transaction) {
  console.log('📅 Seeding Calendar Accounts (2-3)...');
  
  const selectedUsers = faker.helpers.arrayElements(users, 3);
  const providers = ['google', 'microsoft'];
  
  const accounts = [];
  
  for (let i = 0; i < selectedUsers.length; i++) {
    const user = selectedUsers[i];
    const provider = providers[i % providers.length];
    
    const mockToken = faker.string.alphanumeric(128);
    const encryptedToken = await encryptCalendarToken(mockToken);
    
    accounts.push({
      userId: user.id,
      provider,
      email: user.email,
      accessToken: encryptedToken,
      refreshToken: encryptedToken,
      expiresAt: new Date(Date.now() + 3600000),
      scopes: provider === 'google' 
        ? ['https://www.googleapis.com/auth/calendar.readonly']
        : ['Calendars.Read'],
      isActive: true,
      lastSyncedAt: faker.date.between({ from: '2025-10-18', to: '2025-10-19' })
    });
  }
  
  const createdAccounts = await CalendarAccount.bulkCreate(accounts, { transaction });
  console.log(`✅ Created ${createdAccounts.length} calendar accounts\n`);
  return createdAccounts;
}

async function seedCalendarEvents(calendarAccounts, transaction) {
  console.log('📆 Seeding Calendar Events (50-100)...');
  
  const eventTitles = [
    'Property Showing',
    'Client Meeting',
    'Site Visit',
    'Investment Review',
    'Team Standup',
    'Lease Signing',
    'Contract Negotiation',
    'Property Inspection',
    'Investor Call',
    'Market Analysis Meeting'
  ];
  
  const locations = [
    '123 Main St, San Francisco, CA',
    '456 Market St, New York, NY',
    '789 Broadway, Los Angeles, CA',
    'Conference Room A',
    'Client Office',
    'Property Site',
    'Zoom Meeting',
    'Google Meet'
  ];
  
  const events = [];
  
  for (const account of calendarAccounts) {
    const numEvents = faker.number.int({ min: 15, max: 35 });
    
    for (let i = 0; i < numEvents; i++) {
      const isPast = Math.random() < 0.4;
      const isFuture = !isPast && Math.random() < 0.7;
      const isAllDay = Math.random() < 0.15;
      
      let startDate;
      if (isPast) {
        startDate = faker.date.between({ from: '2025-09-01', to: '2025-10-18' });
      } else if (isFuture) {
        startDate = faker.date.between({ from: '2025-10-20', to: '2025-11-30' });
      } else {
        startDate = new Date();
      }
      
      const duration = isAllDay ? 86400000 : faker.number.int({ min: 1800000, max: 7200000 });
      const endDate = new Date(startDate.getTime() + duration);
      
      const attendeeCount = faker.number.int({ min: 1, max: 5 });
      const attendees = [];
      for (let j = 0; j < attendeeCount; j++) {
        attendees.push({
          email: faker.internet.email(),
          name: faker.person.fullName(),
          responseStatus: faker.helpers.arrayElement(['accepted', 'declined', 'tentative', 'needsAction'])
        });
      }
      
      events.push({
        calendarAccountId: account.id,
        externalId: `${account.provider}-${faker.string.alphanumeric(32)}`,
        title: faker.helpers.arrayElement(eventTitles),
        description: faker.lorem.sentence(),
        start: startDate,
        end: endDate,
        location: faker.helpers.arrayElement(locations),
        attendees,
        status: faker.helpers.arrayElement(['confirmed', 'tentative']),
        isAllDay,
        timezone: 'America/New_York',
        metadata: {
          source: account.provider,
          color: faker.helpers.arrayElement(['#1E88E5', '#43A047', '#FB8C00', '#E53935'])
        }
      });
    }
  }
  
  const createdEvents = await CalendarEvent.bulkCreate(events, { transaction });
  console.log(`✅ Created ${createdEvents.length} calendar events\n`);
  return createdEvents;
}

async function seedDashboards(users, transaction) {
  console.log('📊 Seeding Dashboards (5-10)...');
  
  const dashboardNames = [
    'Sales Overview',
    'Agent Performance',
    'Pipeline Metrics',
    'Marketing Analytics',
    'Property Portfolio',
    'Task Management',
    'Revenue Dashboard',
    'Executive Summary'
  ];
  
  const dashboards = [];
  const selectedUsers = faker.helpers.arrayElements(users, 5);
  
  for (let i = 0; i < dashboardNames.length; i++) {
    const user = selectedUsers[i % selectedUsers.length];
    const isShared = Math.random() < 0.3;
    
    dashboards.push({
      userId: user.id,
      name: dashboardNames[i],
      description: faker.lorem.sentence(),
      isShared,
      sharedWith: isShared ? faker.helpers.arrayElements(users.map(u => u.id), faker.number.int({ min: 1, max: 3 })) : [],
      layout: {},
      isDefault: i === 0 && user.role === 'admin',
      isActive: true
    });
  }
  
  const createdDashboards = await Dashboard.bulkCreate(dashboards, { transaction });
  console.log(`✅ Created ${createdDashboards.length} dashboards\n`);
  return createdDashboards;
}

async function seedWidgets(dashboards, transaction) {
  console.log('📈 Seeding Widgets (20-30)...');
  
  const widgetTypes = ['kpi', 'bar', 'line', 'pie', 'table', 'funnel'];
  const datasets = ['deals', 'tasks', 'properties', 'contacts', 'campaigns', 'agents'];
  
  const widgetTemplates = [
    { title: 'Total Deals This Month', type: 'kpi', dataset: 'deals', query: { filters: {}, metrics: ['count'] } },
    { title: 'Deals by Stage', type: 'bar', dataset: 'deals', query: { groupBy: 'stage', metrics: ['count', 'value'] } },
    { title: 'Open Tasks by Priority', type: 'pie', dataset: 'tasks', query: { groupBy: 'priority', metrics: ['count'] } },
    { title: 'Properties by Type', type: 'bar', dataset: 'properties', query: { groupBy: 'propertyType', metrics: ['count'] } },
    { title: 'Lead Conversion Funnel', type: 'funnel', dataset: 'contacts', query: { groupBy: 'leadStatus', metrics: ['count'] } },
    { title: 'Campaign Performance', type: 'line', dataset: 'campaigns', query: { groupBy: 'sentDate', metrics: ['openRate', 'clickRate'] } },
    { title: 'Revenue by Month', type: 'line', dataset: 'deals', query: { groupBy: 'closedDate', metrics: ['value'] } },
    { title: 'Tasks by Status', type: 'pie', dataset: 'tasks', query: { groupBy: 'status', metrics: ['count'] } },
    { title: 'Top Agents by Deals', type: 'bar', dataset: 'agents', query: { groupBy: 'agent', metrics: ['dealsCount', 'revenue'] } },
    { title: 'Active Properties', type: 'kpi', dataset: 'properties', query: { filters: { listingType: 'for_sale' }, metrics: ['count'] } }
  ];
  
  const widgets = [];
  
  for (const dashboard of dashboards) {
    const numWidgets = faker.number.int({ min: 3, max: 5 });
    const selectedTemplates = faker.helpers.arrayElements(widgetTemplates, numWidgets);
    
    selectedTemplates.forEach((template, index) => {
      const x = (index % 3) * 4;
      const y = Math.floor(index / 3) * 4;
      
      widgets.push({
        dashboardId: dashboard.id,
        type: template.type,
        dataset: template.dataset,
        query: template.query,
        title: template.title,
        position: { x, y, w: 4, h: 4 },
        refreshInterval: faker.helpers.arrayElement([null, 300, 600, 1800]),
        isActive: true
      });
    });
  }
  
  const createdWidgets = await Widget.bulkCreate(widgets, { transaction });
  console.log(`✅ Created ${createdWidgets.length} widgets\n`);
  return createdWidgets;
}

async function main() {
  const startTime = Date.now();
  console.log('🚀 Starting Phase 1 Seed Process...\n');
  console.log('═'.repeat(60));
  
  const fakerModule = await import('@faker-js/faker');
  faker = fakerModule.faker;
  
  let transaction;
  
  try {
    await clearPhase1Data();
    
    transaction = await sequelize.transaction();
    
    const users = await seedUsers(transaction);
    const companies = await seedCompanies(users, transaction);
    const contacts = await seedContacts(users, companies, transaction);
    const properties = await seedProperties(users, contacts, transaction);
    const deals = await seedDeals(users, contacts, properties, transaction);
    const tasks = await seedTasks(users, contacts, properties, deals, transaction);
    const campaigns = await seedCampaigns(users, properties, deals, transaction);
    const emailEvents = await seedEmailEvents(campaigns, contacts, transaction);
    
    await transaction.commit();
    
    // Seed calendar and dashboard data outside transaction (tables may not exist yet)
    let calendarAccounts = [];
    let calendarEvents = [];
    try {
      calendarAccounts = await seedCalendarAccounts(users, null);
      calendarEvents = await seedCalendarEvents(calendarAccounts, null);
    } catch (error) {
      console.log('  ⚠ Could not seed calendar data (tables may not exist yet):', error.message);
      console.log('  → Run database migrations to enable calendar features\n');
    }
    
    let dashboards = [];
    let widgets = [];
    try {
      dashboards = await seedDashboards(users, null);
      widgets = await seedWidgets(dashboards, null);
    } catch (error) {
      console.log('  ⚠ Could not seed dashboard data (tables may not exist yet):', error.message);
      console.log('  → Run database migrations to enable dashboard features\n');
    }
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('═'.repeat(60));
    console.log('✅ PHASE 1 SEED COMPLETED SUCCESSFULLY!\n');
    console.log('📋 SUMMARY:');
    console.log(`  👥 Users: ${users.length}`);
    console.log(`  🏢 Companies: ${companies.length}`);
    console.log(`  👤 Contacts: ${contacts.length}`);
    console.log(`  🏢 Properties: ${properties.length}`);
    console.log(`  💼 Deals: ${deals.length}`);
    console.log(`  ✅ Tasks: ${tasks.length}`);
    console.log(`  📧 Campaigns: ${campaigns.length}`);
    console.log(`  📨 Email Events: ${emailEvents.length}`);
    console.log(`  📅 Calendar Accounts: ${calendarAccounts.length}`);
    console.log(`  📆 Calendar Events: ${calendarEvents.length}`);
    console.log(`  📊 Dashboards: ${dashboards.length}`);
    console.log(`  📈 Widgets: ${widgets.length}`);
    console.log(`\n⏱️  Execution Time: ${duration}s`);
    console.log('═'.repeat(60));
    
    process.exit(0);
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    console.error('\n❌ SEED FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
