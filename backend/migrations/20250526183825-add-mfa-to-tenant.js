// migrations/20250526XXXX-add-mfa-to-tenants.js
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Tenants', 'enableMfa', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Flag to enable or disable multi-factor authentication for the tenant',
    });
    await queryInterface.addColumn('Tenants', 'allowedMfa', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      defaultValue: [],
      allowNull: false,
      comment: 'The array of MFA methods allowed for the tenant',
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Tenants', 'allowedMfa');
    await queryInterface.removeColumn('Tenants', 'enableMfa');
  }
};