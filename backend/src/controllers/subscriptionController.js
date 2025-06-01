// backend/src/controllers/subscriptionController.js

const asyncHandler = require("express-async-handler");
const { Op } = require("sequelize");
const { Subscription } = require("../models"); // Import initialized models via index.js

/**
 * GET /api/subscriptions
 * Fetch all subscription plans.
 */
const getSubscriptions = asyncHandler(async (req, res) => {
  console.log("[DEBUG] Executing getSubscriptions function");
  console.log("[DEBUG] Request Query:", req.query);
  try {
    const subscriptions = await Subscription.findAll();
    console.log(
      `[DEBUG] Retrieved ${subscriptions.length} subscriptions:`,
      subscriptions.map((sub) => sub.toJSON())
    );
    res.json(subscriptions);
  } catch (error) {
    console.error("[ERROR] Failed to fetch subscriptions:", error);
    res
      .status(500)
      .json({ message: "Error fetching subscriptions", error: error.message });
  }
});

/**
 * GET /api/subscriptions/:id
 * Fetch a single subscription plan by its ID.
 */
const getSubscriptionById = asyncHandler(async (req, res) => {
  console.log("[DEBUG] Executing getSubscriptionById with ID:", req.params.id);
  try {
    const subscription = await Subscription.findByPk(req.params.id);
    if (!subscription) {
      console.error("[DEBUG] Subscription not found for ID:", req.params.id);
      return res.status(404).json({ error: "Subscription not found" });
    }
    console.log("[DEBUG] Found subscription:", subscription.toJSON());
    res.json(subscription);
  } catch (error) {
    console.error("[ERROR] getSubscriptionById error:", error);
    res
      .status(500)
      .json({ message: "Error fetching subscription", error: error.message });
  }
});

/**
 * POST /api/subscriptions
 * Create a new subscription plan.
 * Expected body fields:
 *  - name, price, duration, features, trialPeriodDays, status, autoRenew, renewalDate.
 */
const createSubscription = asyncHandler(async (req, res) => {
  console.log("[DEBUG] Executing createSubscription function");
  console.log("[DEBUG] Incoming request body:", req.body);

  const { name, price, duration, features, trialPeriodDays, status, autoRenew, renewalDate } =
    req.body;

  // Validate required fields.
  if (!name || !price || !duration) {
    console.error("[ERROR] Missing required fields: name, price, or duration");
    res.status(400);
    throw new Error("Subscription name, price, and duration are required.");
  }

  try {
    // Check for duplicate subscription name.
    const existingSubscription = await Subscription.findOne({ where: { name } });
    if (existingSubscription) {
      console.error("[ERROR] Subscription name already exists:", name);
      res.status(400);
      throw new Error("Subscription name already exists.");
    }

    const subscriptionData = {
      name,
      price,
      duration,
      features: features || null,
      trialPeriodDays: trialPeriodDays || null,
      status: status || "active",
      autoRenew: typeof autoRenew !== "undefined" ? autoRenew : true,
      renewalDate: renewalDate || null,
    };

    console.log("[DEBUG] Creating subscription with data:", subscriptionData);

    const newSubscription = await Subscription.create(subscriptionData);
    console.log("[DEBUG] Created subscription with ID:", newSubscription.id);
    res.status(201).json(newSubscription);
  } catch (error) {
    console.error("[ERROR] Failed to create subscription:", error);
    res
      .status(500)
      .json({ message: "Error creating subscription", error: error.message });
  }
});

/**
 * PUT /api/subscriptions/:id
 * Update an existing subscription plan.
 */
const updateSubscription = asyncHandler(async (req, res) => {
  console.log("[DEBUG] Executing updateSubscription function");
  console.log("[DEBUG] Updating subscription ID:", req.params.id);
  console.log("[DEBUG] Incoming update data:", req.body);
  const subscriptionId = req.params.id;
  try {
    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) {
      console.error("[DEBUG] Subscription not found for ID:", subscriptionId);
      res.status(404);
      throw new Error("Subscription not found.");
    }
    // If updating the name, check for duplicates (exclude current subscription).
    if (req.body.name && req.body.name !== subscription.name) {
      const nameExists = await Subscription.findOne({
        where: { name: req.body.name, id: { [Op.ne]: subscriptionId } },
      });
      if (nameExists) {
        console.error("[ERROR] Subscription name already exists:", req.body.name);
        res.status(400);
        throw new Error("Subscription name already exists.");
      }
      subscription.name = req.body.name;
    }
    if (req.body.price) subscription.price = req.body.price;
    if (req.body.duration) subscription.duration = req.body.duration;
    if (req.body.features) subscription.features = req.body.features;
    if (typeof req.body.trialPeriodDays !== "undefined")
      subscription.trialPeriodDays = req.body.trialPeriodDays;
    if (req.body.status) subscription.status = req.body.status;
    if (typeof req.body.autoRenew !== "undefined")
      subscription.autoRenew = req.body.autoRenew;
    if (req.body.renewalDate) subscription.renewalDate = req.body.renewalDate;

    await subscription.save();
    console.log("[DEBUG] Successfully updated subscription:", subscription.toJSON());
    res.json(subscription);
  } catch (error) {
    console.error("[ERROR] Failed to update subscription:", error);
    res
      .status(500)
      .json({ message: "Error updating subscription", error: error.message });
  }
});

/**
 * DELETE /api/subscriptions/:id
 * Delete a subscription plan.
 */
const deleteSubscription = asyncHandler(async (req, res) => {
  console.log("[DEBUG] Executing deleteSubscription function");
  console.log("[DEBUG] Deleting subscription ID:", req.params.id);
  const subscriptionId = req.params.id;
  try {
    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) {
      console.error("[DEBUG] Subscription not found for ID:", subscriptionId);
      res.status(404);
      throw new Error("Subscription not found.");
    }
    await subscription.destroy();
    console.log("[DEBUG] Deleted subscription with ID:", subscriptionId);
    res.json({ message: "Subscription deleted successfully" });
  } catch (error) {
    console.error("[ERROR] Failed to delete subscription:", error);
    res
      .status(500)
      .json({ message: "Error deleting subscription", error: error.message });
  }
});

/**
 * PATCH /api/subscriptions/:id/toggle
 * Toggle the subscription status between "active" and "suspended".
 */
const toggleSubscriptionStatus = asyncHandler(async (req, res) => {
  console.log("[DEBUG] Executing toggleSubscriptionStatus function");
  console.log("[DEBUG] Toggling subscription ID:", req.params.id);
  try {
    const subscription = await Subscription.findByPk(req.params.id);
    if (!subscription) {
      console.error("[DEBUG] Subscription not found for ID:", req.params.id);
      res.status(404);
      throw new Error("Subscription not found.");
    }
    const newStatus = subscription.status === "active" ? "suspended" : "active";
    await subscription.update({ status: newStatus });
    console.log(
      `[DEBUG] Toggled subscription ID ${req.params.id} to new status: ${newStatus}`
    );
    res.json(subscription);
  } catch (error) {
    console.error("[ERROR] Failed to toggle subscription status:", error);
    res.status(500).json({
      message: "Error toggling subscription status",
      error: error.message,
    });
  }
});

module.exports = {
  getSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  toggleSubscriptionStatus,
};
