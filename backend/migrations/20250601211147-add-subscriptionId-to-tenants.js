'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Tenants', 'subscriptionId', {
      type: Sequelize.UUID,
      allowNull: true,
      comment: "Foreign key referencing subscription plan",
      references: {
        model: 'Subscriptions',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Tenants', 'subscriptionId');
  },
};
