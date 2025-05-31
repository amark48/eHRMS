// src/controllers/subscriptionController.js
const asyncHandler = require("express-async-handler");
const Subscription = require("../models/Subscription");
const { debugLog } = require("../utils/logger");

// GET /api/subscriptions - Fetch all subscriptions
const getSubscriptions = asyncHandler(async (req, res) => {
  console.log("[DEBUG] Executing getSubscriptions function");
  try {
    const subscriptions = await Subscription.findAll();
    console.log("[DEBUG] Retrieved subscriptions:", subscriptions.map(sub => sub.toJSON()));
    res.json(subscriptions);
  } catch (error) {
    console.error("[ERROR] Failed to fetch subscriptions:", error);
    res.status(500).json({ message: "Error fetching subscriptions", error: error.message });
  }
});

// POST /api/subscriptions - Create a new subscription (admin-only)
const createSubscription = asyncHandler(async (req, res) => {
  console.log("[DEBUG] Executing createSubscription function");
  console.log("[DEBUG] Incoming request body:", req.body);

  const { name, price, duration, features } = req.body;

  if (!name || !price || !duration || !features) {
    console.error("[ERROR] Missing required fields.");
    res.status(400);
    throw new Error("Subscription name, price, duration, and features are required.");
  }

  try {
    const existingSubscription = await Subscription.findOne({ where: { name } });
    if (existingSubscription) {
      console.error("[ERROR] Subscription name already exists:", name);
      res.status(400);
      throw new Error("Subscription name already exists.");
    }

    const newSubscription = await Subscription.create({ name, price, duration, features });
    console.log("[DEBUG] Created new subscription:", newSubscription.toJSON());
    res.status(201).json(newSubscription);
  } catch (error) {
    console.error("[ERROR] Failed to create subscription:", error);
    res.status(500).json({ message: "Error creating subscription", error: error.message });
  }
});

// PUT /api/subscriptions/:id - Update an existing subscription (admin-only)
const updateSubscription = asyncHandler(async (req, res) => {
  console.log("[DEBUG] Executing updateSubscription function");
  console.log("[DEBUG] Updating subscription ID:", req.params.id);
  console.log("[DEBUG] Incoming request body:", req.body);

  const { name, price, duration, features } = req.body;
  const subscriptionId = req.params.id;

  try {
    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) {
      console.error("[ERROR] Subscription not found:", subscriptionId);
      res.status(404);
      throw new Error("Subscription not found.");
    }

    if (name) {
      const nameExists = await Subscription.findOne({ where: { name, id: { $ne: subscriptionId } } });
      if (nameExists) {
        console.error("[ERROR] Subscription name already exists:", name);
        res.status(400);
        throw new Error("Subscription name already exists.");
      }
      subscription.name = name;
    }

    if (price) subscription.price = price;
    if (duration) subscription.duration = duration;
    if (features) subscription.features = features;

    await subscription.save();
    console.log("[DEBUG] Updated subscription:", subscription.toJSON());
    res.json(subscription);
  } catch (error) {
    console.error("[ERROR] Failed to update subscription:", error);
    res.status(500).json({ message: "Error updating subscription", error: error.message });
  }
});

// DELETE /api/subscriptions/:id - Delete a subscription (admin-only)
const deleteSubscription = asyncHandler(async (req, res) => {
  console.log("[DEBUG] Executing deleteSubscription function");
  console.log("[DEBUG] Deleting subscription ID:", req.params.id);

  const subscriptionId = req.params.id;

  try {
    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) {
      console.error("[ERROR] Subscription not found:", subscriptionId);
      res.status(404);
      throw new Error("Subscription not found.");
    }

    await subscription.destroy();
    console.log("[DEBUG] Deleted subscription:", subscriptionId);
    res.json({ message: "Subscription deleted successfully." });
  } catch (error) {
    console.error("[ERROR] Failed to delete subscription:", error);
    res.status(500).json({ message: "Error deleting subscription", error: error.message });
  }
});

module.exports = { getSubscriptions, createSubscription, updateSubscription, deleteSubscription };