"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Get the DemoCorp tenant's id.
    const [tenants] = await queryInterface.sequelize.query(`
      SELECT id FROM "Tenants" WHERE "name" = 'DemoCorp';
    `);
    
    if (!tenants.length) {
      console.log("[DEBUG] DemoCorp tenant not found, skipping TenantMfaTypes seeding.");
      return;
    }
    const demoTenantId = tenants[0].id;

    // 2. Get the ids for the MFA types 'TOTP' and 'EMAIL'
    const [mfaTypes] = await queryInterface.sequelize.query(`
      SELECT id, name FROM "MfaTypes" WHERE name IN ('TOTP', 'EMAIL');
    `);
    
    if (!mfaTypes.length) {
      console.log("[DEBUG] MFA types not found, skipping TenantMfaTypes seeding.");
      return;
    }
    
    const tenantMfaData = mfaTypes.map((type) => ({
      tenantId: demoTenantId,
      mfaTypeId: type.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    return queryInterface.bulkInsert("TenantMfaTypes", tenantMfaData, {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("TenantMfaTypes", null, {});
  }
};