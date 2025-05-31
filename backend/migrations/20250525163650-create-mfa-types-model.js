"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("MfaTypes", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal("uuid_generate_v4()")
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: "The key name of the MFA Type (e.g. 'TOTP', 'EMAIL', 'SMS')"
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: "Optional description of the MFA type"
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW")
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW")
      }
    });
    console.log("[DEBUG] MfaTypes table created");
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("MfaTypes");
  }
};