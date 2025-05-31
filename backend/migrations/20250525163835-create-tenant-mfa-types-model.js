"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("TenantMfaTypes", {
      tenantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "Tenants", key: "id" },
        onDelete: "CASCADE"
      },
      mfaTypeId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "MfaTypes", key: "id" },
        onDelete: "CASCADE"
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

    // Add composite primary key constraint.
    await queryInterface.addConstraint("TenantMfaTypes", {
      fields: ["tenantId", "mfaTypeId"],
      type: "primary key",
      name: "pk_tenant_mfa"
    });

    console.log("[DEBUG] TenantMfaTypes join table created");
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("TenantMfaTypes");
  }
};