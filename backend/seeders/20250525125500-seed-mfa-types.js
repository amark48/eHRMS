"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("MfaTypes", [
      {
        id: uuidv4(),
        name: "TOTP",
        description: "Time-based OTP (e.g., Google Authenticator)",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: "EMAIL",
        description: "One-Time Password sent via Email",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: "SMS",
        description: "One-Time Password sent via SMS",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("MfaTypes", null, {});
  }
};