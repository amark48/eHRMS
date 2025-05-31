// controllers/tenantController.jsx

// Import models via the index file so that Tenant is instantiated.
const db = require("../models");

// Debugging: list the available keys so you can verify Tenant is present.
console.log("[DEBUG] Available models:", Object.keys(db));

const Tenant = db.Tenant;

if (!Tenant || typeof Tenant.findAll !== "function") {
  console.error("[ERROR] Tenant model is not properly instantiated. Check your models/index.js file.");
}

/**
 * Helper function to transform a tenant's logoUrl.
 * If logoUrl is stored as a bare filename (e.g. "logo.png"),
 * the function converts it to a public URL of the form:
 *
 *   /uploads/{tenantId}/logo/{filename}
 *
 * If logoUrl already starts with '/uploads/' or with an absolute protocol,
 * it’s assumed to be correct.
 */
const transformLogoUrl = (tenantObj) => {
  if (
    tenantObj.logoUrl &&
    !tenantObj.logoUrl.startsWith("/uploads/") &&
    !tenantObj.logoUrl.startsWith("http://") &&
    !tenantObj.logoUrl.startsWith("https://")
  ) {
    tenantObj.logoUrl = `/uploads/${tenantObj.id}/logo/${tenantObj.logoUrl}`;
  }
  return tenantObj;
};

// -----------------------------------------------------------------
// Existing Endpoints
// -----------------------------------------------------------------

// Get the current tenant (for legacy routes)
const getCurrentTenant = async (req, res) => {
  try {
    console.log("[DEBUG] getCurrentTenant: Fetching tenant...");
    // For simplicity, we fetch the first tenant.
    const tenant = await Tenant.findOne();
    if (!tenant) {
      console.log("[DEBUG] getCurrentTenant: No tenant found.");
      return res.status(404).json({ message: "Tenant not found" });
    }
    console.log("[DEBUG] getCurrentTenant: Tenant found:", tenant);
    // Transform logoUrl if needed.
    const t = transformLogoUrl(tenant.toJSON());
    res.json({
      name: t.name,
      logoUrl: t.logoUrl,
      themeColor: t.themeColor,
    });
  } catch (error) {
    console.error("[DEBUG] getCurrentTenant: Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get tenants by email domain.
// Assumes that your Tenant model now has a "domain" field.
const getTenantsByDomain = async (req, res) => {
  try {
    console.log("[DEBUG] getTenantsByDomain: Received query params:", req.query);
    const { domain } = req.query;
    if (!domain) {
      console.log("[DEBUG] getTenantsByDomain: No domain parameter provided.");
      return res.status(400).json({ message: "Domain query parameter is required." });
    }
    const normalizedDomain = domain.toLowerCase();
    console.log(`[DEBUG] getTenantsByDomain: Searching for tenants with domain "${normalizedDomain}"`);

    const tenantsFound = await Tenant.findAll({
      where: { domain: normalizedDomain },
    });
    console.log("[DEBUG] getTenantsByDomain: Tenants from DB:", tenantsFound);

    if (!tenantsFound || tenantsFound.length === 0) {
      console.log("[DEBUG] getTenantsByDomain: No tenants found.");
      return res.status(404).json({ message: "No tenants found for this domain." });
    }
    const result = tenantsFound.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
    }));
    console.log("[DEBUG] getTenantsByDomain: Returning tenants:", result);
    return res.status(200).json(result);
  } catch (error) {
    console.error("[DEBUG] getTenantsByDomain: Error:", error);
    res.status(500).json({ message: "Server error", error: error.toString() });
  }
};

// -----------------------------------------------------------------
// New CRUD Endpoints for Tenant Management
// -----------------------------------------------------------------

// GET /api/tenants - Retrieve all tenants.
const getTenants = async (req, res) => {
  try {
    const tenantsList = await Tenant.findAll();
    console.log("[DEBUG] Retrieved tenants:", tenantsList);
    // No inversion is applied—the response matches the actual isActive status.
    const result = tenantsList.map((tenant) => transformLogoUrl(tenant.toJSON()));
    res.json(result);
  } catch (error) {
    console.error("[DEBUG] getTenants Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/tenants/:id - Retrieve a single tenant by ID.
const getTenantById = async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    let t = tenant.toJSON();
    // Remove inversion for active status.
    t = transformLogoUrl(t);
    res.json(t);
  } catch (error) {
    console.error("[DEBUG] getTenantById Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/tenants - Create a new tenant.
const createTenant = async (req, res) => {
  try {
    console.log("Incoming create tenant request body:", req.body);

    // Destructure the expected fields from the request body.
    const {
      name,
      domain,
      industry,
      subscriptionTier,
      logoUrl,
      companyWebsite,
      billingStreet,
      billingCity,
      billingState,
      billingZip,
      billingCountry,
      billingPhone,
      mfaEnabled,
      allowedMfa,
    } = req.body;

    console.log("MFA values received - mfaEnabled:", mfaEnabled, "allowedMfa:", allowedMfa);

    const mfaArray = Array.isArray(allowedMfa) ? allowedMfa : [];
    console.log("Processed allowed MFA:", mfaArray);

    const tenant = await Tenant.create({
      name,
      domain,
      industry,
      subscriptionTier,
      logoUrl,
      companyWebsite,
      billingStreet,
      billingCity,
      billingState,
      billingZip,
      billingCountry,
      billingPhone,
      mfaEnabled: mfaEnabled,
      allowedMfa: mfaArray,
    });

    console.log("Tenant successfully created:", tenant);
    res.status(201).json(tenant);
  } catch (error) {
    console.error("Error creating tenant:", error);
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/tenants/:id - Update an existing tenant.
const updateTenant = async (req, res) => {
  try {
    console.log("Incoming update request body:", req.body);
    const { mfaEnabled, allowedMfa, ...otherFields } = req.body;
    console.log("MFA fields from request - mfaEnabled:", mfaEnabled, "allowedMfa:", allowedMfa);
    const mfaArray = Array.isArray(allowedMfa) ? allowedMfa : [];
    console.log("Processed allowed MFA array:", mfaArray);
    const tenantId = req.params.id;

    const [affectedCount, updatedRows] = await Tenant.update(
      {
        ...otherFields,
        mfaEnabled: mfaEnabled,
        allowedMfa: mfaArray,
      },
      {
        where: { id: tenantId },
        returning: true,
      }
    );

    console.log("Update result:", { affectedCount, updatedRows });
    if (affectedCount === 0) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    res.status(200).json(updatedRows[0]);
  } catch (error) {
    console.error("Error updating tenant:", error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/tenants/:id - Delete a tenant.
const deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    await tenant.destroy();
    res.json({ message: "Tenant deleted successfully" });
  } catch (error) {
    console.error("[DEBUG] deleteTenant Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PATCH /api/tenants/:id/toggle - Toggle a tenant's active status.
const toggleTenantStatus = async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    // Toggle the isActive flag.
    tenant.isActive = !tenant.isActive;
    await tenant.save();
    res.json(tenant.toJSON());
  } catch (error) {
    console.error("[DEBUG] toggleTenantStatus Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getCurrentTenant,
  getTenantsByDomain,
  getTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  toggleTenantStatus,
};