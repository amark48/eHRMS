'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Tenants', 'employeeCount', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Employee count range for the tenant (e.g., "1 - 10 employees", "11 - 50 employees", etc.)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Tenants', 'employeeCount');
  }
};
