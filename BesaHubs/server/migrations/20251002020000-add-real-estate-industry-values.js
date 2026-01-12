'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const enumName = 'enum_companies_industry';
      
      const checkValueExists = async (value) => {
        const result = await queryInterface.sequelize.query(
          `SELECT EXISTS(
            SELECT 1 FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = :enumName)
            AND enumlabel = :value
          ) as exists`,
          {
            replacements: { enumName, value },
            type: Sequelize.QueryTypes.SELECT,
            transaction
          }
        );
        return result[0].exists;
      };
      
      const realEstateExists = await checkValueExists('real_estate');
      if (!realEstateExists) {
        await queryInterface.sequelize.query(
          `ALTER TYPE ${enumName} ADD VALUE 'real_estate'`,
          { transaction }
        );
        console.log('✅ Added "real_estate" to enum_companies_industry');
      } else {
        console.log('ℹ️  "real_estate" already exists in enum_companies_industry');
      }
      
      const commercialRealEstateExists = await checkValueExists('commercial_real_estate');
      if (!commercialRealEstateExists) {
        await queryInterface.sequelize.query(
          `ALTER TYPE ${enumName} ADD VALUE 'commercial_real_estate'`,
          { transaction }
        );
        console.log('✅ Added "commercial_real_estate" to enum_companies_industry');
      } else {
        console.log('ℹ️  "commercial_real_estate" already exists in enum_companies_industry');
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    console.warn('⚠️  WARNING: PostgreSQL does not support removing enum values.');
    console.warn('⚠️  The enum values "real_estate" and "commercial_real_estate" cannot be automatically removed.');
    console.warn('⚠️  To manually remove these values, you would need to:');
    console.warn('⚠️  1. Ensure no rows use these values');
    console.warn('⚠️  2. Drop and recreate the enum type');
    console.warn('⚠️  3. Recreate the column with the new enum type');
    console.warn('⚠️  This is a destructive operation and should be done with caution.');
  }
};
