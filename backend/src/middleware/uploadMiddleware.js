const multer = require("multer");
const fs = require("fs");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const companyID = req.user.companyID || req.user.tenantId;
    if (!companyID) {
      return cb(new Error("Tenant information missing in token"));
    }

    const uploadPath = path.join("uploads", String(companyID), "profile");

    // Ensure the directory exists
    fs.mkdirSync(uploadPath, { recursive: true });

    // ✅ Before storing the new file, remove any existing profile picture
    try {
      const user = req.user;
      if (user.avatar) {
        const oldAvatarPath = path.join(__dirname, "..", user.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
          console.log("[DEBUG] Previous profile picture deleted:", oldAvatarPath);
        }
      }
    } catch (err) {
      console.error("[ERROR] Failed to delete previous profile picture:", err);
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, "avatar_" + Date.now() + ext);
  },
});

const upload = multer({ storage });

module.exports = upload;