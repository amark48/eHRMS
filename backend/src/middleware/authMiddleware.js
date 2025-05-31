const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { User, Role } = require("../models");


// Middleware to protect routes – verifies JWT token and retrieves user data
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("[DEBUG protect] Decoded token:", decoded);

      req.user = await User.findOne({
        where: { id: decoded.id },
        attributes: { exclude: ["password"] },
      });

      if (!req.user) {
        res.status(401);
        throw new Error("User not found, authorization failed");
      }

      console.log("[DEBUG protect] User authenticated:", req.user.toJSON());
      next();
    } catch (error) {
      console.error("[ERROR protect] Invalid token:", error.message);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    console.error("[ERROR protect] Missing token in request headers");
    res.status(401).json({ message: "Not authorized, token not found" });
  }
});

// Middleware to check permitted roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    console.log("[DEBUG authorizeRoles] Checking roles for user.");
    if (!req.user) {
      console.error("[ERROR authorizeRoles] No user found in request, role verification aborted.");
      res.status(403).json({ message: "You do not have permission to perform this action" });
      return;
    }

    console.log("[DEBUG authorizeRoles] User role:", req.user.role);
    if (!roles.includes(req.user.role)) {
      console.error(`[ERROR authorizeRoles] Role '${req.user.role}' is not authorized. Required roles: ${roles.join(", ")}`);
      res.status(403).json({ message: "You do not have permission to perform this action" });
      return;
    }

    console.log("[DEBUG authorizeRoles] Role check passed for:", req.user.role);
    next();
  };
};

// Middleware to restrict access to admin users
// Middleware to restrict access based on role & tenant isolation
const adminOnly = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  // Fetch the requesting user's role and tenant
  const user = await User.findByPk(req.user.id, { include: [{ model: Role, as: "role" }] });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  console.log("[DEBUG adminOnly] User role:", user.role?.name);
  console.log("[DEBUG adminOnly] Requesting tenant:", user.tenantId);

  if (user.role?.name === "SuperAdmin") {
    // ✅ SuperAdmin can modify any tenant
    next();
  } else if (user.role?.name === "Admin") {
    // 🔒 Enforce tenant isolation for Admins
    const targetUser = await User.findByPk(req.params.id);
    
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }

    console.log("[DEBUG adminOnly] Target user's tenant:", targetUser.tenantId);

    if (targetUser.tenantId === user.tenantId) {
      // ✅ Admin can modify users within their own tenant
      next();
    } else {
      console.error("[ERROR adminOnly] Tenant isolation violation - Admin tried modifying another tenant.");
      return res.status(403).json({ message: "Admins can only modify users within their assigned tenant." });
    }
  } else {
    console.error("[ERROR adminOnly] Access denied - Only Admins and SuperAdmins allowed.");
    return res.status(403).json({ message: "Access restricted to Admins and SuperAdmins only." });
  }
});



module.exports = { protect, authorizeRoles, adminOnly };