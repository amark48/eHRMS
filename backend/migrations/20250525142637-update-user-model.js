'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Adding new columns to the existing Users table
    await queryInterface.addColumn('Users', 'otp', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Users', 'otpExpires', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('Users', 'otpAttempts', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('Users', 'otpLockUntil', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('Users', 'totpSecret', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Users', 'backupCodes', {
      type: Sequelize.JSON,
      allowNull: true,
    });
    await queryInterface.addColumn('Users', 'avatar', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Removing the added columns in reverse order
    await queryInterface.removeColumn('Users', 'avatar');
    await queryInterface.removeColumn('Users', 'backupCodes');
    await queryInterface.removeColumn('Users', 'totpSecret');
    await queryInterface.removeColumn('Users', 'otpLockUntil');
    await queryInterface.removeColumn('Users', 'otpAttempts');
    await queryInterface.removeColumn('Users', 'otpExpires');
    await queryInterface.removeColumn('Users', 'otp');
  },
};