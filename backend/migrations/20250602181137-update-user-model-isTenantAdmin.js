'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'isTenantAdmin', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: "Indicates if this user is the tenant admin",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'isTenantAdmin');
  },
};
