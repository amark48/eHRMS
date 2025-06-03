// controllers/billingController.js

const { Billing, Tenant } = require("../models");


// GET /api/billings
exports.getBillings = async (req, res) => {
  try {
    const billings = await Billing.findAll({
      order: [["billingDate", "DESC"]],
      include: [
        {
          model: Tenant,
          as: "tenant",
          attributes: ["name"], // Only load the tenant's name (adjust if your field is named differently)
        },
      ],
    });
    res.status(200).json(billings);
  } catch (error) {
    console.error("Error fetching billings:", error);
    res.status(500).json({ message: "Server error while fetching billings." });
  }
};

// GET /api/billings/:id
exports.getBillingById = async (req, res) => {
  try {
    const { id } = req.params;
    const billing = await Billing.findByPk(id, {
      include: [
        {
          model: Tenant,
          as: "tenant",
          attributes: ["name"],
        },
      ],
    });
    if (!billing) {
      return res.status(404).json({ message: "Billing record not found." });
    }
    res.status(200).json(billing);
  } catch (error) {
    console.error("Error fetching billing record:", error);
    res.status(500).json({ message: "Server error while fetching billing record." });
  }
};

// POST /api/billings
exports.createBilling = async (req, res) => {
  try {
    const { tenantId, billingDate, amount, isPaid } = req.body;
    if (!tenantId || !billingDate || !amount) {
      return res
        .status(400)
        .json({ message: "tenantId, billingDate, and amount are required." });
    }

    // Create the billing record
    const newBilling = await Billing.create({
      tenantId,
      billingDate,
      amount,
      isPaid: isPaid || false,
    });

    // Re-fetch the new record with the associated Tenant data
    const billingWithTenant = await Billing.findByPk(newBilling.id, {
      include: [
        {
          model: Tenant,
          as: "tenant",
          attributes: ["name"], // Adjust if your tenant property is different
        },
      ],
    });

    res.status(201).json(billingWithTenant);
  } catch (error) {
    console.error("Error creating billing record:", error);
    res
      .status(500)
      .json({ message: "Server error while creating billing record." });
  }
};

// PUT /api/billings/:id
exports.updateBilling = async (req, res) => {
  try {
    const { id } = req.params;
    const billing = await Billing.findByPk(id);
    if (!billing) {
      return res.status(404).json({ message: "Billing record not found." });
    }
    // Update only transactional fields. Do not update address fields here.
    const updatedBilling = await billing.update(req.body);
    res.status(200).json(updatedBilling);
  } catch (error) {
    console.error("Error updating billing record:", error);
    res.status(500).json({ message: "Server error while updating billing record." });
  }
};

// DELETE /api/billings/:id
exports.deleteBilling = async (req, res) => {
  try {
    const { id } = req.params;
    const billing = await Billing.findByPk(id);
    if (!billing) {
      return res.status(404).json({ message: "Billing record not found." });
    }
    await billing.destroy();
    res.status(200).json({ message: "Billing record deleted successfully." });
  } catch (error) {
    console.error("Error deleting billing record:", error);
    res.status(500).json({ message: "Server error while deleting billing record." });
  }
};
