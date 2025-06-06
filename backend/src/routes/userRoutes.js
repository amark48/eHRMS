// src/routes/userRoutes.js
const express = require("express");
const router = express.Router();

const {
  getUsers,
  getRoles,
  getUserProfile,
  updateUserProfile,
  createUser,
  updateUserStatus,
  updateUser,
  deleteUser,
  register,      // public registration handler
  verifyOTP      // OTP verification handler added here
} = require("../controllers/userController");

const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Debug middleware: Logs every request coming into this router.
router.use((req, res, next) => {
  console.log(`[DEBUG userRoutes] ${req.method} ${req.originalUrl}`);
  next();
});

/*────────────────────────────
  Public Routes
────────────────────────────*/

// Registration route (public – no token required)
router.post(
  "/register",
  (req, res, next) => {
    console.log("[DEBUG] No Token Required POST /register called");
    next();
  },
  register
);

// OTP Verification Route (public)
router.post(
  "/verify-otp",
  verifyOTP
);

/*────────────────────────────
  Protected Routes (require authentication and appropriate roles)
────────────────────────────*/

// User Profile Routes
router.get(
  "/profile",
  protect,
  (req, res, next) => {
    console.log("[DEBUG] GET /profile called");
    next();
  },
  getUserProfile
);

router.put(
  "/profile",
  protect,
  upload.single("avatar"),
  (req, res, next) => {
    console.log("[DEBUG] PUT /profile called");
    next();
  },
  updateUserProfile
);

// Fetch Users & Roles
router.get(
  "/",
  protect,
  (req, res, next) => {
    console.log("[DEBUG] GET / (fetch users) called");
    next();
  },
  getUsers
);

router.get(
  "/roles",
  protect,
  (req, res, next) => {
    console.log("[DEBUG] GET /roles called");
    next();
  },
  getRoles
);

// Create & Update Users (Admin/SuperAdmin)
router.post(
  "/",
  protect,
  adminOnly,
  upload.single("avatar"),
  (req, res, next) => {
    console.log("[DEBUG] POST / (create user) called");
    next();
  },
  createUser
);

router.put(
  "/:id",
  protect,
  adminOnly,
  upload.single("avatar"),
  (req, res, next) => {
    console.log(`[DEBUG] PUT /${req.params.id} (update user) called`);
    next();
  },
  updateUser
);

// Update User Status (enable/disable)
router.put(
  "/:id/status",
  protect,
  adminOnly,
  (req, res, next) => {
    console.log(`[DEBUG] PUT /${req.params.id}/status (update user status) called`);
    next();
  },
  updateUserStatus
);

// DELETE User Route
router.delete(
  "/:id",
  protect,
  adminOnly,
  (req, res, next) => {
    console.log(`[DEBUG] DELETE /${req.params.id} (delete user) called`);
    next();
  },
  deleteUser
);

module.exports = router;
