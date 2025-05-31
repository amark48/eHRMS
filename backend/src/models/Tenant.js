// models/tenant.js
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
        unique: false,
        allowNull: false,
      },
      industry: {
        type: DataTypes.STRING,
      },
      subscriptionTier: {
        type: DataTypes.STRING,
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
      domain: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "Tenant's domain (e.g., example.com)",
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
      // Updated MFA fields:
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
    },
    {
      tableName: 'Tenants',
      timestamps: true, // createdAt and updatedAt are added automatically
    }
  );

  Tenant.associate = function (models) {
    // Define associations here, if any.
  };

  return Tenant;
};