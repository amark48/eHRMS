require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { connectDB } = require("./src/config/db");

// Import routes
const tenantRoutes = require("./src/routes/tenantRoutes");
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const roleRoutes = require("./src/routes/roleRoutes");
const subscriptionRoutes = require("./src/routes/subscriptionRoutes");
const uploadRoutes = require("./src/routes/uploadRoutes");
const avatarUploadRoutes = require("./src/routes/avatarUploadRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Debug logging to confirm route imports.
console.log("[DEBUG] Loaded Routes:", {
  tenantRoutes,
  authRoutes,
  userRoutes,
  roleRoutes,
  subscriptionRoutes,
  uploadRoutes,
});

// Enable CORS.
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS","PATCH"],
  })
);

// Middleware to parse JSON and URL-encoded requests.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the "uploads" folder using a cross-platform path.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Debug Logging Middleware.
app.use((req, res, next) => {
  console.log(`[DEBUG] Request received: ${req.method} ${req.url}`);
  next();
});

// Test Route.
app.get("/", (req, res) => res.send("HRMS SaaS API is running..."));

// Mount your API routes.
app.use("/api/tenants", tenantRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/upload", uploadRoutes);
// For avatar uploads, mount under "/upload-avatar".
app.use("/upload-avatar", avatarUploadRoutes);

// Handle unmatched routes.
app.use((req, res, next) => {
  console.error(`[ERROR] Endpoint Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ message: "Endpoint Not Found" });
});

// Improved Error Handling Middleware.
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`, err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Connect to the database and start the server.
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error("[ERROR] Failed to connect to database:", error);
    process.exit(1);
  });
