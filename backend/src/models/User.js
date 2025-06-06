// models/User.js
const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isEmail: true },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      roleId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "Roles", key: "id" },
      },
      tenantId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "Tenants", key: "id" },
      },
      isTenantAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: "Indicates if this user is the tenant admin",
      },
      mfaEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      mfaType: {
        type: DataTypes.ARRAY(DataTypes.ENUM("TOTP", "EMAIL", "SMS")),
        allowNull: true,
      },
      otp: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      otpExpires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      otpAttempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      otpLockUntil: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      totpSecret: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      backupCodes: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      onboardingCompleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isCorporateEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Flag indicating if the corporate email has been verified.",
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
    },
    {
      getterMethods: {
        fullName() {
          return `${this.firstName} ${this.lastName}`;
        },
      },
    }
  );

  // Auto-hash the password before creating
  User.beforeCreate(async (user) => {
    user.password = await bcrypt.hash(user.password, 10);
  });

  User.associate = (models) => {
    User.belongsTo(models.Tenant, { foreignKey: "tenantId", as: "tenant" });
    User.belongsTo(models.Role, { foreignKey: "roleId", as: "role" });
  };

  return User;
};