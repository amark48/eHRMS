const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Role = sequelize.define("Role", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, unique: true, allowNull: false },
  permissions: { type: DataTypes.JSON, allowNull: false }, // Granular access control
}, { timestamps: true });

module.exports = Role;