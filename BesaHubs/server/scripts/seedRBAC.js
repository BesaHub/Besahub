const { sequelize } = require('../config/database');
const { seedPermissions } = require('../seeders/permissionsSeeder');

async function seedRBAC() {
  try {
    console.log('🚀 Starting RBAC Database Setup...');
    
    console.log('📊 Syncing database models...');
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synced successfully');

    console.log('🌱 Seeding permissions and roles...');
    await seedPermissions();
    
    console.log('🎉 RBAC setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - All RBAC tables created');
    console.log('   - Default roles created (admin, manager, agent, assistant)');
    console.log('   - Permissions populated for all resources');
    console.log('   - Role-permission assignments completed');
    console.log('\n✅ Your RBAC system is ready to use!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up RBAC:', error);
    process.exit(1);
  }
}

seedRBAC();
