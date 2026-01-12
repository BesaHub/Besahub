#!/usr/bin/env node

const { sequelize } = require('../config/database');
// Import all models to ensure they're loaded
require('../models');

async function syncDatabase() {
  try {
    console.log('🔄 Starting database synchronization...');

    // Test connection first
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Drop and recreate all tables (CAUTION: This will delete all data)
    // Use force: true for development setup
    console.log('⚠️  WARNING: This will drop all existing tables and data!');
    await sequelize.sync({ force: true });

    console.log('✅ Database synchronized successfully');

    // Show created tables
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Tables in database:', tables);

    process.exit(0);
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  syncDatabase();
}

module.exports = syncDatabase;