// src/controllers/userController.js

const asyncHandler = require("express-async-handler");
const { Model } = require("sequelize");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

// Pull all models from your central index.
const { User, Tenant, Role, Address } = require("../models");

// Optionally import sequelize and QueryTypes if needed.
const { sequelize } = require("../config/db");
const { QueryTypes } = require("sequelize");

// Custom logger utility
const { debugLog } = require("../utils/logger");

// Helper function to extract the tenant identifier from the token.
const getTokenTenant = (user) =>
  user.companyID || user.companyId || user.tenantId;

// -----------------------------------------------------------------------------
// GET /api/roles - Fetch all roles for the authenticated tenant.
const getRoles = asyncHandler(async (req, res) => {
  const tokenTenant = getTokenTenant(req.user);
  if (!tokenTenant) {
    return res
      .status(400)
      .json({ message: "Tenant identification is missing in token" });
  }
  try {
    // Retrieve roles that belong to this tenant.
    const roles = await Role.findAll({ where: { tenantId: tokenTenant } });
    debugLog("[DEBUG] Retrieved roles:", roles.map((r) => r.toJSON()));
    return res.json(roles);
  } catch (error) {
    debugLog("[ERROR] Failed to fetch roles:", error);
    return res
      .status(500)
      .json({ message: "Error fetching roles", error: error.message });
  }
});

// -----------------------------------------------------------------------------
// GET /api/users/profile - Fetch the profile of the authenticated user.
const getUserProfile = asyncHandler(async (req, res) => {
  debugLog("getUserProfile - req.user:", req.user);
  const tokenTenant = getTokenTenant(req.user);
  if (!tokenTenant) {
    return res
      .status(400)
      .json({ message: "Tenant identification is missing in token" });
  }
  const user = await User.findOne({
    where: { id: req.user.id, tenantId: tokenTenant },
    attributes: { exclude: ["password"] },
  });
  if (!user) {
    return res
      .status(404)
      .json({ message: "User not found or tenant mismatch" });
  }
  return res.json(user);
});

// -----------------------------------------------------------------------------
// GET /api/users - Fetch all users.
// For SuperAdmin: returns all users (with Tenant and Role associations) across tenants.
// For non-SuperAdmin: returns users filtered by tenant.
const getUsers = asyncHandler(async (req, res) => {
  console.log("🔍 [DEBUG] ======== ENTER getUsers ========");
  console.log(
    "🔍 [DEBUG] Tenant instanceof Model:",
    Tenant.prototype instanceof require("sequelize").Model
  );
  console.log("🔍 [DEBUG] Tenant.getTableName():", Tenant.getTableName());
  console.log("🔍 [DEBUG] req.user:", req.user);

  try {
    let roleFromToken = req.user.role;
    if (!roleFromToken || !roleFromToken.name) {
      console.log(
        "[DEBUG] Role object missing from token. Fetching role from DB for roleId:",
        req.user.roleId
      );
      roleFromToken = await Role.findByPk(req.user.roleId);
      console.log("[DEBUG] Fetched role:", roleFromToken);
    }
    const isSuperAdmin = roleFromToken && roleFromToken.name === "SuperAdmin";
    console.log("[DEBUG] isSuperAdmin:", isSuperAdmin);

    let users;
    // Base query options: exclude password, eager load Tenant and Role, disable paranoid filtering.
    const baseOptions = {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Tenant,
          as: "tenant",
          attributes: ["id", "name"],
          required: false,
        },
        {
          model: Role,
          as: "role",
          attributes: ["id", "name"],
          required: false,
        },
      ],
      logging: console.log.bind(console, "🔍 [SQL]"),
      paranoid: false,
    };

    if (isSuperAdmin) {
      console.log(
        "[DEBUG] SuperAdmin branch – retrieving ALL users (clearing any default scopes)."
      );
      // Retrieve all users without any tenant filtering.
      users = await User.unscoped().findAll({ where: {}, ...baseOptions });
    } else {
      const tokenTenant = getTokenTenant(req.user) || req.user.companyId;
      if (!tokenTenant) {
        console.error("[ERROR] No tenant identification found in token.");
        return res
          .status(400)
          .json({ message: "Tenant identification missing" });
      }
      console.log(
        "[DEBUG] Non-SuperAdmin branch – filtering users by tenant:",
        tokenTenant
      );
      users = await User.findAll({
        ...baseOptions,
        where: { tenantId: tokenTenant },
      });
    }
    console.log("[DEBUG] Successfully fetched users:", users.length);
    console.log(
      "[DEBUG] User IDs fetched:",
      users.map((u) => u.id).join(", ")
    );
    return res.json(users);
  } catch (error) {
    console.error("[ERROR] getUsers failed:", error);
    return res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
});

// -----------------------------------------------------------------------------
// PUT /api/users/profile - Update user profile including optional avatar upload and password update.
const updateUserProfile = asyncHandler(async (req, res) => {
  const tokenTenant = getTokenTenant(req.user);
  if (!tokenTenant) {
    return res
      .status(400)
      .json({ message: "Tenant identification is missing in token" });
  }

  debugLog("[VERBOSE DEBUG] Incoming req.body keys:", Object.keys(req.body));
  debugLog("[VERBOSE DEBUG] Full req.body:", req.body);
  if (req.file) {
    debugLog("[VERBOSE DEBUG] req.file:", req.file);
  }

  // Fetch the user instance with tenant isolation.
  const user = await User.findOne({
    where: { id: req.user.id, tenantId: tokenTenant },
  });
  if (!user) {
    return res
      .status(404)
      .json({ message: "User not found or tenant mismatch" });
  }
  debugLog("[VERBOSE DEBUG] Existing user record:", user.toJSON());

  // Update standard fields if provided.
  const newFirstName = req.body.firstName;
  const newLastName = req.body.lastName;
  if (newFirstName && newFirstName !== user.firstName) {
    user.firstName = newFirstName;
    debugLog("[VERBOSE DEBUG] Updated firstName:", newFirstName);
  }
  if (newLastName && newLastName !== user.lastName) {
    user.lastName = newLastName;
    debugLog("[VERBOSE DEBUG] Updated lastName:", newLastName);
  }

  // Handle avatar upload: remove previous file if exists.
  if (req.file) {
    if (user.avatar) {
      debugLog("[VERBOSE DEBUG] Existing avatar detected:", user.avatar);
      try {
        const parsedUrl = new URL(user.avatar);
        const oldFileName = path.basename(parsedUrl.pathname);
        const oldFilePath = path.join(
          __dirname,
          "../../uploads",
          tokenTenant,
          "profile",
          oldFileName
        );
        debugLog("[VERBOSE DEBUG] Resolved old avatar file path:", oldFilePath);
        await fs.promises.access(oldFilePath);
        await fs.promises.unlink(oldFilePath);
        debugLog(
          "[VERBOSE DEBUG] Successfully removed old avatar file:",
          oldFilePath
        );
      } catch (err) {
        if (err.code === "ENOENT") {
          debugLog(
            "[VERBOSE DEBUG] Old avatar file not found (may have been already removed)."
          );
        } else {
          console.error(
            "[VERBOSE DEBUG] Error while removing old avatar file:",
            err
          );
        }
      }
    }
    // Set the new avatar URL.
    const avatarUrl = `${req.protocol}://${req.get(
      "host"
    )}/uploads/${tokenTenant}/profile/${req.file.filename}`;
    user.avatar = avatarUrl;
    debugLog("[VERBOSE DEBUG] Updated avatar URL to:", avatarUrl);
  }

  // ------ PASSWORD UPDATE BLOCK ------
  if (req.body.newPassword) {
    debugLog("[VERBOSE DEBUG] newPassword field detected in req.body.");
    if (req.body.newPassword !== req.body.confirmPassword) {
      debugLog("[VERBOSE DEBUG] newPassword does not match confirmPassword.");
      return res
        .status(400)
        .json({ message: "New password and confirm password do not match" });
    }
    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(req.body.newPassword, saltRounds);
      debugLog("[VERBOSE DEBUG] Hashed newPassword:", hashedPassword);
      user.password = hashedPassword;
      debugLog(
        "[VERBOSE DEBUG] Updated user.password to new hashed value."
      );
    } catch (hashError) {
      console.error("[VERBOSE DEBUG] Error while hashing password:", hashError);
      return res.status(500).json({ message: "Password hashing failed" });
    }
  } else {
    debugLog("[VERBOSE DEBUG] newPassword field not provided in req.body.");
  }
  // ------ END PASSWORD UPDATE BLOCK ------

  debugLog("[VERBOSE DEBUG] Changed fields before save:", user.changed());
  try {
    debugLog("[VERBOSE DEBUG] Attempting to save user with updated fields...");
    await user.save({ logging: console.log });
    debugLog("[VERBOSE DEBUG] Save completed. Reloading user from DB...");
    await user.reload({ logging: console.log });
    debugLog("[VERBOSE DEBUG] Reloaded user record:", user.toJSON());
    // Re-query to confirm persistence (excluding the password field)
    const updatedUser = await User.findOne({
      where: { id: req.user.id, tenantId: tokenTenant },
      attributes: { exclude: ["password"] },
    });
    debugLog(
      "[VERBOSE DEBUG] Final updated user record from DB:",
      updatedUser.toJSON()
    );
    return res.json(updatedUser);
  } catch (err) {
    console.error("[VERBOSE DEBUG] Error during instance.save():", err);
    // Fallback: try a static update.
    try {
      const updateData = {
        firstName: newFirstName || user.firstName,
        lastName: newLastName || user.lastName,
        avatar: req.file
          ? `${req.protocol}://${req.get("host")}/uploads/${tokenTenant}/profile/${req.file.filename}`
          : user.avatar,
      };
      if (req.body.newPassword) {
        updateData.password = user.password; // already hashed above
      }
      debugLog(
        "[VERBOSE DEBUG] Attempting static update with data:",
        updateData
      );
      const [rowsUpdated] = await User.update(updateData, {
        where: { id: req.user.id, tenantId: tokenTenant },
        logging: console.log,
      });
      debugLog("[VERBOSE DEBUG] Static update result, rows updated:", rowsUpdated);
      const updatedUserFallback = await User.findOne({
        where: { id: req.user.id, tenantId: tokenTenant },
        attributes: { exclude: ["password"] },
      });
      debugLog(
        "[VERBOSE DEBUG] Updated user record after static update:",
        updatedUserFallback.toJSON()
      );
      return res.json(updatedUserFallback);
    } catch (updateError) {
      console.error(
        "[VERBOSE DEBUG] Static update failed with error:",
        updateError
      );
      return res
        .status(500)
        .json({ message: "Failed to update user profile" });
    }
  }
});

// -----------------------------------------------------------------------------
// POST /api/users - Create a new user.
const createUser = asyncHandler(async (req, res) => {
  console.log("[DEBUG] Received req.body in createUser:", req.body);
  console.log("[DEBUG] req.user in createUser:", req.user);
  console.log("[DEBUG] req.user.dataValues:", req.user.dataValues);
  console.log("[DEBUG] req.file:", req.file);

  const { firstName, lastName, email, tenantId, roleId, password, mfaEnabled } =
    req.body;
  let mfaTypeInput = req.body.mfaType;

  // Validate required fields.
  if (!tenantId || !roleId || !firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const tokenTenant = getTokenTenant(req.user);
  if (!tokenTenant) {
    return res
      .status(400)
      .json({ message: "Tenant identification is missing in token" });
  }
  // Explicitly fetch the creating user's role from the DB.
  const creatingUserRole = await Role.findByPk(req.user.roleId);
  console.log(
    "[DEBUG] Creating user's role (fetched from DB):",
    creatingUserRole
  );
  const roleName = creatingUserRole ? creatingUserRole.name : undefined;
  console.log("[DEBUG] Role name from token (via DB):", roleName);

  // Enforce SaaS isolation only for non-SuperAdmin users.
  if (roleName !== "SuperAdmin" && tenantId !== tokenTenant) {
    return res.status(400).json({
      message:
        "Tenant mismatch: You can only create users within your own tenant",
    });
  }

  // Validate the tenant and ensure it is active.
  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant || !tenant.isActive) {
    return res.status(400).json({ message: "Invalid or inactive tenant" });
  }
  // Validate that the role exists.
  const role = await Role.findByPk(roleId);
  if (!role) {
    return res.status(400).json({ message: "Invalid role selection" });
  }
  // Ensure no user already exists with the same email in this tenant.
  const existingUser = await User.findOne({ where: { email, tenantId } });
  if (existingUser) {
    return res
      .status(400)
      .json({ message: "User with this email already exists in the tenant" });
  }
  // Process MFA type.
  let processedMfaType = null;
  if (mfaEnabled && mfaTypeInput) {
    try {
      const parsed =
        typeof mfaTypeInput === "string"
          ? JSON.parse(mfaTypeInput)
          : mfaTypeInput;
      processedMfaType = Array.isArray(parsed) ? parsed : [parsed];
    } catch (err) {
      console.error("[DEBUG] Error parsing mfaType:", err);
      processedMfaType = Array.isArray(mfaTypeInput)
        ? mfaTypeInput
        : [mfaTypeInput];
    }
  }
  console.log("[DEBUG] Processed MFA type to be saved:", processedMfaType);

  // Process the avatar.
  let avatarPath = null;
  if (req.body.avatar) {
    avatarPath = req.body.avatar;
    console.log("[DEBUG] Avatar URL from req.body:", avatarPath);
  } else if (req.file) {
    avatarPath = req.file.path;
    if (!avatarPath.startsWith("/")) {
      avatarPath = "/" + avatarPath;
    }
    console.log("[DEBUG] Avatar file path from multer:", avatarPath);
  } else {
    console.log("[DEBUG] No avatar provided.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    firstName,
    lastName,
    email,
    tenantId,
    roleId,
    password: hashedPassword,
    mfaEnabled,
    mfaType: processedMfaType,
    avatar: avatarPath,
  });
  // Re-fetch the newly created user including associations.
  const createdUser = await User.findByPk(newUser.id, {
    include: [
      {
        model: Tenant,
        as: "tenant",
        attributes: ["id", "name"],
      },
      {
        model: Role,
        as: "role",
        attributes: ["id", "name"],
      },
    ],
  });
  debugLog("[DEBUG] New user created:", createdUser.toJSON());
  return res.status(201).json({
    message: "User created successfully",
    user: { ...createdUser.toJSON(), password: undefined },
  });
});

// -----------------------------------------------------------------------------
// POST /api/register - Register a new tenant and create the first admin user.
const register = asyncHandler(async (req, res) => {
  console.log("[DEBUG] Received req.body in register:", req.body);

  // Destructure required fields from the request body.
  // Note: The field "company" corresponds to Tenant.name.
  // Also expect mailing address fields: mailingCountry and mailingPhone.
  const {
    firstName,
    lastName,
    email,
    company,
    domain,
    industry,
    employeeCount,
    isTenantAdmin,
    mailingCountry,
    mailingPhone
  } = req.body;

  // Validate that all required tenant fields are provided.
  if (!firstName || !lastName || !email || !company || !domain || !employeeCount || !mailingPhone || !isTenantAdmin) {
    return res.status(400).json({
      message:
        "Missing required fields. Please provide firstName, lastName, email, company, domain, employeeCount, and phoneNumber.",
    });
  }

  // Check if a tenant already exists with this adminEmail.
  const existingTenant = await Tenant.findOne({ where: { adminEmail: email } });
  if (existingTenant) {
    return res.status(400).json({ message: "A tenant with this corporate email already exists." });
  }

  // Check if a tenant already exists with this domain.
  const existingTenantByDomain = await Tenant.findOne({ where: { domain: domain } });
  if (existingTenantByDomain) {
    return res.status(400).json({ message: "A tenant with this domain already exists." });
  }

  // Create a new Tenant.
  // Note: We are no longer storing the billing phone on the Tenant object.
  const tenant = await Tenant.create({
    name: company,
    adminEmail: email,
    domain: domain,
    industry: industry || "other",
    employeeCount: employeeCount,
    // billingPhone is removed from here.
    isTenantAdmin: isTenantAdmin,
    isActive: true,
  });

  console.log("[DEBUG] Tenant successfully created:", tenant.toJSON());

  // Debug: log mailing address fields that were sent.
  console.log("[DEBUG] Mailing address fields received:", {
    mailingCountry,
    mailingPhone,
  });

  // If any mailing address fields are provided, log a warning if required fields are missing.
  if (mailingCountry || mailingPhone) {
    // In this example, we expect both mailingCountry and mailingPhone.
    let missingFields = [];
    if (!mailingCountry) missingFields.push("mailingCountry");
    if (!mailingPhone) missingFields.push("mailingPhone");
    if (missingFields.length > 0) {
      console.warn(`[DEBUG] Partial mailing address detected. Missing fields: ${missingFields.join(", ")}`);
    } else {
      console.log("[DEBUG] All required mailing address fields received.");
    }

    // Create an Address record for the mailing address.
    // Since the frontend sends only mailingCountry and mailingPhone,
    // we’ll store empty strings for the missing address components.
    const address = await Address.create({
      tenantId: tenant.id,
      addressType: "mailing",
      street: "",     // Frontend did not send
      city: "",       // Frontend did not send
      state: "",      // Frontend did not send
      zip: "",        // Frontend did not send
      country: mailingCountry || "",
      phone: mailingPhone || "",
    });
    console.log("[DEBUG] Mailing address successfully created:", address.toJSON());
  } else {
    console.log("[DEBUG] No mailing address provided in the request.");
  }

  // Retrieve the Admin role (a row with name "Admin" must exist).
  const adminRole = await Role.findOne({ where: { name: "Admin" } });
  if (!adminRole) {
    return res.status(500).json({ message: "Admin role not configured." });
  }
  const defaultAdminRoleId = adminRole.id;

  // Auto-generate a strong password.
  function generateStrongPassword(length = 16) {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
  const autoPassword = generateStrongPassword();

  // Hash the auto-generated password.
  const hashedPassword = await bcrypt.hash(autoPassword, 10);

  // Create the new admin user.
  const newUser = await User.create(
    {
      firstName,
      lastName,
      email,
      tenantId: tenant.id,
      roleId: defaultAdminRoleId,
      password: hashedPassword,
      isTenantAdmin: isTenantAdmin,
    },
    {
      fields: ["firstName", "lastName", "email", "password", "roleId", "tenantId", "isTenantAdmin"],
    }
  );

  // Generate a 6-digit OTP that expires in 10 minutes.
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  newUser.otp = otpCode;
  newUser.otpExpires = otpExpires;
  await newUser.save();

  console.log(`[DEBUG] Generated OTP for ${newUser.email}: ${otpCode}`);

  return res.status(201).json({
    message: "Registration successful. Please verify the OTP sent to your corporate email.",
    tenant: {
      id: tenant.id,
      name: tenant.name,
      adminEmail: tenant.adminEmail,
      domain: tenant.domain,
    },
    user: {
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      tenantId: newUser.tenantId,
      isTenantAdmin: newUser.isTenantAdmin,
    },
  });
});

// -----------------------------------------------------------------------------
// verifyOTP - Verify the OTP sent to the user's email.
// controllers/userController.js
const verifyOTP = asyncHandler(async (req, res) => {
  console.log("Received OTP verification request. Request body:", req.body);
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    console.log("Missing userId or OTP. Received values:", { userId, otp });
    return res.status(400).json({ message: "User id and OTP are required." });
  }

  const user = await User.findByPk(userId);
  if (!user) {
    console.log(`No user found with id: ${userId}`);
    return res.status(404).json({ message: "User not found." });
  }

  console.log("User found:", user.toJSON());

  // Check if OTP matches and isn't expired
  if (user.otp !== otp) {
    console.log(`Mismatch OTP. Received: ${otp}, Stored: ${user.otp}`);
    return res.status(400).json({ message: "Invalid or expired OTP." });
  }
  if (new Date(user.otpExpires) < new Date()) {
    console.log(
      `OTP expired. Expiry: ${user.otpExpires}, Current: ${new Date()}`
    );
    return res.status(400).json({ message: "Invalid or expired OTP." });
  }

  // If OTP is valid, set the verification flag to true, then clear OTP data.
  user.isCorporateEmailVerified = true;
  user.otp = null;
  user.otpExpires = null;
  await user.save();

  console.log(`OTP verified successfully for userId: ${userId}`);
  return res.json({ message: "OTP verified successfully." });
});


// --- Helper Function: Generate a 6-digit OTP ---
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// --- New Controller Method: Resend OTP ---
const resendOTP = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400);
    throw new Error("User id is required.");
  }

  const user = await User.findByPk(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  // Generate a new OTP and set an expiration (e.g., 10 minutes from now)
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes in the future

  user.otp = otp;
  user.otpExpires = otpExpires;

  await user.save();

  console.log(`[DEBUG] Generated OTP for ${user.email}: ${otp}`);

  // Optionally: Send the OTP to the user's email here.
  res.json({ message: "OTP resent successfully." });
});

// -----------------------------------------------------------------------------
// DELETE /api/users/:id - Delete a user.
const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  console.log(`[DEBUG] Attempting to delete user with id: ${userId}`);
  // Find the user by primary key and include the role to check if the user is a SuperAdmin.
  const userToDelete = await User.findByPk(userId, {
    include: [
      {
        model: Role,
        as: "role",
        attributes: ["id", "name"],
      },
    ],
  });
  if (!userToDelete) {
    console.error(`[ERROR] User not found with id: ${userId}`);
    return res.status(404).json({ message: "User not found" });
  }
  // Prevent deletion of a SuperAdmin user.
  if (userToDelete.role && userToDelete.role.name === "SuperAdmin") {
    console.error("[ERROR] SuperAdmin user cannot be deleted");
    return res
      .status(403)
      .json({ message: "SuperAdmin user cannot be deleted" });
  }
  await userToDelete.destroy();
  console.log(`[DEBUG] User with id ${userId} deleted successfully`);
  return res.status(200).json({ message: "User deleted successfully" });
});

// -----------------------------------------------------------------------------
// PUT /api/users/:id/status - Toggle isActive (Admins only, with tenant isolation).
const updateUserStatus = asyncHandler(async (req, res) => {
  console.log("[DEBUG] Entering updateUserStatus...");
  // Re-fetch the current user from the database to get full details (including role).
  const currentUserToken = req.user;
  const currentUser = await User.findByPk(currentUserToken.id, {
    include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
  });
  if (!currentUser) {
    return res.status(404).json({ message: "Authenticated user not found" });
  }
  const { isActive } = req.body;
  const targetUserId = req.params.id;
  // Fetch target user along with its role and tenant info.
  const targetUser = await User.findByPk(targetUserId, {
    include: [
      { model: Role, as: "role", attributes: ["id", "name"] },
      { model: Tenant, as: "tenant", attributes: ["id", "name"] },
    ],
  });
  if (!targetUser) {
    return res.status(404).json({ message: "Target user not found" });
  }
  // Determine current user role and tenant.
  const currentUserRole = currentUser.role ? currentUser.role.name : null;
  const currentUserTenant =
    req.user.tenantId || req.user.companyID || req.user.companyId;
  // Determine target user tenant and role.
  const targetTenantId = targetUser.tenantId;
  const targetRoleName = targetUser.role ? targetUser.role.name : null;
  console.log("[DEBUG] Authenticated user:", currentUser.toJSON());
  console.log("[DEBUG] Current user role:", currentUserRole);
  console.log("[DEBUG] Current user tenant:", currentUserTenant);
  console.log("[DEBUG] Target user tenant:", targetTenantId);
  console.log("[DEBUG] Target user role:", targetRoleName);
  // Enforce rules.
  if (currentUserRole !== "SuperAdmin") {
    if (currentUserTenant !== targetTenantId) {
      return res.status(403).json({
        message: "You can only update users within your own tenant",
      });
    }
  } else {
    if (targetRoleName === "SuperAdmin") {
      return res.status(403).json({
        message: "SuperAdmin cannot update another SuperAdmin user",
      });
    }
  }
  // Update the target user's status.
  targetUser.isActive = isActive;
  await targetUser.save();
  console.log(
    "[DEBUG] User status updated successfully for user:",
    targetUser.id
  );
  return res
    .status(200)
    .json({ message: "User status updated successfully" });
});

// -----------------------------------------------------------------------------
// PUT /api/users/:id - Update an existing user.
const updateUser = asyncHandler(async (req, res) => {
  console.log("[DEBUG] Received req.body in updateUser:", req.body);
  console.log("[DEBUG] req.user in updateUser:", req.user);
  const { id } = req.params;
  let { firstName, lastName, email, tenantId, roleId, password, mfaEnabled, mfaType } =
    req.body;
  // Enforce tenant isolation.
  const tokenTenant = getTokenTenant(req.user);
  if (!tokenTenant) {
    return res
      .status(400)
      .json({ message: "Tenant identification is missing in token" });
  }
  // Fetch logged-in user's role from the DB.
  const updatingUserRole = await Role.findByPk(req.user.roleId);
  const roleName = updatingUserRole ? updatingUserRole.name : undefined;
  console.log(
    "[DEBUG] Logged-in user's role (fetched from DB):",
    updatingUserRole
  );
  console.log("[DEBUG] Role name from token (via DB):", roleName);

  // For non-SuperAdmin users, enforce that the tenantId is the same as the token's tenant.
  if (roleName !== "SuperAdmin") {
    if (tenantId && tenantId !== tokenTenant) {
      console.log(
        `[DEBUG] Overriding tenantId ${tenantId} with token tenant ${tokenTenant} for non-SuperAdmin update`
      );
    }
    tenantId = tokenTenant;
    req.body.tenantId = tokenTenant;
  } else {
    if (!tenantId) {
      return res
        .status(400)
        .json({ message: "Tenant must be provided when updating user as SuperAdmin" });
    }
  }
  // Validate that the target user exists.
  const user = await User.findByPk(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  // Process MFA type similarly to creation.
  let processedMfaType = null;
  if (mfaEnabled && mfaType) {
    try {
      const parsed = typeof mfaType === "string" ? JSON.parse(mfaType) : mfaType;
      processedMfaType = Array.isArray(parsed) ? parsed : [parsed];
    } catch (err) {
      console.error("[DEBUG] Error parsing mfaType in update:", err);
      processedMfaType = Array.isArray(mfaType) ? mfaType : [mfaType];
    }
    req.body.mfaType = processedMfaType;
    console.log("[DEBUG] Processed MFA type to be saved:", processedMfaType);
  }
  // Process the avatar.
  if (req.body.avatar) {
    console.log("[DEBUG] Using avatar URL from req.body:", req.body.avatar);
  } else if (req.file) {
    let avatarPath = req.file.path;
    if (!avatarPath.startsWith("/")) {
      avatarPath = "/" + avatarPath;
    }
    req.body.avatar = avatarPath;
    console.log("[DEBUG] Using avatar file path from multer:", avatarPath);
  } else {
    console.log("[DEBUG] No avatar provided in update payload.");
  }
  // If a new avatar is provided and the user already has one, delete the old file.
  const newAvatar = req.body.avatar;
  if (
    newAvatar &&
    user.avatar &&
    user.avatar !== newAvatar &&
    user.avatar.startsWith("/uploads/")
  ) {
    const oldAvatarRelative = user.avatar.startsWith("/")
      ? user.avatar.substring(1)
      : user.avatar;
    const oldAvatarFullPath = path.join(__dirname, "..", "..", oldAvatarRelative);
    fs.unlink(oldAvatarFullPath, (err) => {
      if (err) {
        console.error("[ERROR] Failed to delete old avatar file:", err);
      } else {
        console.log(
          "[DEBUG] Successfully deleted old avatar file:",
          oldAvatarFullPath
        );
      }
    });
  }
  // Process password update.
  if (password) {
    req.body.password = await bcrypt.hash(password, 10);
  } else {
    delete req.body.password;
  }
  // Update the user with provided fields.
  await user.update(req.body);
  // Re-fetch updated user including tenant & role associations.
  const updatedUser = await User.findByPk(id, {
    include: [
      { model: Tenant, as: "tenant", attributes: ["id", "name"] },
      { model: Role, as: "role", attributes: ["id", "name"] },
    ],
  });
  console.log("[DEBUG] Updated user:", updatedUser.toJSON());
  return res.status(200).json({
    message: "User updated successfully",
    user: { ...updatedUser.toJSON(), password: undefined },
  });
});

module.exports = {
  getRoles,
  getUserProfile,
  getUsers,
  updateUserProfile,
  createUser,
  register,
  verifyOTP,
  deleteUser,
  updateUserStatus,
  updateUser,
  generateOTP,
  resendOTP,
};
