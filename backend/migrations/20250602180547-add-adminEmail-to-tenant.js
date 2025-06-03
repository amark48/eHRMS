'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Tenants", "adminEmail", {
      type: Sequelize.STRING,
      allowNull: true, // Allow NULL temporarily
      unique: true,
      comment: "Primary admin's corporate email used as the username",
    });

    // Backfill existing tenants with valid emails before enforcing non-null constraint
    const tenants = await queryInterface.sequelize.query(
      `SELECT id, name FROM "Tenants";`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const tenant of tenants) {
      await queryInterface.sequelize.query(
        `UPDATE "Tenants" SET "adminEmail" = '${tenant.name.toLowerCase()}@example.com' WHERE id = '${tenant.id}';`
      );
    }

    // Now change the column to enforce allowNull: false
    await queryInterface.changeColumn("Tenants", "adminEmail", {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      comment: "Primary admin's corporate email used as the username",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Tenants", "adminEmail");
  },
};
