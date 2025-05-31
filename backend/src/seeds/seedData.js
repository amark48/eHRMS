// seedData.js

// Adjust the path if your .env file is in the backend folder:
require('dotenv').config({ path: __dirname + '/../../.env' });

const { sequelize } = require("../config/db");
const Role = require("../models/Role");
const Tenant = require("../models/Tenant");
const User = require("../models/User");
const bcrypt = require("bcrypt");

const seedDatabase = async () => {
  try {
    await sequelize.sync({ force: true }); // Reset DB before seeding

    console.log("🔄 Database reset... Seeding new data");

    // Define roles
    const roles = await Role.bulkCreate([
      { name: "SuperAdmin", permissions: ["manage_tenants", "configure_system", "view_reports"] },
      { name: "Admin", permissions: ["manage_company", "create_roles", "assign_privileges"] },
      { name: "Manager", permissions: ["manage_employees", "approve_leave", "handle_onboarding"] },
      { name: "Employee", permissions: ["view_record", "track_timesheet", "access_benefits"] },
    ], { returning: true });

    console.log("✅ Roles seeded successfully");

    // Define initial tenant with branding
    const tenant = await Tenant.create({
      name: "DemoCorp",
      industry: "Tech",
      subscriptionTier: "Enterprise",
      isActive: true,
      logoUrl: "https://yourcdn.com/democorp-logo.png",
      themeColor: "#0077b6",
      domain: "democorp.com"


    });

    console.log("✅ Tenant seeded successfully");

    // Find the SuperAdmin role for user assignment
    const superAdminRole = roles.find(r => r.name === "SuperAdmin");

    if (!superAdminRole) {
      throw new Error("❌ SuperAdmin role not found, seeding failed.");
    }

    // Create a default SuperAdmin user with hashed password and MFA recovery fields
    await User.create({
      firstName: "Admin",
      lastName: "User",
      email: "admin@democorp.com",
      password: await bcrypt.hash("SuperSecurePassword123!", 10),
      roleId: superAdminRole.id,
      tenantId: tenant.id,
      mfaEnabled: true,
      mfaType: "TOTP",
      totpSecret: "JBSWY3DPEHPK3PXP", // Sample TOTP secret (Base32-encoded)
      backupCodes: [
        { code: "hash1", expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        { code: "hash2", expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
      ],
      avatar: "https://yourcdn.com/admin-avatar.png",
      otp: null,
      otpExpires: null,
      otpAttempts: 0,
      otpLockUntil: null,
    });

    console.log("✅ SuperAdmin user seeded successfully");
    console.log("🎉 Database seeding completed!");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
  }
};

// Run seeding
seedDatabase();