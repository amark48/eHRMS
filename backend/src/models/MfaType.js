// src/models/MfaType.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const MfaType = sequelize.define(
  "MfaType",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      comment: "The key name of the MFA Type (e.g. 'TOTP', 'EMAIL', 'SMS')",
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
      comment:
        "Optional description of how this MFA type works or any additional info",
    },
  },
  {
    tableName: "MfaTypes",
    timestamps: true,
  }
);

module.exports = MfaType;