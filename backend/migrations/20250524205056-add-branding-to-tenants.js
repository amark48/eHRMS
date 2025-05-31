module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Tenants", "logoUrl", { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn("Tenants", "themeColor", { type: Sequelize.STRING, allowNull: true });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn("Tenants", "logoUrl");
    await queryInterface.removeColumn("Tenants", "themeColor");
  }
};