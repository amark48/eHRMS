'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Rename the column from enableMfa to mfaEnabled in the Tenants table.
    await queryInterface.renameColumn('Tenants', 'enableMfa', 'mfaEnabled');
  },

  down: async (queryInterface, Sequelize) => {
    // Revert the change by renaming mfaEnabled back to enableMfa.
    await queryInterface.renameColumn('Tenants', 'mfaEnabled', 'enableMfa');
  }
};