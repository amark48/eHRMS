// src/controllers/userController.js

const asyncHandler = require("express-async-handler");
const { Model } = require("sequelize");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
// Pull all models from your central index
const { User, Tenant, Role } = require("../models");
const { debugLog } = require("../utils/logger"); // Ensure logger.js exists at /src/utils/logger.js

// GET /api/roles - Fetch all roles for the authenticated tenant
const getRoles = asyncHandler(async (req, res) => {
  try {
    // Extract tenant identifier from the token
    const tokenTenant = req.user.companyID || req.user.companyId || req.user.tenantId;
    if (!tokenTenant) {
      res.status(400);
      throw new Error("Tenant identification is missing in token");
    }

    // Retrieve roles that belong to this tenant.
    const roles = await Role.findAll({ where: { tenantId: tokenTenant } });
    debugLog("[DEBUG] Retrieved roles:", roles.map((role) => role.toJSON()));
    res.json(roles);
  } catch (error) {
    debugLog("[ERROR] Failed to fetch roles:", error);
    res.status(500).json({ message: "Error fetching roles", error: error.message });
  }
});

// GET /api/users/profile - Fetch the profile of the authenticated user
const getUserProfile = asyncHandler(async (req, res) => {
  debugLog("getUserProfile - req.user:", req.user);
  const tokenTenant = req.user.companyID || req.user.companyId || req.user.tenantId;
  if (!tokenTenant) {
    res.status(400);
    throw new Error("Tenant identification is missing in token");
  }
  const user = await User.findOne({
    where: { 
      id: req.user.id, 
      tenantId: tokenTenant
    },
    attributes: { exclude: ["password"] }
  });
  if (!user) {
    res.status(404);
    throw new Error("User not found or tenant mismatch");
  }
  res.json(user);
});

// GET /api/users - Fetch all users.
// For SuperAdmin, this returns all users (with Tenant and Role associations) across tenants.
// For non-SuperAdmin, it returns users filtered by tenant.
const getUsers = asyncHandler(async (req, res) => {
  console.log("🔍 [DEBUG] ======== ENTER getUsers ========");
  
  // Quick sanity-check now that we import from index:
  console.log("🔍 [DEBUG] Tenant instanceof Model:", Tenant.prototype instanceof require("sequelize").Model);
  console.log("🔍 [DEBUG] Tenant.getTableName():", Tenant.getTableName());
  
  // … rest of your existing getUsers code, unchanged …
  
  try {
    const isSuperAdmin = req.user?.role?.name === "SuperAdmin";
    let users;
    const baseOptions = {
      attributes: { exclude: ["password"] },
      include: [
        { model: Tenant, as: "tenant", attributes: ["id", "name"], required: false },
        { model: Role,   as: "role",   attributes: ["id", "name"], required: false },
      ],
      logging: console.log.bind(console, "🔍 [SQL]"),
    };

    if (isSuperAdmin) {
      console.log("[DEBUG] SuperAdmin – no tenant filter");
      users = await User.findAll(baseOptions);
    } else {
      const tokenTenant = req.user?.tenantId || req.user?.companyId;
      if (!tokenTenant) throw new Error("Tenant identification missing");
      console.log("[DEBUG] Non-SuperAdmin – filtering by tenant:", tokenTenant);
      users = await User.findAll({
        ...baseOptions,
        where: { tenantId: tokenTenant },
      });
    }

    console.log("[DEBUG] Successfully fetched users:", users.length);
    return res.json(users);
  } catch (error) {
    console.error("[ERROR] getUsers failed:", error);
    return res.status(500).json({
      message: "Error fetching users",
      error: error.message,
    });
  }
});

// PUT /api/users/profile - Update user profile including optional avatar upload and password update
const updateUserProfile = asyncHandler(async (req, res) => {
  const tokenTenant = req.user.companyID || req.user.companyId || req.user.tenantId;
  if (!tokenTenant) {
    res.status(400);
    throw new Error("Tenant identification is missing in token");
  }

  // VERBOSE DEBUG: Log incoming body and file info.
  debugLog("[VERBOSE DEBUG] Incoming req.body keys:", Object.keys(req.body));
  debugLog("[VERBOSE DEBUG] Full req.body:", req.body);
  if (req.file) {
    debugLog("[VERBOSE DEBUG] req.file:", req.file);
  }

  // Fetch the user instance with tenant isolation.
  const user = await User.findOne({
    where: { 
      id: req.user.id, 
      tenantId: tokenTenant
    }
  });
  if (!user) {
    res.status(404);
    throw new Error("User not found or tenant mismatch");
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
        const oldFilePath = path.join(__dirname, "../../uploads", tokenTenant, "profile", oldFileName);
        debugLog("[VERBOSE DEBUG] Resolved old avatar file path:", oldFilePath);
        await fs.promises.access(oldFilePath);
        await fs.promises.unlink(oldFilePath);
        debugLog("[VERBOSE DEBUG] Successfully removed old avatar file:", oldFilePath);
      } catch (err) {
        if (err.code === "ENOENT") {
          debugLog("[VERBOSE DEBUG] Old avatar file not found (may have been already removed).");
        } else {
          console.error("[VERBOSE DEBUG] Error while removing old avatar file:", err);
        }
      }
    }
    // Set the new avatar URL.
    const avatarUrl = `${req.protocol}://${req.get("host")}/uploads/${tokenTenant}/profile/${req.file.filename}`;
    user.avatar = avatarUrl;
    debugLog("[VERBOSE DEBUG] Updated avatar URL to:", avatarUrl);
  }

  // ------ PASSWORD UPDATE BLOCK ------
  if (req.body.newPassword) {
    debugLog("[VERBOSE DEBUG] newPassword field detected in req.body.");
    debugLog("[VERBOSE DEBUG] newPassword (plain text):", req.body.newPassword);
    debugLog("[VERBOSE DEBUG] confirmPassword (plain text):", req.body.confirmPassword);
    if (req.body.newPassword !== req.body.confirmPassword) {
      debugLog("[VERBOSE DEBUG] newPassword does not match confirmPassword.");
      res.status(400);
      throw new Error("New password and confirm password do not match");
    }
    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(req.body.newPassword, saltRounds);
      debugLog("[VERBOSE DEBUG] Hashed newPassword:", hashedPassword);
      debugLog("[VERBOSE DEBUG] Old password hash:", user.password);
      user.password = hashedPassword;
      debugLog("[VERBOSE DEBUG] Updated user.password to new hashed value.");
    } catch (hashError) {
      console.error("[VERBOSE DEBUG] Error while hashing password:", hashError);
      res.status(500);
      throw new Error("Password hashing failed");
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
    debugLog("[VERBOSE DEBUG] Updated password hash in DB (if updated):", user.password);

    // Re-query to confirm persistence (excluding the password field)
    const updatedUser = await User.findOne({
      where: { 
        id: req.user.id, 
        tenantId: tokenTenant
      },
      attributes: { exclude: ["password"] }
    });
    debugLog("[VERBOSE DEBUG] Final updated user record from DB:", updatedUser.toJSON());
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
      debugLog("[VERBOSE DEBUG] Attempting static update with data:", updateData);
      const [rowsUpdated] = await User.update(updateData, {
        where: {
          id: req.user.id,
          tenantId: tokenTenant,
        },
        logging: console.log
      });
      debugLog("[VERBOSE DEBUG] Static update result, rows updated:", rowsUpdated);
      const updatedUserFallback = await User.findOne({
        where: {
          id: req.user.id,
          tenantId: tokenTenant,
        },
        attributes: { exclude: ["password"] },
      });
      debugLog("[VERBOSE DEBUG] Updated user record after static update:", updatedUserFallback.toJSON());
      return res.json(updatedUserFallback);
    } catch (updateError) {
      console.error("[VERBOSE DEBUG] Static update failed with error:", updateError);
      res.status(500);
      throw new Error("Failed to update user profile");
    }
  }
});

// POST /api/users - Create a new user
const createUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, tenantId, roleId, password, mfaEnabled, mfaType } = req.body;
  
  // Validate required fields.
  if (!tenantId || !roleId || !firstName || !lastName || !email || !password) {
    res.status(400);
    throw new Error("Missing required fields");
  }
  
  // Get tenant identifier from the token.
  const tokenTenant = req.user.companyID || req.user.companyId || req.user.tenantId;
  if (!tokenTenant) {
    res.status(400);
    throw new Error("Tenant identification is missing in token");
  }
  
  // Enforce SaaS isolation: The tenantId in the request must match the token's tenant.
  if (tenantId !== tokenTenant) {
    res.status(400);
    throw new Error("Tenant mismatch: You can only create users within your own tenant");
  }
  
  // Validate the tenant and ensure it is active.
  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant || !tenant.isActive) {
    res.status(400);
    throw new Error("Invalid or inactive tenant");
  }
  
  // Validate that the role exists.
  const role = await Role.findByPk(roleId);
  if (!role) {
    res.status(400);
    throw new Error("Invalid role selection");
  }
  
  // Ensure no user already exists with the same email in this tenant.
  const existingUser = await User.findOne({ where: { email, tenantId } });
  if (existingUser) {
    res.status(400);
    throw new Error("User with this email already exists in the tenant");
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    firstName,
    lastName,
    email,
    tenantId, // validated to match tokenTenant
    roleId,
    password: hashedPassword,
    mfaEnabled,
    mfaType: mfaEnabled ? mfaType : null,
  });
  debugLog("[DEBUG] New user created:", newUser.toJSON());
  res.status(201).json({
    message: "User created successfully",
    user: { ...newUser.toJSON(), password: undefined },
  });
});

// PUT /api/users/:id/status — Toggle isActive (Admins only, with tenant isolation)
const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tokenTenant = req.user.tenantId || req.user.companyId || req.user.companyID;
  const isSuperAdmin = req.user?.role?.name === "SuperAdmin";

  console.log("[DEBUG] Entering updateUserStatus...");
  console.log("[DEBUG] Authenticated user tenant:", tokenTenant);
  console.log("[DEBUG] Is SuperAdmin:", isSuperAdmin);

  // 1) Load target user
const user = await User.findByPk(id, {
  attributes: ["id", "tenantId", "firstName", "lastName", "email", "avatar", "isActive"],
  include: [
    { model: Role, as: "role", attributes: ["id", "name"] },
    { model: Tenant, as: "tenant", attributes: ["id", "name"] }, // ✅ Ensure tenant is fetched
  ],
});

  if (!user) {
    console.error("[ERROR] User not found.");
    return res.status(404).json({ message: "User not found" });
  }

  console.log("[DEBUG] Target user tenant:", user.tenantId);
  console.log("[DEBUG] Target user role:", user.role?.name);

  // 2) Prevent toggling SuperAdmin
  if (user.role?.name === "SuperAdmin") {
    console.error("[ERROR] Cannot disable SuperAdmin.");
    return res.status(403).json({ message: "Cannot change status of a SuperAdmin" });
  }

  // 3) Enforce SaaS Tenant Isolation — Only allow actions within own tenant
  if (!isSuperAdmin && user.tenantId !== tokenTenant) {
    console.error("[ERROR] Tenant isolation violation.");
    return res.status(403).json({ message: "You can only update users within your own tenant" });
  }

  // 4) Flip status and save
  const newStatus = typeof req.body.isActive === "boolean" ? req.body.isActive : !user.isActive;
  user.isActive = newStatus;
  await user.save();

  console.log("[DEBUG] Updated user status:", newStatus);

  return res.json({
    message: `User ${newStatus ? "enabled" : "disabled"} successfully`,
    user: { id: user.id, isActive: user.isActive },
  });
});

// PUT /api/users/:id — tenant-isolated + avatar upload
const updateUser = asyncHandler(async (req, res) => {
  const fs = require("fs");
  const path = require("path");

  const { id } = req.params;
  const { firstName, lastName, roleId, mfaEnabled, mfaType, isActive } = req.body;
  const tokenTenant = req.user.tenantId;
  const isSuperAdmin = req.user.role?.name === "SuperAdmin";

  // ✅ Fetch user and ensure avatar is loaded
  const user = await User.findByPk(id, {
    attributes: ["id", "tenantId", "firstName", "lastName", "avatar", "isActive"],
    include: [{ model: Role, as: "role", attributes: ["name"] }],
  });

  if (!user) return res.status(404).json({ message: "User not found" });

  if (!isSuperAdmin && user.tenantId !== tokenTenant) {
    return res.status(403).json({ message: "You can only modify users within your own tenant" });
  }

  if (user.role.name === "SuperAdmin" && isActive === false) {
    return res.status(403).json({ message: "Cannot disable a SuperAdmin" });
  }

  // ✅ Correct the file path resolution
  if (user.avatar) {
    const oldAvatarPath = path.join(process.cwd(), "uploads", user.avatar.replace("/uploads/", ""));
    console.log("[DEBUG] Attempting to delete old avatar:", oldAvatarPath);

    if (fs.existsSync(oldAvatarPath)) {
      try {
        fs.unlinkSync(oldAvatarPath);
        console.log("[DEBUG] Previous profile picture deleted:", oldAvatarPath);
      } catch (err) {
        console.error("[ERROR] Failed to delete previous profile picture:", err);
      }
    } else {
      console.warn("[WARN] Previous profile picture not found:", oldAvatarPath);
    }
  }

  // ✅ Save the new profile picture (if uploaded)
  if (req.file) {
    user.avatar = `/uploads/${tokenTenant}/profile/${req.file.filename}`;
  }

  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (roleId) user.roleId = roleId;
  user.mfaEnabled = mfaEnabled;
  user.mfaType = mfaEnabled ? mfaType : null;
  user.isActive = typeof isActive === "boolean" ? isActive : user.isActive;

  await user.save();

  return res.json({
    message: "User updated successfully",
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      tenant: user.tenant ? { id: user.tenant.id, name: user.tenant.name } : null, // ✅ Fix tenant mapping
      role: user.role ? { id: user.role.id, name: user.role.name } : null,
      avatar: user.avatar,
      isActive: user.isActive,
    },
  });
});


module.exports = { getRoles, getUserProfile, getUsers, updateUserProfile, createUser, updateUserStatus, updateUser };