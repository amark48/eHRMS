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
// Make sure to import your sequelize instance and QueryTypes:
const { sequelize } = require("../config/db");
const { QueryTypes } = require("sequelize");

const getUsers = asyncHandler(async (req, res) => {
  console.log("🔍 [DEBUG] ======== ENTER getUsers ========");
  
  // Quick sanity-check for the Tenant model.
  console.log(
    "🔍 [DEBUG] Tenant instanceof Model:",
    Tenant.prototype instanceof require("sequelize").Model
  );
  console.log("🔍 [DEBUG] Tenant.getTableName():", Tenant.getTableName());
  
  // Log the authenticated user for debugging.
  console.log("🔍 [DEBUG] req.user:", req.user);

  try {
    // Ensure we have role details. If req.user.role is missing or incomplete,
    // fetch the role from the database.
    let roleFromToken = req.user.role;
    if (!roleFromToken || !roleFromToken.name) {
      console.log("[DEBUG] Role object missing from token. Fetching role from DB for roleId:", req.user.roleId);
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
      console.log("[DEBUG] SuperAdmin branch – retrieving ALL users (clearing any default scopes).");
      // Retrieve all users without any tenant filtering.
      users = await User.unscoped().findAll({
        where: {},
        ...baseOptions,
      });
    } else {
      const tokenTenant = req.user?.tenantId || req.user?.companyId;
      if (!tokenTenant) {
        console.error("[ERROR] No tenant identification found in token.");
        throw new Error("Tenant identification missing");
      }
      console.log("[DEBUG] Non-SuperAdmin branch – filtering users by tenant:", tokenTenant);
      users = await User.findAll({
        ...baseOptions,
        where: { tenantId: tokenTenant },
      });
    }

    console.log("[DEBUG] Successfully fetched users:", users.length);
    console.log("[DEBUG] User IDs fetched:", users.map((u) => u.id).join(", "));
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
// POST /api/users - Create a new user
const createUser = asyncHandler(async (req, res) => {
  console.log("[DEBUG] Received req.body in createUser:", req.body);
  console.log("[DEBUG] req.user in createUser:", req.user);
  console.log("[DEBUG] req.user.dataValues:", req.user.dataValues);
  console.log("[DEBUG] req.file:", req.file); // Debug uploaded file info

  const { firstName, lastName, email, tenantId, roleId, password, mfaEnabled } = req.body;
  let mfaTypeInput = req.body.mfaType; // Expected to be sent as a JSON string or an array

  // Validate required fields.
  if (!tenantId || !roleId || !firstName || !lastName || !email || !password) {
    res.status(400);
    throw new Error("Missing required fields");
  }

  // Get tenant identifier from token.
  const tokenTenant = req.user.companyID || req.user.companyId || req.user.tenantId;
  if (!tokenTenant) {
    res.status(400);
    throw new Error("Tenant identification is missing in token");
  }

  // Explicitly fetch the creating user's role from the DB.
  const creatingUserRole = await Role.findByPk(req.user.roleId);
  console.log("[DEBUG] Creating user's role (fetched from DB):", creatingUserRole);
  const roleName = creatingUserRole ? creatingUserRole.name : undefined;
  console.log("[DEBUG] Role name from token (via DB):", roleName);

  // Enforce SaaS isolation only for non-SuperAdmin users.
  if (roleName !== "SuperAdmin" && tenantId !== tokenTenant) {
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

  // Process MFA type.
  let processedMfaType = null;
  if (mfaEnabled && mfaTypeInput) {
    try {
      // If the input is a string, parse it; otherwise, assume it's already an array.
      const parsed =
        typeof mfaTypeInput === "string"
          ? JSON.parse(mfaTypeInput)
          : mfaTypeInput;
      // Ensure that we end up with an array.
      if (Array.isArray(parsed)) {
        processedMfaType = parsed;
      } else {
        processedMfaType = [parsed];
      }
    } catch (err) {
      console.error("[DEBUG] Error parsing mfaType:", err);
      processedMfaType = Array.isArray(mfaTypeInput)
        ? mfaTypeInput
        : [mfaTypeInput];
    }
  }
  console.log("[DEBUG] Processed MFA type to be saved:", processedMfaType);

  // Process the avatar.
  // If an avatar URL is provided in req.body.avatar (from your dedicated upload endpoint), use that.
  // Otherwise, if a file was uploaded through multer, use its file path.
  let avatarPath = null;
  if (req.body.avatar) {
    avatarPath = req.body.avatar;
    console.log("[DEBUG] Avatar URL from req.body:", avatarPath);
  } else if (req.file) {
    avatarPath = req.file.path; // Ensure your multer middleware stores the file path.
    // Prepend a slash if it's not present to form a proper relative URL.
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
    mfaType: processedMfaType, // stored as an array
    avatar: avatarPath
  });

  // Re-fetch the newly created user including associations so that tenant & role details are available.
  const createdUser = await User.findByPk(newUser.id, {
    include: [
      { model: Tenant, as: "tenant", attributes: ["id", "name"] },
      { model: Role, as: "role", attributes: ["id", "name"] }
    ]
  });

  debugLog("[DEBUG] New user created:", createdUser.toJSON());
  res.status(201).json({
    message: "User created successfully",
    user: { ...createdUser.toJSON(), password: undefined }
  });
});

// POST /api/users/register - Register a new tenant and create the first admin user
export const register = asyncHandler(async (req, res) => {
  console.log("[DEBUG] Received req.body in register:", req.body);

  // Extract required fields from the request body
  const { firstName, lastName, email, company, password } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !company || !password) {
    res.status(400);
    throw new Error("Missing required fields. Please provide firstName, lastName, email, company, and password.");
  }

  // Check if a tenant already exists with this corporate email (stored in emailAdmin)
  const existingTenant = await Tenant.findOne({ where: { emailAdmin: email } });
  if (existingTenant) {
    res.status(400);
    throw new Error("A tenant with this corporate email already exists.");
  }

  // Create a new Tenant record.
  // Here, the company name is stored as 'name' and the corporate email is stored in 'emailAdmin'
  const tenant = await Tenant.create({
    name: company,
    emailAdmin: email,
    isActive: true, // or set an appropriate default active status
  });

  // Hash the provided password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Set a default roleId for the admin user.
  // This may be a constant or you could look it up from your roles table.
  // For example, here we assume a roleId of 2 represents a tenant admin.
  const defaultAdminRoleId = 2;

  // Now create the admin user for the tenant using the new tenant's ID.
  const newUser = await User.create({
    firstName,
    lastName,
    email,
    tenantId: tenant.id, // assign the newly created tenant's ID
    roleId: defaultAdminRoleId,
    password: hashedPassword,
    // Other properties such as mfaEnabled, avatar, etc. can be added if needed.
  });

  console.log("[DEBUG] New tenant and admin user created:", { tenant, newUser });

  res.status(201).json({
    message: "Registration successful",
    tenant: { id: tenant.id, name: tenant.name, emailAdmin: tenant.emailAdmin },
    user: {
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      tenantId: newUser.tenantId,
    },
  });
});


// DELETE /api/users/:id - Delete a user
const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  console.log(`[DEBUG] Attempting to delete user with id: ${userId}`);

  // Find the user by primary key and include role to check if the user is a SuperAdmin.
  const userToDelete = await User.findByPk(userId, {
    include: [
      { model: Role, as: "role", attributes: ["id", "name"] }
    ],
  });
  
  if (!userToDelete) {
    console.error(`[ERROR] User not found with id: ${userId}`);
    res.status(404);
    throw new Error("User not found");
  }

  // Prevent deletion of a SuperAdmin user.
  if (userToDelete.role && userToDelete.role.name === "SuperAdmin") {
    console.error("[ERROR] SuperAdmin user cannot be deleted");
    res.status(403);
    throw new Error("SuperAdmin user cannot be deleted");
  }
  
  // Optionally, you might want to add tenant-based checks here if needed.
  // For example, non-SuperAdmin users could delete only users in their own tenant.
  
  await userToDelete.destroy();
  console.log(`[DEBUG] User with id ${userId} deleted successfully`);
  res.status(200).json({ message: "User deleted successfully" });
});

// PUT /api/users/:id/status — Toggle isActive (Admins only, with tenant isolation)
// PUT /api/users/:id/status - update user status
// PUT /api/users/:id/status - update user status
const updateUserStatus = asyncHandler(async (req, res) => {
  console.log("[DEBUG] Entering updateUserStatus...");

  // The auth middleware decoded token is in req.user but might be incomplete.
  // Re-fetch the current user from the database to get full details (including role).
  const currentUserToken = req.user; // e.g., { id, email, companyID }
  const currentUser = await User.findByPk(currentUserToken.id, {
    include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
  });
  if (!currentUser) {
    res.status(404);
    throw new Error("Authenticated user not found");
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
    res.status(404);
    throw new Error("Target user not found");
  }

  // Determine current user role and tenant.
  const currentUserRole = currentUser.role ? currentUser.role.name : null;
  const currentUserTenant =
    currentUser.tenantId || currentUser.companyID || currentUser.companyId;

  // Determine target user tenant and role.
  const targetTenantId = targetUser.tenantId;
  const targetRoleName = targetUser.role ? targetUser.role.name : null;

  console.log("[DEBUG] Authenticated user:", currentUser.toJSON());
  console.log("[DEBUG] Current user role:", currentUserRole);
  console.log("[DEBUG] Current user tenant:", currentUserTenant);
  console.log("[DEBUG] Target user tenant:", targetTenantId);
  console.log("[DEBUG] Target user role:", targetRoleName);

  // Enforce rules:
  // 1. If current user is not SuperAdmin, tenant must match.
  if (currentUserRole !== "SuperAdmin") {
    if (currentUserTenant !== targetTenantId) {
      res.status(403);
      throw new Error("You can only update users within your own tenant");
    }
  } else {
    // 2. If current user is SuperAdmin, disallow updates on SuperAdmin targets.
    if (targetRoleName === "SuperAdmin") {
      res.status(403);
      throw new Error("SuperAdmin cannot update another SuperAdmin user");
    }
  }

  // Update the target user's status.
  targetUser.isActive = isActive;
  await targetUser.save();

  console.log("[DEBUG] User status updated successfully for user:", targetUser.id);
  res.status(200).json({ message: "User status updated successfully" });
});

// PUT /api/users/:id — tenant-isolated + avatar upload
// PUT /api/users/:id - Update an existing user
// PUT /api/users/:id - Update an existing user
const updateUser = asyncHandler(async (req, res) => {
  console.log("[DEBUG] Received req.body in updateUser:", req.body);
  console.log("[DEBUG] req.user in updateUser:", req.user);

  const { id } = req.params;
  let {
    firstName,
    lastName,
    email,
    tenantId,
    roleId,
    password,
    mfaEnabled,
    mfaType,
    // other possible fields
  } = req.body;

  // Get the tenant id from the token (this is the enforced tenant for non-SuperAdmin users)
  const tokenTenant = req.user.companyID || req.user.companyId || req.user.tenantId;
  if (!tokenTenant) {
    res.status(400);
    throw new Error("Tenant identification is missing in token");
  }

  // Fetch the logged-in user's role from the DB.
  const updatingUserRole = await Role.findByPk(req.user.roleId);
  const roleName = updatingUserRole ? updatingUserRole.name : undefined;
  console.log("[DEBUG] Logged-in user's role (fetched from DB):", updatingUserRole);
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
    // For SuperAdmin, we still require a valid tenant.
    if (!tenantId) {
      res.status(400);
      throw new Error("Tenant must be provided when updating user as SuperAdmin");
    }
  }

  // Validate that the target user exists.
  const user = await User.findByPk(id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
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
  // If the front end sent an avatar URL (e.g. from a prior upload), use it.
  // Otherwise, if a file was uploaded via multer, use its file path.
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

  // If a new avatar is provided and the user already has an avatar,
  // delete the old avatar file from disk.
  const newAvatar = req.body.avatar;
  if (
    newAvatar &&
    user.avatar &&
    user.avatar !== newAvatar &&
    user.avatar.startsWith("/uploads/")
  ) {
    // Remove the leading slash and build the file-system path.
    const oldAvatarRelative = user.avatar.startsWith("/")
      ? user.avatar.substring(1)
      : user.avatar;
    // __dirname is "backend/src/controllers", so use two levels up.
    const oldAvatarFullPath = path.join(__dirname, "..", "..", oldAvatarRelative);
    fs.unlink(oldAvatarFullPath, (err) => {
      if (err) {
        console.error("[ERROR] Failed to delete old avatar file:", err);
      } else {
        console.log("[DEBUG] Successfully deleted old avatar file:", oldAvatarFullPath);
      }
    });
  }

  // If a new password is provided, hash it; otherwise, leave unchanged.
  if (password) {
    req.body.password = await bcrypt.hash(password, 10);
  } else {
    delete req.body.password;
  }

  // Update the user with the provided fields.
  await user.update(req.body);

  // Re-fetch the updated user including tenant & role associations.
  const updatedUser = await User.findByPk(id, {
    include: [
      { model: Tenant, as: "tenant", attributes: ["id", "name"] },
      { model: Role, as: "role", attributes: ["id", "name"] },
    ],
  });

  console.log("[DEBUG] Updated user:", updatedUser.toJSON());
  res.status(200).json({
    message: "User updated successfully",
    user: { ...updatedUser.toJSON(), password: undefined },
  });
});


module.exports = { getRoles, getUserProfile, getUsers, updateUserProfile, createUser, updateUserStatus, updateUser, deleteUser };