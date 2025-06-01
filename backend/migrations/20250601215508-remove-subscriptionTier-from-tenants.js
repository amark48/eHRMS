'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove the subscriptionTier column from the Tenants table.
    await queryInterface.removeColumn('Tenants', 'subscriptionTier');
  },

  down: async (queryInterface, Sequelize) => {
    // In case of a rollback, re-add the subscriptionTier column.
    await queryInterface.addColumn('Tenants', 'subscriptionTier', {
      type: Sequelize.STRING,
      allowNull: false,
      comment: "Legacy field; removed in favor of normalized subscriptionId",
    });
  },
};
