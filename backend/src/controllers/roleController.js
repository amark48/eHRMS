// src/controllers/roleController.js
const asyncHandler = require("express-async-handler");
const Role = require("../models/Role");
const { debugLog } = require("../utils/logger");

// GET /api/roles - Fetch all roles
const getRoles = asyncHandler(async (req, res) => {
    console.log("[DEBUG] getRoles function triggered");
    debugLog("[DEBUG] Executing getRoles function");
  try {
    const roles = await Role.findAll();
    debugLog("[DEBUG] Retrieved roles:", roles.map((role) => role.toJSON()));
    res.json(roles);
  } catch (error) {
    debugLog("[ERROR] Failed to fetch roles:", error);
    res.status(500).json({ message: "Error fetching roles", error: error.message });
  }
});

// POST /api/roles - Create a new role (admin-only)
const createRole = asyncHandler(async (req, res) => {
  const { name, description, permissions } = req.body;

  if (!name || !permissions) {
    res.status(400);
    throw new Error("Role name and permissions are required.");
  }

  try {
    // Check if role name already exists
    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      res.status(400);
      throw new Error("Role name already exists.");
    }

    const newRole = await Role.create({ name, description, permissions });
    debugLog("[DEBUG] Created new role:", newRole.toJSON());
    res.status(201).json(newRole);
  } catch (error) {
    debugLog("[ERROR] Failed to create role:", error);
    res.status(500).json({ message: "Error creating role", error: error.message });
  }
});

// PUT /api/roles/:id - Update an existing role (admin-only)
const updateRole = asyncHandler(async (req, res) => {
  const { name, description, permissions } = req.body;
  const roleId = req.params.id;

  try {
    const role = await Role.findByPk(roleId);
    if (!role) {
      res.status(404);
      throw new Error("Role not found.");
    }

    // Validate updates before applying them
    if (name) {
      const nameExists = await Role.findOne({ where: { name, id: { $ne: roleId } } });
      if (nameExists) {
        res.status(400);
        throw new Error("Role name already exists.");
      }
      role.name = name;
    }

    if (description) role.description = description;
    if (permissions) role.permissions = permissions;

    await role.save();
    debugLog("[DEBUG] Updated role:", role.toJSON());
    res.json(role);
  } catch (error) {
    debugLog("[ERROR] Failed to update role:", error);
    res.status(500).json({ message: "Error updating role", error: error.message });
  }
});

// DELETE /api/roles/:id - Delete a role (admin-only)
const deleteRole = asyncHandler(async (req, res) => {
  const roleId = req.params.id;

  try {
    const role = await Role.findByPk(roleId);
    if (!role) {
      res.status(404);
      throw new Error("Role not found.");
    }

    await role.destroy();
    debugLog("[DEBUG] Deleted role:", roleId);
    res.json({ message: "Role deleted successfully." });
  } catch (error) {
    debugLog("[ERROR] Failed to delete role:", error);
    res.status(500).json({ message: "Error deleting role", error: error.message });
  }
});

module.exports = { getRoles, createRole, updateRole, deleteRole };