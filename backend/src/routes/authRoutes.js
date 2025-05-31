// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { setupTotp, loginUser, requestMfaCode, verifyMfa } = require("../controllers/authController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Public routes
router.post("/login", loginUser);
router.post("/request-mfa-code", requestMfaCode);
router.post("/verify-mfa", verifyMfa);

// Protected route: Setup TOTP should only be called by an authenticated user.
router.post("/setup-totp", protect, setupTotp);

module.exports = router;