// models/Billing.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Billing = sequelize.define("Billing", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "Tenants", // Make sure this matches your Tenant table name.
      key: "id",
    },
  },
  billingDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  isPaid: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
});

// Define association: Billing belongs to Tenant.
Billing.associate = (models) => {
  Billing.belongsTo(models.Tenant, { foreignKey: "tenantId", as: "tenant" });
};

module.exports = Billing;
