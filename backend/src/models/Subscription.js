// backend/src/models/Subscription.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Subscription =sequelize.define(
  "Subscription",
  {
    // Primary Key: Unique identifier for the subscription plan.
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Name of the subscription plan (e.g., Free, Pro, Enterprise)
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // Price (cost per billing period)
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    // Duration of the billing period, e.g., "monthly" or "yearly"
    duration: {
      type: DataTypes.ENUM("monthly", "yearly"),
      allowNull: false,
    },
    // JSON object detailing plan features or limits (e.g., number of seats, storage limits)
    features: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    // Trial period (in days) available for this plan (optional)
    trialPeriodDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "trial_period_days", // maps trialPeriodDays to the snake_case column
    },
    // Status of the subscription plan – if the plan is active, deprecated or suspended.
    status: {
      type: DataTypes.ENUM("active", "deprecated", "suspended"),
      allowNull: false,
      defaultValue: "active",
    },
    // Indicates if the plan is set to auto-renew
    autoRenew: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "auto_renew",
    },
    // The next scheduled renewal date (optional)
    renewalDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "renewal_date",
    },
  },
  {
    // Enable automatic timestamps (createdAt & updatedAt)
    timestamps: true,
  }
);

module.exports = Subscription;
