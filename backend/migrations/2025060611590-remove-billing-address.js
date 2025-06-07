'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove billing columns from the Tenants table
    await queryInterface.removeColumn('Tenants', 'billingStreet');
    await queryInterface.removeColumn('Tenants', 'billingCity');
    await queryInterface.removeColumn('Tenants', 'billingState');
    await queryInterface.removeColumn('Tenants', 'billingZip');
    await queryInterface.removeColumn('Tenants', 'billingCountry');
    await queryInterface.removeColumn('Tenants', 'billingPhone');
  },

  down: async (queryInterface, Sequelize) => {
    // Re-add the billing columns to the Tenants table
    await queryInterface.addColumn('Tenants', 'billingStreet', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Tenants', 'billingCity', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Tenants', 'billingState', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Tenants', 'billingZip', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Tenants', 'billingCountry', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Tenants', 'billingPhone', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  }
};
