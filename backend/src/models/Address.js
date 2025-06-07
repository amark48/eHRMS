// models/Address.js

module.exports = (sequelize, DataTypes) => {
  const Address = sequelize.define(
    'Address',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tenantId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Foreign key referencing the Tenant',
      },
      addressType: {
        // Use an ENUM for a limited set of allowed values
        type: DataTypes.ENUM('billing', 'mailing', 'shipping'),
        allowNull: false,
        comment: 'Type of address (billing, mailing, shipping)',
      },
      street: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      zip: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      country: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'Addresses',
      timestamps: true,
    }
  );

  Address.associate = function (models) {
    // A Tenant can have many addresses.
    Address.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' });
  };

  return Address;
};
