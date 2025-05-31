// routes/tenantRoutes.js
const express = require("express");
const router = express.Router();

const {
  getCurrentTenant,
  getTenantsByDomain,
  getTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  toggleTenantStatus
} = require("../controllers/tenantController.jsx");

// Existing endpoints
// Route to get the current tenant (company) details.
router.get("/current", getCurrentTenant);

// New endpoint: get companies by domain.
// Frontend should call: GET /api/tenants/by-domain?domain=democorp.com
router.get("/by-domain", getTenantsByDomain);

// New CRUD endpoints for tenant management:

// GET /api/tenants - Retrieve a list of all tenants.
router.get("/", getTenants);

// GET /api/tenants/:id - Retrieve a single tenant by its ID.
router.get("/:id", getTenantById);

// POST /api/tenants - Create a new tenant.
router.post("/", createTenant);

// PUT /api/tenants/:id - Update an existing tenant by its ID.
router.put("/:id", updateTenant);

// DELETE /api/tenants/:id - Delete a tenant by its ID.
router.delete("/:id", deleteTenant);

// PATCH /api/tenants/:id/toggle - Toggle a tenant's active status.
router.patch("/:id/toggle", toggleTenantStatus);

module.exports = router;