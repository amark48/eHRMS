// backend/src/models/Tenant.js

module.exports = (sequelize, DataTypes) => {
  const Tenant = sequelize.define(
    'Tenant',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      domain: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "Tenant's domain (e.g., example.com)",
      },
      // Remove subscriptionTier field completely.
      // Instead, we use subscriptionId to reference the Subscription model.
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
      billingStreet: {
        type: DataTypes.STRING,
      },
      billingCity: {
        type: DataTypes.STRING,
      },
      billingState: {
        type: DataTypes.STRING,
      },
      billingZip: {
        type: DataTypes.STRING,
      },
      billingCountry: {
        type: DataTypes.STRING,
      },
      billingPhone: {
        type: DataTypes.STRING,
      },
      mfaEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Flag indicating if MFA is enabled for the tenant',
      },
      allowedMfa: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
        comment: 'Array of allowed MFA methods for the tenant (e.g., ["EMAIL", "SMS", "TOTP"])',
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
    },
    {
      tableName: 'Tenants',
      timestamps: true,
    }
  );

  Tenant.associate = function (models) {
    // Associate a Tenant with a Subscription plan.
    Tenant.belongsTo(models.Subscription, {
      foreignKey: 'subscriptionId',
      as: 'subscription',
    });
  };

  return Tenant;
};
