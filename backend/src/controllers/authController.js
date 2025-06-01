// backend/src/controllers/authController.js
require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const crypto = require("crypto");
const transporter = require("../config/mail");

// Import models.
const User = require("../models/User");
const Tenant = require("../models/Tenant");
const Role = require("../models/Role");

// In-memory OTP store for EMAIL and SMS MFA (for demo purposes)
const otpStore = {};

// Utility function to send OTP code via email.
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER, // Your email user defined in .env
    to: email,
    subject: "Your OTP Code",
    text: `Use this code to verify your login: ${otp}`,
  };
  await transporter.sendMail(mailOptions);
};

// POST /api/auth/login
// Expects: { email, password, companyID }
// The final response returns full user details (including role) and a JWT token.
const loginUser = asyncHandler(async (req, res) => {
  const { email, password, companyID } = req.body;
  console.log("----- LOGIN REQUEST RECEIVED -----");
  console.log("Request Body:", req.body);
  if (!companyID) {
    res.status(400);
    throw new Error("companyID is required for multi-tenancy login");
  }

  // Look up the user by email and tenantId (companyID)
  const user = await User.findOne({ where: { email, tenantId: companyID } });
  if (!user) {
    console.log("User not found for email:", email);
    res.status(404);
    throw new Error("User not found");
  }
  console.log("User Found:", user.toJSON());

  // Verify the password.
  const isMatch = await bcrypt.compare(password, user.password);
  console.log(`Password match for ${email}:`, isMatch);
  if (!isMatch) {
    console.log("Invalid credentials for email:", email);
    res.status(401);
    throw new Error("Invalid credentials");
  }

  // MFA enabled process.
  if (user.mfaEnabled) {
    console.log("MFA is enabled for user:", email);
    // Process mfaType:
    let mfaTypeValue = user.mfaType;
    console.log("Original mfaType value:", mfaTypeValue, "Type:", typeof mfaTypeValue);
    if (Array.isArray(mfaTypeValue)) {
      mfaTypeValue = mfaTypeValue[0];
      console.log("Converted mfaType from array to string:", mfaTypeValue, "Type:", typeof mfaTypeValue);
    }
    if (typeof mfaTypeValue === "string") {
      mfaTypeValue = mfaTypeValue.trim().toUpperCase();
      console.log("Trimmed and uppercased mfaTypeValue:", mfaTypeValue);
    }
    console.log("Final mfaTypeValue:", mfaTypeValue);
    // If MFA method is not configured by the user, fetch allowed methods from the tenant.
    if (!mfaTypeValue) {
      console.log("User has not configured an MFA method. Fetching tenant allowed MFA types.");
      const tenant = await Tenant.findByPk(companyID, { include: { association: "enabledMfaTypes" } });
      if (!tenant) {
        console.log("Tenant not found for companyID:", companyID);
        res.status(404);
        throw new Error("Tenant not found for MFA configuration.");
      }
      const allowedMfaTypes = tenant.enabledMfaTypes.map((mfa) => mfa.name);
      console.log("Tenant allowed MFA types:", allowedMfaTypes);
      const tempToken = jwt.sign(
        { id: user.id, email: user.email, companyID: user.tenantId, mfa: true },
        process.env.JWT_SECRET,
        { expiresIn: "10m" }
      );
      return res.status(200).json({ mfaRequired: true, message: "MFA is required. Please select your preferred method from allowed options.", tempToken, allowedMfaTypes });
    }

    // MFA via TOTP (e.g., authenticator apps)
    if (mfaTypeValue === "TOTP") {
      console.log("MFA Type: TOTP (Google/Microsoft Authenticator)");
      const tempToken = jwt.sign(
        { id: user.id, email: user.email, companyID: user.tenantId, mfa: true },
        process.env.JWT_SECRET,
        { expiresIn: "10m" }
      );
      return res.status(200).json({ mfaRequired: true, message: "MFA verification is required (use your authenticator app).", tempToken, mfaType: mfaTypeValue });
    }
    // For EMAIL or SMS MFA.
    else if (mfaTypeValue === "EMAIL" || mfaTypeValue === "SMS") {
      console.log(`MFA Type: ${mfaTypeValue} - Sending OTP code.`);
      // Generate a 6-digit OTP.
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log("Generated OTP:", otpCode);
      // Set OTP expiration time (10 minutes from now).
      const otpExpires = new Date();
      otpExpires.setMinutes(otpExpires.getMinutes() + 10);
      // Update OTP related fields.
      user.otp = otpCode;
      user.otpExpires = otpExpires;
      user.otpAttempts = 0;
      await user.save();
      console.log("OTP fields updated:", user.toJSON());
      const tempToken = jwt.sign(
        { id: user.id, email: user.email, companyID: user.tenantId, mfa: true },
        process.env.JWT_SECRET,
        { expiresIn: "10m" }
      );
      return res.status(200).json({ mfaRequired: true, message: `MFA is enabled. An OTP has been sent to your ${mfaTypeValue === "EMAIL" ? "email" : "phone"}.`, tempToken, mfaType: mfaTypeValue });
    } else {
      res.status(400);
      throw new Error("Unsupported MFA type: " + mfaTypeValue);
    }
  }

  // No MFA enabled: retrieve full user information including associated role.
  const userWithRole = await User.findByPk(user.id, {
    include: [{ model: Role, as: "role", attributes: ["id", "name", "permissions"] }],
  });
  // Issue JWT token.
  const token = jwt.sign(
    { id: user.id, email: user.email, companyID: user.tenantId },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
  console.log("Final JWT token issued for user:", email);

  // Return full user details.
  res.status(200).json({
    user: {
      id: userWithRole.id,
      name: `${userWithRole.firstName} ${userWithRole.lastName}`,
      email: userWithRole.email,
      tenantId: userWithRole.tenantId,
      role: userWithRole.role, // Full role details included
      avatar: userWithRole.avatar,
      mfaEnabled: userWithRole.mfaEnabled,
    },
    token,
  });
});

// POST /api/auth/request-mfa-code
const requestMfaCode = asyncHandler(async (req, res) => {
  console.log("----- MFA CODE REQUEST RECEIVED -----");
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("No temporary token provided");
  }
  const tempToken = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    console.log("Decoded temporary token in requestMfaCode:", decoded);
  } catch (err) {
    res.status(401);
    throw new Error("Invalid or expired temporary token");
  }
  if (!decoded.mfa) {
    res.status(400);
    throw new Error("Token does not require MFA verification");
  }
  // Find the user.
  const user = await User.findByPk(decoded.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  // Normalize the stored MFA type.
  let normalizedMfaType = "";
  if (user.mfaType) {
    if (Array.isArray(user.mfaType)) {
      normalizedMfaType = user.mfaType[0];
    } else {
      normalizedMfaType = user.mfaType.toString();
    }
    normalizedMfaType = normalizedMfaType.trim().toUpperCase();
  }
  
  // For EMAIL or SMS MFA.
  if (normalizedMfaType === "EMAIL" || normalizedMfaType === "SMS") {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[user.id] = { code: otp, expires: Date.now() + 5 * 60 * 1000 };
    if (normalizedMfaType === "EMAIL") {
      console.log(`Sending OTP to email ${user.email}: ${otp}`);
      await sendOTPEmail(user.email, otp);
    } else {
      console.log(`Sending OTP via SMS for user ${user.email}: ${otp}`);
      // TODO: Integrate with SMS service in production.
    }
    return res.status(200).json({ message: `OTP has been sent to your ${normalizedMfaType === "EMAIL" ? "email" : "phone"}.` });
  } else {
    res.status(400);
    throw new Error("MFA type does not require an external OTP request");
  }
});


// POST /api/auth/verify-mfa
const verifyMfa = asyncHandler(async (req, res) => {
  const { code } = req.body;
  console.log("----- MFA VERIFICATION REQUEST RECEIVED -----");
  console.log("Received code:", code);
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("No temporary token provided");
  }
  const tempToken = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    console.log("Decoded temporary token in verifyMfa:", decoded);
  } catch (err) {
    res.status(401);
    throw new Error("Invalid or expired temporary token");
  }
  if (!decoded.mfa) {
    res.status(400);
    throw new Error("The provided token does not require MFA verification");
  }
  
  // Find the corresponding user.
  const user = await User.findByPk(decoded.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  console.log("Verifying MFA for user:", user.email);

  // Normalize user.mfaType to ensure proper comparisons.
  let normalizedMfaType = "";
  if (user.mfaType) {
    if (Array.isArray(user.mfaType)) {
      normalizedMfaType = user.mfaType[0];
    } else {
      normalizedMfaType = user.mfaType.toString();
    }
    normalizedMfaType = normalizedMfaType.trim().toUpperCase();
  }
  
  // For TOTP verification.
  if (normalizedMfaType === "TOTP") {
    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: "base32",
      token: code,
    });
    console.log("TOTP verification result:", isValid);
    if (!isValid) {
      res.status(401);
      throw new Error("Invalid MFA code");
    }
  }
  // For EMAIL or SMS OTP verification.
  else if (normalizedMfaType === "EMAIL" || normalizedMfaType === "SMS") {
    console.log(`Verifying OTP for ${normalizedMfaType}`);
    const otpEntry = otpStore[user.id];
    if (!otpEntry) {
      res.status(401);
      throw new Error("OTP not generated or expired");
    }
    if (Date.now() > otpEntry.expires) {
      delete otpStore[user.id];
      res.status(401);
      throw new Error("OTP expired");
    }
    console.log(`Stored OTP: ${otpEntry.code}, Received: ${code}`);
    if (code !== otpEntry.code) {
      res.status(401);
      throw new Error("Invalid OTP code");
    }
    // Remove OTP entry after successful verification.
    delete otpStore[user.id];
  } else {
    res.status(400);
    throw new Error("Unsupported MFA type for verification");
  }
  // MFA verified: issue final JWT token.
  const token = jwt.sign(
    { id: user.id, email: user.email, companyID: user.tenantId },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
  console.log("MFA verified, final token issued for user:", user.email);
  res.status(200).json({
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    token,
  });
});


// POST /api/auth/setup-totp
const setupTotp = asyncHandler(async (req, res) => {
  // Assume req.user is populated by a protect middleware.
  const { id, email, companyID } = req.user;
  console.log(`Setting up TOTP for user: ${email}, Company: ${companyID}`);
  const secret = speakeasy.generateSecret({ name: `HRMS-SaaS (${email})` });
  await User.update(
    { totpSecret: secret.base32 },
    { where: { id, tenantId: companyID } }
  );
  const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url);
  res.status(200).json({
    message: "TOTP secret generated successfully",
    totpSecret: secret.base32, // Remove in production if sensitive.
    otpauthUrl: secret.otpauth_url,
    qrCodeDataURL,
  });
});

module.exports = { loginUser, requestMfaCode, verifyMfa, setupTotp };
