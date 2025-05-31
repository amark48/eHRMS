"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get the current table definition for "Tenants"
    const tableDefinition = await queryInterface.describeTable("Tenants");

    // Check if the "domain" column already exists.
    if (!tableDefinition.domain) {
      console.log("[DEBUG] 'domain' column does not exist. Adding it now.");
      await queryInterface.addColumn("Tenants", "domain", {
        type: Sequelize.STRING,
        allowNull: true, // Temporarily allow nulls
        comment: "Email domain associated with the company for identification purposes",
      });
    } else {
      console.log("[DEBUG] 'domain' column already exists. Skipping addColumn step.");
    }

    // Update all existing tenant records to set the domain to 'democorp.com'
    console.log("[DEBUG] Updating existing tenant records with domain 'democorp.com'");
    await queryInterface.sequelize.query(`
      UPDATE "Tenants"
      SET "domain" = 'democorp.com'
      WHERE "domain" IS NULL;
    `);

    // Change the 'domain' column to disallow null values (without inline unique)
    console.log("[DEBUG] Changing 'domain' column to be non-nullable");
    await queryInterface.changeColumn("Tenants", "domain", {
      type: Sequelize.STRING,
      allowNull: false,
      comment: "Email domain associated with the company for identification purposes",
    });

    // Add a unique constraint to the 'domain' column separately.
    console.log("[DEBUG] Adding unique constraint to 'domain' column");
    await queryInterface.addConstraint("Tenants", {
      fields: ["domain"],
      type: "unique",
      name: "unique_domain_constraint",
    });

    console.log("[DEBUG] Migration up complete");
  },

  down: async (queryInterface, Sequelize) => {
    console.log("[DEBUG] Removing unique constraint from 'domain' column");
    // Remove unique constraint before dropping the column.
    await queryInterface.removeConstraint("Tenants", "unique_domain_constraint");

    console.log("[DEBUG] Removing 'domain' column from Tenants");
    await queryInterface.removeColumn("Tenants", "domain");

    console.log("[DEBUG] Migration down complete");
  },
};