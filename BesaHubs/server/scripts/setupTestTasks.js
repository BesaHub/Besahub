#!/usr/bin/env node

require('dotenv').config();
const { sequelize, Task, User, Property, Deal, Contact, Company } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Test tasks data for realistic real estate CRM scenarios
const testTasks = [
  {
    title: 'Property Site Visit - Downtown Office Tower',
    description: 'Schedule and conduct site visit with client John Smith for the downtown office building at 123 Main St. Need to review floor plans, amenities, and discuss lease terms.',
    taskType: 'site_visit',
    status: 'pending',
    priority: 'high',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    startDate: new Date(),
    estimatedDuration: 120,
    notes: 'Client is interested in 5,000 sq ft on the 12th floor. Bring building specifications and comparable pricing data.'
  },
  {
    title: 'Follow up on Retail Space Inquiry',
    description: 'Contact Sarah Johnson regarding her interest in the retail space at Westfield Shopping Center. Send property brochure and schedule viewing.',
    taskType: 'follow_up',
    status: 'in_progress',
    priority: 'medium',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
    startDate: new Date(),
    estimatedDuration: 30,
    notes: 'Client expressed interest via website form. Looking for 2,500 sq ft retail space.'
  },
  {
    title: 'Review Lease Agreement - Tech Startup',
    description: 'Review and finalize lease agreement for TechCo startup moving into Innovation Hub. Legal team has approved, need final client signature.',
    taskType: 'document_review',
    status: 'pending',
    priority: 'urgent',
    dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
    startDate: new Date(),
    estimatedDuration: 45,
    notes: 'Lease term: 3 years, Monthly rent: $8,500, Move-in date: Next month'
  },
  {
    title: 'Market Analysis Report - Industrial Zone',
    description: 'Complete comprehensive market analysis for industrial properties in the East Industrial Zone. Include vacancy rates, rental trends, and competitor analysis.',
    taskType: 'market_analysis',
    status: 'in_progress',
    priority: 'medium',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Started 2 days ago
    estimatedDuration: 480,
    notes: 'Focus on warehouses 10,000-50,000 sq ft. Include Q4 projections.'
  },
  {
    title: 'Client Meeting - Portfolio Review',
    description: 'Quarterly portfolio review meeting with Robert Chen to discuss investment property performance and potential acquisitions.',
    taskType: 'meeting',
    status: 'pending',
    priority: 'high',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    estimatedDuration: 90,
    notes: 'Prepare ROI analysis for current properties. Bring list of new investment opportunities.'
  },
  {
    title: 'Call Tenant - Maintenance Issue',
    description: 'Contact tenant at Building A, Suite 300 regarding reported HVAC issue. Coordinate with maintenance team for repair schedule.',
    taskType: 'call',
    status: 'completed',
    priority: 'low',
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday (completed)
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    estimatedDuration: 15,
    notes: 'Issue resolved. Maintenance scheduled for tomorrow morning.'
  },
  {
    title: 'Property Showing - Luxury Penthouse',
    description: 'Show luxury penthouse unit to international investor group. Prepare presentation materials highlighting unique features and investment potential.',
    taskType: 'property_showing',
    status: 'pending',
    priority: 'high',
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    startDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    estimatedDuration: 60,
    notes: 'VIP clients. Ensure property is staged. Arrange for translator if needed.'
  },
  {
    title: 'Email Campaign - New Listings',
    description: 'Send out monthly newsletter featuring new commercial property listings to subscriber base. Include market trends section.',
    taskType: 'email',
    status: 'pending',
    priority: 'medium',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    estimatedDuration: 120,
    notes: 'Feature 5 premium properties. Include Q3 market summary.'
  },
  {
    title: 'Overdue: Submit Zoning Application',
    description: 'Submit zoning variance application for mixed-use development project on Elm Street. Deadline was yesterday.',
    taskType: 'document_review',
    status: 'in_progress',
    priority: 'urgent',
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday (overdue)
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    estimatedDuration: 180,
    notes: 'URGENT: Contact city planning office ASAP. May need to request extension.'
  },
  {
    title: 'Property Valuation - Office Complex',
    description: 'Coordinate property valuation for Riverside Office Complex. Appraiser scheduled for next week.',
    taskType: 'other',
    status: 'pending',
    priority: 'medium',
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    estimatedDuration: 240,
    notes: 'Prepare all property documents, recent improvements list, and rental income statements.'
  }
];

async function setupTestTasks() {
  try {
    console.log('🚀 Starting test tasks setup...');

    // Find the admin user
    const adminUser = await User.findOne({
      where: { email: 'admin@demo.com' }
    });

    if (!adminUser) {
      console.error('❌ Admin user not found. Please ensure the database is seeded.');
      process.exit(1);
    }

    console.log(`✅ Found admin user: ${adminUser.firstName} ${adminUser.lastName}`);

    // Get some related entities for tasks
    const [properties, deals, contacts, companies] = await Promise.all([
      Property.findAll({ limit: 3 }),
      Deal.findAll({ limit: 3 }),
      Contact.findAll({ limit: 3 }),
      Company.findAll({ limit: 3 })
    ]);

    // Delete existing tasks to start fresh
    await Task.destroy({ where: {} });
    console.log('🗑️  Cleared existing tasks');

    // Create tasks with relationships
    const createdTasks = [];
    for (let i = 0; i < testTasks.length; i++) {
      const taskData = {
        ...testTasks[i],
        assignedToId: adminUser.id,
        createdById: adminUser.id,
        // Randomly assign relationships
        propertyId: properties[i % properties.length]?.id || null,
        dealId: deals[i % deals.length]?.id || null,
        contactId: contacts[i % contacts.length]?.id || null,
        companyId: companies[i % companies.length]?.id || null
      };

      const task = await Task.create(taskData);
      createdTasks.push(task);
      console.log(`✅ Created task: ${task.title}`);
    }

    // Display summary
    const taskSummary = await Task.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    console.log('\n📊 Task Summary:');
    console.log('================');
    taskSummary.forEach(stat => {
      console.log(`${stat.status}: ${stat.dataValues.count} tasks`);
    });

    const overdueTasks = await Task.count({
      where: {
        dueDate: { [sequelize.Sequelize.Op.lt]: new Date() },
        status: { [sequelize.Sequelize.Op.notIn]: ['completed', 'cancelled'] }
      }
    });
    console.log(`Overdue: ${overdueTasks} tasks`);

    console.log('\n✅ Test tasks setup completed successfully!');
    console.log(`Total tasks created: ${createdTasks.length}`);

    // Generate a token for testing
    const token = jwt.sign(
      { 
        id: adminUser.id, 
        email: adminUser.email, 
        role: adminUser.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('\n🔑 Test Authentication Token (for API testing):');
    console.log('================================================');
    console.log(token);
    console.log('\nUse this token in the Authorization header as: Bearer ' + token);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up test tasks:', error);
    process.exit(1);
  }
}

// Run the setup
setupTestTasks();