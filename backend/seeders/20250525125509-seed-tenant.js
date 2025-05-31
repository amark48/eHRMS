"use strict";
const fs = require("fs");
const path = require("path");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Adjust the path to point to your tenants.json file.
    const filePath = path.join(__dirname, "../seeders/tenants.json");

    // Read the file, remove any BOM, and parse the JSON.
    let tenantsData = fs
      .readFileSync(filePath, "utf8")
      .replace(/^\uFEFF/, "");
    const tenants = JSON.parse(tenantsData);

    // Process each tenant individually.
    for (const tenant of tenants) {
      try {
        // Insert a single tenant record.
        await queryInterface.bulkInsert("Tenants", [tenant], {});
      } catch (error) {
        // If the error is due to a unique constraint violation, log and continue;
        // otherwise, re-throw the error.
        if (error.name === "SequelizeUniqueConstraintError") {
          console.log(
            `Skipping tenant with domain "${tenant.domain}" because it already exists.`
          );
        } else {
          throw error;
        }
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // To reverse the seed, read the tenants.json and delete those records based on domain.
    const filePath = path.join(__dirname, "../seeders/tenants.json");
    let tenantsData = fs
      .readFileSync(filePath, "utf8")
      .replace(/^\uFEFF/, "");
    const tenants = JSON.parse(tenantsData);
    const domains = tenants.map((tenant) => tenant.domain);
    return queryInterface.bulkDelete("Tenants", { domain: domains }, {});
  }
};