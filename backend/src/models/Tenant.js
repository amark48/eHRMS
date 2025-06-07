// models/Tenant.js

module.exports = (sequelize, DataTypes) => {
  const Tenant = sequelize.define(
    'Tenant',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      // Company name remains.
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      domain: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: "Tenant's domain (e.g., example.com)",
      },
      adminEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: "Primary admin's corporate email used as the username",
      },
      subscriptionId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Foreign key referencing Subscription plan",
      },
      industry: {
        type: DataTypes.STRING,
      },
      companyWebsite: {
        type: DataTypes.STRING,
      },
      // Billing address fields removed here.
      mfaEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Flag indicating if MFA is enabled for the tenant',
      },
      allowedMfa: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
        comment: 'Array of allowed MFA methods for the tenant',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      logoUrl: {
        type: DataTypes.STRING,
      },
      themeColor: {
        type: DataTypes.STRING,
      },
      employeeCount: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Employee count range (e.g., '1 - 10 employees', etc.)",
      }
    },
    {
      tableName: 'Tenants',
      timestamps: true,
    }
  );

  Tenant.associate = function (models) {
    // Associate Tenant with Subscription.
    Tenant.belongsTo(models.Subscription, {
      foreignKey: 'subscriptionId',
      as: 'subscription',
    });
    // New association: Tenant has many addresses.
    Tenant.hasMany(models.Address, {
      foreignKey: 'tenantId',
      as: 'addresses',
    });
  };

  return Tenant;
};
