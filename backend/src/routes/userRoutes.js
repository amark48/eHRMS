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
} = require("../controllers/userController");

const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// 🔹 User Profile (self) routes
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, upload.single("avatar"), updateUserProfile);

// 🔹 Fetch Users & Roles
router.get("/", protect, getUsers);
router.get("/roles", protect, getRoles);

// 🔹 Create & Update Users (Admin/SuperAdmin)
router.post("/", protect, adminOnly, createUser);
router.put(
  "/:id",
  protect,
  adminOnly,
  upload.single("avatar"),  // ← attach multer here for profilePicture
  updateUser
);

// 🔹 Update User Status (enable/disable)
router.put("/:id/status", protect, adminOnly, updateUserStatus);

module.exports = router;