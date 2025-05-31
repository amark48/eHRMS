'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Tenants', 'companyWebsite', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "Company website URL",
    });
    await queryInterface.addColumn('Tenants', 'billingStreet', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "Street address for billing",
    });
    await queryInterface.addColumn('Tenants', 'billingCity', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "City for billing",
    });
    await queryInterface.addColumn('Tenants', 'billingState', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "State for billing",
    });
    await queryInterface.addColumn('Tenants', 'billingZip', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "Zip code for billing",
    });
    await queryInterface.addColumn('Tenants', 'billingCountry', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: "US",
      comment: "Billing country (default US)",
    });
    await queryInterface.addColumn('Tenants', 'billingPhone', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "Billing phone number",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Tenants', 'companyWebsite');
    await queryInterface.removeColumn('Tenants', 'billingStreet');
    await queryInterface.removeColumn('Tenants', 'billingCity');
    await queryInterface.removeColumn('Tenants', 'billingState');
    await queryInterface.removeColumn('Tenants', 'billingZip');
    await queryInterface.removeColumn('Tenants', 'billingCountry');
    await queryInterface.removeColumn('Tenants', 'billingPhone');
  }
};