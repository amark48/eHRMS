// src/routes/avatarUploadRoutes.js

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer storage. The destination callback creates the folder if not available.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tenantId = req.params.tenantId;
    if (!tenantId) {
      // If tenantId is missing in the URL, abort.
      return cb(new Error("Tenant ID is missing in URL"));
    }
    // Build the upload path: uploads/{tenantId}/profile
    // Change from using one ".." to two ".." so that we move from:
    // backend/src/routes  --> backend/uploads/{tenantId}/profile
    const uploadPath = path.join(__dirname, "..", "..", "uploads", tenantId, "profile");

    // Create the folder if it does not exist.
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log("[DEBUG] Created folder:", uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    // Use a unique filename based on timestamp.
    const filename = `avatar_${Date.now()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

// POST endpoint for avatar uploads.
// The client should POST to /upload-avatar/{tenantId}/avatar with the file in the "avatar" field.
router.post("/:tenantId/avatar", upload.single("avatar"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const tenantId = req.params.tenantId;
  const newFileName = req.file.filename;
  // Build the public URL (relative URL) for the uploaded avatar.
  const avatarUrl = `/uploads/${tenantId}/profile/${newFileName}`;
  console.log("[DEBUG] Avatar file saved at:", req.file.path);
  console.log("[DEBUG] Returning avatar URL:", avatarUrl);

  return res.status(200).json({ avatarUrl });
});

module.exports = router;
