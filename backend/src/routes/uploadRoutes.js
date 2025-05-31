// routes/uploadRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Import your models via your index file.
const db = require("../models");
const Tenant = db.Tenant;

// Configure multer storage.
// Files are stored in "backend/uploads/{tenantId}/logo/".
// In the destination callback we ensure the directory exists and remove any existing files,
// so that a new upload entirely replaces the current logo.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tenantId = req.params.tenantId;
    // Build the destination path.
    const uploadPath = path.join(__dirname, "..", "..", "uploads", tenantId, "logo");
    try {
      // Ensure the directory exists.
      fs.mkdirSync(uploadPath, { recursive: true });
      // Remove any existing files in the directory.
      const existingFiles = fs.readdirSync(uploadPath);
      existingFiles.forEach((existingFile) => {
        fs.unlinkSync(path.join(uploadPath, existingFile));
      });
    } catch (err) {
      return cb(err);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    // Use a temporary fixed filename (e.g. "logo.png").
    // It will be renamed in the route handler.
    cb(null, `logo${ext}`);
  },
});

// Create the multer instance, filtering only for image files.
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

// POST /upload/:tenantId/logo
// This endpoint processes the upload, renames the file to a permanent filename,
// updates the Tenant record with the new logo URL, and returns that URL.
router.post("/upload/:tenantId/logo", upload.single("logo"), async (req, res) => {
  try {
    const { tenantId } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Generate a new file name using tenantId and the current timestamp.
    const ext = path.extname(req.file.originalname);
    const newFileName = `logo_${tenantId}_${Date.now()}${ext}`;

    // Get the directory where the file was uploaded.
    const fileDir = path.dirname(req.file.path);
    const newFilePath = path.join(fileDir, newFileName);

    // Rename the file using the promise-based fs API.
    await fs.promises.rename(req.file.path, newFilePath);

    // Construct the public URL for the uploaded logo.
    const logoUrl = `/uploads/${tenantId}/logo/${newFileName}`;

    // Update the Tenant record with the new logoUrl.
    await Tenant.update({ logoUrl }, { where: { id: tenantId } });

    res.status(200).json({ logoUrl });
  } catch (error) {
    console.error("Error uploading or renaming logo:", error);
    res.status(500).json({ error: error.toString() });
  }
});

module.exports = router;