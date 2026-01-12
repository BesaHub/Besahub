const { sequelize } = require('../config/database');
const path = require('path');
const fs = require('fs');

async function runMigration(migrationFile) {
  try {
    console.log('🔄 Starting migration:', migrationFile);
    
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    const migrationPath = path.join(__dirname, migrationFile);
    const migration = require(migrationPath);
    
    if (!migration.up) {
      throw new Error('Migration file must export an "up" function');
    }
    
    await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    
    console.log('✅ Migration completed successfully');
    
    const verifyQuery = await sequelize.query(
      `SELECT enumlabel FROM pg_enum 
       WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_companies_industry') 
       ORDER BY enumlabel`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('\n📋 Current enum values:');
    verifyQuery.forEach(row => console.log('  -', row.enumlabel));
    
    await sequelize.close();
    console.log('✅ Migration runner completed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await sequelize.close();
    process.exit(1);
  }
}

const migrationFile = process.argv[2] || '20251002020000-add-real-estate-industry-values.js';
runMigration(migrationFile);
