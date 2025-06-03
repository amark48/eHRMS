// routes/billingRoutes.js
const express = require("express");
const router = express.Router();
const billingController = require("../controllers/billingController");

// GET /api/billings - List all billing records
router.get("/", billingController.getBillings);

// GET /api/billings/:id - Get a specific billing record
router.get("/:id", billingController.getBillingById);

// POST /api/billings - Create a new billing record
router.post("/", billingController.createBilling);

// PUT /api/billings/:id - Update an existing billing record
router.put("/:id", billingController.updateBilling);

// DELETE /api/billings/:id - Delete a billing record
router.delete("/:id", billingController.deleteBilling);

module.exports = router;
