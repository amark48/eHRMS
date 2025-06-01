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
} = require("../controllers/userController");

const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Debug middleware: Logs every request coming into this router.
router.use((req, res, next) => {
  console.log(`[DEBUG userRoutes] ${req.method} ${req.originalUrl}`);
  next();
});

// 🔹 User Profile (self) routes
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

// 🔹 Fetch Users & Roles
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

// 🔹 Create & Update Users (Admin/SuperAdmin)
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
  upload.single("avatar"),  // attached for update
  (req, res, next) => {
    console.log(`[DEBUG] PUT /${req.params.id} (update user) called`);
    next();
  },
  updateUser
);

// 🔹 Update User Status (enable/disable)
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

// DELETE /api/users/:id
router.delete(
  "/:id", 
  protect,
  adminOnly,
    (req, res, next) => {
    console.log(`[DEBUG] PUT /${req.params.id}/delete (delete user) called`);
    next();
  },
  deleteUser
); 

module.exports = router;
