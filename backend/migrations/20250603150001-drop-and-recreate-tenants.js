'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // WARNING: Dropping the Tenants table with CASCADE will remove dependent objects
    // such as constraints or even tables that reference Tenants.
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "Tenants" CASCADE;');

    await queryInterface.createTable("Tenants", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
        allowNull: false,
      },
      // Company name stored in "name".
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      domain: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: "Tenant's domain (e.g., example.com)",
      },
      adminEmail: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: "Primary admin's corporate email used as the username",
      },
      subscriptionId: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: "Foreign key referencing Subscription plan",
      },
      industry: {
        type: Sequelize.STRING,
      },
      companyWebsite: {
        type: Sequelize.STRING,
      },
      billingStreet: {
        type: Sequelize.STRING,
      },
      billingCity: {
        type: Sequelize.STRING,
      },
      billingState: {
        type: Sequelize.STRING,
      },
      billingZip: {
        type: Sequelize.STRING,
      },
      billingCountry: {
        type: Sequelize.STRING,
      },
      billingPhone: {
        type: Sequelize.STRING,
      },
      mfaEnabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: "Flag indicating if MFA is enabled for the tenant",
      },
      allowedMfa: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
        comment: "Array of allowed MFA methods for the tenant",
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      logoUrl: {
        type: Sequelize.STRING,
      },
      themeColor: {
        type: Sequelize.STRING,
      },
      // New field storing the employee count range.
      employeeCount: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: "Employee count range for the tenant (e.g., '1 - 10 employees', '11 - 50 employees', etc.)",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop the Tenants table with cascade.
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "Tenants" CASCADE;');
  }
};
