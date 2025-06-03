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
    },
    {
      tableName: 'Tenants',
      timestamps: true,
    }
  );

  Tenant.associate = function (models) {
    // Associate Tenant with Subscription (if applicable)
    Tenant.belongsTo(models.Subscription, {
      foreignKey: 'subscriptionId',
      as: 'subscription',
    });
    // Association with User will be set up later in models/index.js
  };

  return Tenant;
};