// routes/reportsRoutes.js (example)
const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const router = express.Router();

router.get(
  "/",
  protect,
  authorizeRoles("admin"), // Only users with the "admin" role can access
  (req, res) => {
    res.status(200).json({ message: "Welcome, admin – here are the reports." });
  }
);

module.exports = router;