'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add the new column "isCorporateEmailVerified" to the "Users" table.
    await queryInterface.addColumn('Users', 'isCorporateEmailVerified', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Flag indicating if the corporate email has been verified.'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the "isCorporateEmailVerified" column from the "Users" table.
    await queryInterface.removeColumn('Users', 'isCorporateEmailVerified');
  }
};
