const moment = require('moment');
const { sequelize } = require('../config/database');
const { Lease, Debt, Property, Contact, Company, Trigger } = require('../models');
const triggerService = require('../services/triggerService');

async function seedLeasesAndDebt() {
  try {
    console.log('🚀 Starting Lease & Debt Seed Process...\n');

    console.log('📊 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    if (process.env.NODE_ENV !== 'development') {
      console.log('⛔ Seed script is only for DEVELOPMENT environment');
      console.log(`Current NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
      console.log('To run this script, set NODE_ENV=development');
      await sequelize.close();
      process.exit(1);
    }

    console.log('🧹 Cleaning existing lease/debt seed data...\n');
    
    const deletedTriggers = await Trigger.destroy({ 
      where: { 
        type: ['lease_expiration', 'debt_maturity'] 
      } 
    });
    console.log(`   ✓ Deleted ${deletedTriggers} existing triggers`);

    const deletedLeases = await Lease.destroy({ where: {} });
    console.log(`   ✓ Deleted ${deletedLeases} existing leases`);

    const deletedDebts = await Debt.destroy({ where: {} });
    console.log(`   ✓ Deleted ${deletedDebts} existing debt records\n`);

    console.log('🔍 Querying existing data...');
    
    let properties = await Property.findAll({ attributes: ['id', 'name'] });
    let contacts = await Contact.findAll({ attributes: ['id', 'firstName', 'lastName', 'companyName'] });
    let companies = await Company.findAll({ attributes: ['id', 'name'] });

    console.log(`   Found ${properties.length} properties`);
    console.log(`   Found ${contacts.length} contacts`);
    console.log(`   Found ${companies.length} companies\n`);

    if (properties.length === 0) {
      console.log('📝 Creating sample properties...');
      const sampleProperties = [
        {
          name: 'Downtown Office Tower',
          propertyType: 'office',
          buildingClass: 'A',
          status: 'available',
          listingType: 'both',
          address: '123 Main Street',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          totalSquareFootage: 50000,
          yearBuilt: 2015,
          floors: 12
        },
        {
          name: 'Riverside Retail Center',
          propertyType: 'retail',
          buildingClass: 'B',
          status: 'available',
          listingType: 'lease',
          address: '456 Commerce Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          totalSquareFootage: 75000,
          yearBuilt: 2010,
          floors: 2
        },
        {
          name: 'Industrial Park West',
          propertyType: 'industrial',
          buildingClass: 'B',
          status: 'available',
          listingType: 'both',
          address: '789 Industrial Blvd',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          totalSquareFootage: 120000,
          yearBuilt: 2008,
          floors: 1
        },
        {
          name: 'Tech Campus Building 3',
          propertyType: 'office',
          buildingClass: 'A',
          status: 'available',
          listingType: 'lease',
          address: '321 Innovation Drive',
          city: 'Austin',
          state: 'TX',
          zipCode: '73301',
          totalSquareFootage: 85000,
          yearBuilt: 2018,
          floors: 8
        },
        {
          name: 'Harbor Logistics Center',
          propertyType: 'warehouse',
          buildingClass: 'C',
          status: 'available',
          listingType: 'both',
          address: '555 Port Road',
          city: 'Miami',
          state: 'FL',
          zipCode: '33101',
          totalSquareFootage: 200000,
          yearBuilt: 2005,
          floors: 1
        }
      ];

      properties = await Property.bulkCreate(sampleProperties, { validate: true, returning: true });
      console.log(`✅ Created ${properties.length} sample properties\n`);
    }

    if (contacts.length === 0) {
      console.log('📝 Creating sample contacts (tenants)...');
      const sampleContacts = [
        {
          type: 'company',
          companyName: 'Tech Innovations Inc',
          primaryEmail: 'info@techinnovations.com',
          primaryPhone: '2125551234',
          contactRole: 'tenant',
          leadStatus: 'qualified',
          isActive: true
        },
        {
          type: 'individual',
          firstName: 'Sarah',
          lastName: 'Johnson',
          companyName: 'Johnson Retail Group',
          primaryEmail: 'sjohnson@jrgretail.com',
          primaryPhone: '3105552345',
          contactRole: 'tenant',
          leadStatus: 'qualified',
          isActive: true
        },
        {
          type: 'company',
          companyName: 'Global Manufacturing Solutions',
          primaryEmail: 'leasing@globalmfg.com',
          primaryPhone: '3125553456',
          contactRole: 'tenant',
          leadStatus: 'qualified',
          isActive: true
        },
        {
          type: 'company',
          companyName: 'Apex Distribution LLC',
          primaryEmail: 'facilities@apexdist.com',
          primaryPhone: '5125554567',
          contactRole: 'tenant',
          leadStatus: 'hot',
          isActive: true
        },
        {
          type: 'individual',
          firstName: 'Michael',
          lastName: 'Chen',
          companyName: 'Chen Medical Services',
          primaryEmail: 'mchen@chenmedical.com',
          primaryPhone: '3055555678',
          contactRole: 'tenant',
          leadStatus: 'qualified',
          isActive: true
        },
        {
          type: 'company',
          companyName: 'Riverside Fitness Studios',
          primaryEmail: 'admin@riversidefitness.com',
          primaryPhone: '4155556789',
          contactRole: 'tenant',
          leadStatus: 'warm',
          isActive: true
        }
      ];

      contacts = await Contact.bulkCreate(sampleContacts, { validate: true, returning: true });
      console.log(`✅ Created ${contacts.length} sample contacts\n`);
    }

    if (companies.length < 3) {
      console.log('📝 Creating lender companies...');
      const lenderCompanies = [
        {
          name: 'First National Commercial Bank',
          legalName: 'First National Commercial Bank Corp.',
          companyType: 'corporation',
          industry: 'finance',
          primaryEmail: 'lending@firstnationalcb.com',
          primaryPhone: '2125551000',
          address: '350 Park Avenue',
          city: 'New York',
          state: 'NY',
          zipCode: '10022',
          country: 'US',
          isActive: true
        },
        {
          name: 'Capital Trust Lending Group',
          legalName: 'Capital Trust Lending Group LLC',
          companyType: 'llc',
          industry: 'finance',
          primaryEmail: 'info@capitaltrustlending.com',
          primaryPhone: '3105552000',
          address: '11100 Santa Monica Blvd',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90025',
          country: 'US',
          isActive: true
        },
        {
          name: 'Metropolitan Mortgage Partners',
          legalName: 'Metropolitan Mortgage Partners Inc.',
          companyType: 'corporation',
          industry: 'finance',
          primaryEmail: 'loans@metromortgage.com',
          primaryPhone: '3125553000',
          address: '233 South Wacker Drive',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60606',
          country: 'US',
          isActive: true
        }
      ];

      const createdCompanies = await Company.bulkCreate(lenderCompanies, { 
        validate: true,
        returning: true 
      });
      companies = [...companies, ...createdCompanies];
      console.log(`✅ Created ${createdCompanies.length} lender companies\n`);
    }

    const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const getRandomDecimal = (min, max, decimals = 2) => {
      return (Math.random() * (max - min) + min).toFixed(decimals);
    };

    console.log('🏢 Generating lease data...\n');
    
    const leases = [];
    const today = moment();

    const leaseCategories = [
      { count: 3, monthsRange: [2, 3], description: '3-month alert' },
      { count: 3, monthsRange: [5, 7], description: '6-month alert' },
      { count: 3, monthsRange: [8, 10], description: '9-month alert' },
      { count: 3, monthsRange: [11, 13], description: '12-month alert' },
      { count: 3, monthsRange: [18, 24], description: 'no trigger' }
    ];

    const termsTemplates = [
      'Standard commercial lease with triple net provisions. Tenant responsible for property taxes, insurance, and maintenance.',
      'Full-service lease including janitorial services, utilities, and building maintenance. Landlord covers all operating expenses.',
      'Modified gross lease with tenant paying utilities and janitorial. Landlord covers property taxes and insurance.',
      'Ground lease for retail development. Tenant responsible for construction and all improvements.',
      'Industrial lease with warehouse and office space. Includes loading dock access and 24/7 operational rights.'
    ];

    const optionsTemplates = [
      'Two 5-year renewal options at market rate with 180 days notice required.',
      'One 3-year renewal option at 3% rent increase with 120 days notice.',
      'Right of first refusal on adjacent space. Early termination allowed after year 3 with 6 months rent penalty.',
      'Expansion option for up to 5,000 additional square feet at market rate with 90 days notice.',
      'Three 5-year renewal options with 2.5% annual escalation and 6 months written notice.'
    ];

    leaseCategories.forEach((category, catIndex) => {
      for (let i = 0; i < category.count; i++) {
        const monthsUntilExpiration = getRandomNumber(category.monthsRange[0], category.monthsRange[1]);
        const endDate = moment(today).add(monthsUntilExpiration, 'months').toDate();
        const startDate = moment(endDate).subtract(getRandomNumber(2, 5), 'years').toDate();
        const monthlyRent = getRandomDecimal(5000, 50000, 2);
        const squareFeet = getRandomNumber(2000, 20000);
        
        leases.push({
          propertyId: getRandomElement(properties).id,
          tenantId: getRandomElement(contacts).id,
          startDate,
          endDate,
          monthlyRent,
          squareFeet,
          terms: getRandomElement(termsTemplates),
          options: getRandomElement(optionsTemplates),
          status: i % 5 === 0 ? 'pending' : 'active'
        });

        console.log(`   ✓ Lease ${catIndex * category.count + i + 1}: Expires in ${monthsUntilExpiration} months (${category.description}) - $${monthlyRent}/mo, ${squareFeet} sqft`);
      }
    });

    console.log('\n💰 Generating debt data...\n');
    
    const debts = [];
    const lenders = companies.slice(-3);

    const debtCategories = [
      { count: 3, monthsRange: [4, 6], description: '6-month alert' },
      { count: 3, monthsRange: [10, 12], description: '12-month alert' },
      { count: 3, monthsRange: [18, 24], description: 'no trigger' },
      { count: 2, monthsRange: [-12, -1], description: 'matured (historical)' }
    ];

    const loanTypes = ['mortgage', 'bridge', 'mezzanine', 'mortgage', 'bridge'];
    
    const notesTemplates = [
      'Senior secured loan with first lien position. Monthly interest-only payments with balloon payment at maturity.',
      'Bridge financing for property acquisition. Prepayment allowed without penalty after 6 months.',
      'Permanent financing with 30-year amortization. Rate locked for initial 10-year term.',
      'Mezzanine loan subordinate to first mortgage. Quarterly payments with conversion option to equity.',
      'Construction-to-permanent loan. Interest reserve funded during 18-month construction period.'
    ];

    debtCategories.forEach((category, catIndex) => {
      for (let i = 0; i < category.count; i++) {
        const monthsUntilMaturity = getRandomNumber(category.monthsRange[0], category.monthsRange[1]);
        const maturityDate = moment(today).add(monthsUntilMaturity, 'months').toDate();
        const amount = getRandomDecimal(500000, 5000000, 2);
        const interestRate = getRandomDecimal(3.5, 7.5, 2);
        const dscr = getRandomDecimal(1.1, 1.8, 2);
        const loanType = getRandomElement(loanTypes);
        
        debts.push({
          propertyId: getRandomElement(properties).id,
          lenderId: getRandomElement(lenders).id,
          amount,
          interestRate,
          maturityDate,
          dscr,
          loanType,
          notes: getRandomElement(notesTemplates)
        });

        const statusText = monthsUntilMaturity < 0 ? `Matured ${Math.abs(monthsUntilMaturity)} months ago` : `Matures in ${monthsUntilMaturity} months`;
        const healthStatus = parseFloat(dscr) >= 1.25 ? '✓ Healthy' : '⚠ At Risk';
        console.log(`   ✓ Debt ${catIndex * 3 + i + 1}: ${statusText} (${category.description}) - $${amount} @ ${interestRate}% DSCR: ${dscr} ${healthStatus}`);
      }
    });

    console.log('\n📥 Inserting lease records into database...');
    const createdLeases = await Lease.bulkCreate(leases, { 
      validate: true,
      returning: true 
    });
    console.log(`✅ Successfully created ${createdLeases.length} lease records\n`);

    console.log('📥 Inserting debt records into database...');
    const createdDebts = await Debt.bulkCreate(debts, { 
      validate: true,
      returning: true 
    });
    console.log(`✅ Successfully created ${createdDebts.length} debt records\n`);

    console.log('🔔 Running trigger detection...');
    const triggerResults = await triggerService.runTriggerDetection();
    
    console.log('\n📊 Trigger Detection Results:');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Lease Triggers:`);
    console.log(`      Scanned: ${triggerResults.leases.scanned}`);
    console.log(`      Created: ${triggerResults.leases.created}`);
    console.log(`      Updated: ${triggerResults.leases.updated}`);
    console.log(`      Errors:  ${triggerResults.leases.errors}`);
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Debt Triggers:`);
    console.log(`      Scanned: ${triggerResults.debt.scanned}`);
    console.log(`      Created: ${triggerResults.debt.created}`);
    console.log(`      Updated: ${triggerResults.debt.updated}`);
    console.log(`      Errors:  ${triggerResults.debt.errors}`);
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Total Triggers: ${triggerResults.totals.created + triggerResults.totals.updated}`);
    console.log(`   Detection Time: ${triggerResults.duration}ms`);
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎉 Seed process completed successfully!\n');
    console.log('📋 Summary:');
    console.log(`   ✅ ${createdLeases.length} lease records created`);
    console.log(`   ✅ ${createdDebts.length} debt records created`);
    console.log(`   ✅ ${triggerResults.totals.created} triggers created`);
    console.log(`   ✅ ${triggerResults.totals.updated} triggers updated`);
    console.log('\n✨ Your Lease & Debt Intelligence Layer is ready for testing!');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seed process:', error);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

seedLeasesAndDebt();
