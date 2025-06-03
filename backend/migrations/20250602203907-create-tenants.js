'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Describe the Tenants table to inspect its current columns.
    const tableDefinition = await queryInterface.describeTable('Tenants');
    // Use lowercase for the key when checking, because most databases store column names in lowercase.
    const columnKey = 'adminemail';

    // Only add the column if it does not already exist
    if (!tableDefinition[columnKey]) {
      await queryInterface.addColumn('Tenants', 'adminEmail', {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: "Primary admin's corporate email used as the username",
      });
      console.log('adminEmail column added to Tenants table.');
    } else {
      console.log('Column "adminEmail" already exists in Tenants table. Skipping addColumn.');
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDefinition = await queryInterface.describeTable('Tenants');
    const columnKey = 'adminemail';

    // Only remove the column if it exists
    if (tableDefinition[columnKey]) {
      await queryInterface.removeColumn('Tenants', 'adminEmail');
      console.log('adminEmail column removed from Tenants table.');
    } else {
      console.log('Column "adminEmail" does not exist in Tenants table. Nothing to remove.');
    }
  }
};