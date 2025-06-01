'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Subscriptions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'), // or Sequelize.UUIDV4 if supported
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      duration: {
        type: Sequelize.ENUM('monthly', 'yearly'),
        allowNull: false,
      },
      features: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      trialPeriodDays: {
        type: Sequelize.INTEGER,
        allowNull: true,
        field: 'trial_period_days',
      },
      status: {
        type: Sequelize.ENUM('active', 'deprecated', 'suspended'),
        allowNull: false,
        defaultValue: 'active',
      },
      autoRenew: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'auto_renew',
      },
      renewalDate: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'renewal_date',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Subscriptions');
  },
};
