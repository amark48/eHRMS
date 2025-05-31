require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./src/config/db");
const multer = require("multer");

// Import routes
const tenantRoutes = require("./src/routes/tenantRoutes");
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const roleRoutes = require("./src/routes/roleRoutes");
const subscriptionRoutes = require("./src/routes/subscriptionRoutes");
const uploadRoutes = require("./src/routes/uploadRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Debug logging to confirm route imports
console.log("[DEBUG] Loaded Routes:", {
  tenantRoutes,
  authRoutes,
  userRoutes,
  roleRoutes,
  subscriptionRoutes,
  uploadRoutes,
});

// Enable CORS
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// Middleware to parse JSON requests
app.use(express.json());



app.use(express.json()); // ✅ Handle JSON requests
app.use(express.urlencoded({ extended: true })); // ✅ Handle URL-encoded requests


// Serve static files
app.use("/uploads", express.static("uploads"));

// Debug Logging Middleware
app.use((req, res, next) => {
  console.log(`[DEBUG] Request received: ${req.method} ${req.url}`);
  next();
});

// Test Route
app.get("/", (req, res) => res.send("HRMS SaaS API is running..."));

// 🔹 **Mount Routes Properly**
app.use("/api/tenants", tenantRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes); // ✅ User routes properly mounted
app.use("/api/roles", roleRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/upload", uploadRoutes); // 🔄 Corrected mounting for uploads

// 🔹 **Check Unmatched Routes**
app.use((req, res, next) => {
  console.error(`[ERROR] Endpoint Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ message: "Endpoint Not Found" });
});

// 🔹 **Improved Error Handling**
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`, err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Connect to DB and Start Server
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error("[ERROR] Failed to connect to database:", error);
    process.exit(1);
  });