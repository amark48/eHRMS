module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Users", {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      firstName: { type: Sequelize.STRING, allowNull: false },
      lastName: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, unique: true, allowNull: false },
      password: { type: Sequelize.STRING, allowNull: false },
      roleId: { type: Sequelize.UUID, allowNull: false, references: { model: "Roles", key: "id" } },
      tenantId: { type: Sequelize.UUID, allowNull: false, references: { model: "Tenants", key: "id" } },
      mfaEnabled: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      mfaType: { type: Sequelize.ENUM("TOTP", "EMAIL", "SMS"), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("Users");
  }
};