const express = require("express");
const router = express.Router();
const { getRoles, createRole, updateRole, deleteRole } = require("../controllers/roleController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/", protect, getRoles);
router.post("/", protect, adminOnly, createRole);
router.put("/:id", protect, adminOnly, updateRole);
router.delete("/:id", protect, adminOnly, deleteRole);

module.exports = router; // ✅ Ensure you're exporting the router