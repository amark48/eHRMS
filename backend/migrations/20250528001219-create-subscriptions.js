// src/migrations/YYYYMMDDHHMMSS-create-subscriptions.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log("[DEBUG] Running migration: create-subscriptions");

    await queryInterface.createTable("Subscriptions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      price: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      duration: {
        type: Sequelize.STRING,
        allowNull: false, // Example: "Monthly" or "Annual"
      },
      features: {
        type: Sequelize.JSON,
        allowNull: false, // Stores an array of features
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    console.log("[DEBUG] Subscription table created successfully!");
  },

  down: async (queryInterface) => {
    console.log("[DEBUG] Rolling back migration: create-subscriptions");

    await queryInterface.dropTable("Subscriptions");
  },
};