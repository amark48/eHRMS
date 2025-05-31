// src/models/Subscription.js
const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db").sequelize; // ✅ Ensure we are using the correct Sequelize instance

const Subscription = sequelize.define("Subscription", {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  price: { type: DataTypes.FLOAT, allowNull: false },
  duration: { type: DataTypes.STRING, allowNull: false },
  features: { type: DataTypes.JSON, allowNull: false }, // Stores an array of features
});

module.exports = Subscription;