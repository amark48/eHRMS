// models/User.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const User = sequelize.define(
  "User",
  {
    id: { 
      type: DataTypes.UUID, 
      defaultValue: DataTypes.UUIDV4, 
      primaryKey: true 
    },
    firstName: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    lastName: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    email: { 
      type: DataTypes.STRING, 
      unique: true, 
      allowNull: false 
    },
    password: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    roleId: { 
      type: DataTypes.UUID, 
      allowNull: false, 
      references: { model: "Roles", key: "id" } 
    },
    tenantId: { 
      type: DataTypes.UUID, 
      allowNull: false, 
      references: { model: "Tenants", key: "id" } 
    },
    mfaEnabled: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: false, 
      allowNull: false 
    },
    mfaType: { 
      type: DataTypes.ENUM("TOTP", "EMAIL", "SMS"), 
      allowNull: true,
      validate: { isIn: [["TOTP", "EMAIL", "SMS"]] }
    },
    // ---------- New Fields for OTP/Recovery ----------
    otp: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    otpExpires: { 
      type: DataTypes.DATE, 
      allowNull: true 
    },
    otpAttempts: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      defaultValue: 0 
    },
    otpLockUntil: { 
      type: DataTypes.DATE, 
      allowNull: true 
    },
    totpSecret: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    backupCodes: { 
      type: DataTypes.JSON, // Array of objects, e.g., { code: 'hashedCode', expiresAt: '2025-01-01' }
      allowNull: true 
    },
    avatar: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
      // ↓ NEW STATUS FIELD ↓
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    // ---------- Timestamps ----------
    createdAt: { 
      type: DataTypes.DATE, 
      allowNull: false, 
      defaultValue: DataTypes.NOW 
    },
    updatedAt: { 
      type: DataTypes.DATE, 
      allowNull: false, 
      defaultValue: DataTypes.NOW 
    },
  },
  {
    getterMethods: {
      fullName() {
        return `${this.firstName} ${this.lastName}`;
      }
    }
  }
);

// Define associations for eager loading of Tenant and Role
User.associate = (models) => {
  // A User belongs to a Tenant (alias "tenant") via tenantId
  User.belongsTo(models.Tenant, { 
    as: "tenant", 
    foreignKey: "tenantId" 
  });
  // A User belongs to a Role (alias "role") via roleId
  User.belongsTo(models.Role, { 
    as: "role", 
    foreignKey: "roleId" 
  });
};

module.exports = User;