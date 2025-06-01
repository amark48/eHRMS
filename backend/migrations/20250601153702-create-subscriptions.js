'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Subscriptions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
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
      // Make sure to create column with snake_case naming for trialPeriodDays:
      trial_period_days: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('active', 'deprecated', 'suspended'),
        allowNull: false,
        defaultValue: 'active',
      },
      // Column for autoRenew mapping:
      auto_renew: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      // Column for renewalDate mapping:
      renewal_date: {
        type: Sequelize.DATE,
        allowNull: true,
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

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Subscriptions');
  }
};
