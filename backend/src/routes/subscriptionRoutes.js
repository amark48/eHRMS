// src/routes/subscriptionRoutes.js
const express = require("express");
const router = express.Router();
const { getSubscriptions, createSubscription, updateSubscription, deleteSubscription } = require("../controllers/subscriptionController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Debug logging to confirm controller functions are properly imported
console.log("[DEBUG] subscriptionRoutes.js - Imported Controllers:", { getSubscriptions, createSubscription, updateSubscription, deleteSubscription });
console.log("[DEBUG] subscriptionRoutes.js - Imported Middleware:", { protect, adminOnly });

// GET /api/subscriptions - Fetch all subscriptions (protected)
router.get("/", protect, async (req, res, next) => {
  console.log("[DEBUG] GET /api/subscriptions triggered");
  next();
}, getSubscriptions);

// POST /api/subscriptions - Create a new subscription (admin-only)
router.post("/", protect, adminOnly, async (req, res, next) => {
  console.log("[DEBUG] POST /api/subscriptions triggered");
  console.log("[DEBUG] Incoming request body:", req.body);
  next();
}, createSubscription);

// PUT /api/subscriptions/:id - Update an existing subscription (admin-only)
router.put("/:id", protect, adminOnly, async (req, res, next) => {
  console.log("[DEBUG] PUT /api/subscriptions/:id triggered");
  console.log("[DEBUG] Updating subscription ID:", req.params.id);
  console.log("[DEBUG] Incoming request body:", req.body);
  next();
}, updateSubscription);

// DELETE /api/subscriptions/:id - Delete a subscription (admin-only)
router.delete("/:id", protect, adminOnly, async (req, res, next) => {
  console.log("[DEBUG] DELETE /api/subscriptions/:id triggered");
  console.log("[DEBUG] Deleting subscription ID:", req.params.id);
  next();
}, deleteSubscription);

module.exports = router;