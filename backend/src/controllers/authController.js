// controllers/authController.js

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const speakeasy = require("speakeasy"); // For TOTP (Google/Microsoft Authenticator)
const qrcode = require("qrcode");
const crypto = require("crypto");
const transporter = require("../config/mail"); // Import transporter from config/mail.js
const User = require("../models/User");
const Tenant = require("../models/Tenant"); // Added to fetch tenant MFA configuration

// In-memory OTP store for EMAIL and SMS MFA (for demo purposes)
const otpStore = {};

// Utility function to send OTP code via email using the imported transporter.
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

    // If MFA method is not configured by the user, fetch the tenant's allowed MFA types.
    if (!user.mfaType) {
      console.log("User has not configured an MFA method. Fetching tenant allowed MFA types.");
      const tenant = await Tenant.findByPk(companyID, {
        include: { association: "enabledMfaTypes" },
      });
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
      return res.status(200).json({
        mfaRequired: true,
        message: "MFA is required. Please select your preferred method from allowed options.",
        tempToken,
        allowedMfaTypes,
      });
    }

    // MFA via TOTP (e.g., Google/Microsoft Authenticator)
    if (user.mfaType === "TOTP") {
      console.log("MFA Type: TOTP (Google/Microsoft Authenticator)");
      const tempToken = jwt.sign(
        { id: user.id, email: user.email, companyID: user.tenantId, mfa: true },
        process.env.JWT_SECRET,
        { expiresIn: "10m" }
      );
      return res.status(200).json({
        mfaRequired: true,
        message: "MFA verification is required (use your authenticator app).",
        tempToken,
        mfaType: user.mfaType,
      });
    } else if (user.mfaType === "EMAIL" || user.mfaType === "SMS") {
      console.log(`MFA Type: ${user.mfaType} - Sending OTP code.`);

      // Generate a 6-digit OTP.
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log("Generated OTP:", otpCode);

      // Set OTP expiration time (e.g., 10 minutes from now).
      const otpExpires = new Date();
      otpExpires.setMinutes(otpExpires.getMinutes() + 10);

      // Update the OTP related fields and reset otpAttempts.
      user.otp = otpCode;
      user.otpExpires = otpExpires;
      user.otpAttempts = 0;
      await user.save();
      console.log("OTP fields updated:", user.toJSON());

      // Optionally: Call your email/SMS service to send the OTP.

      const tempToken = jwt.sign(
        { id: user.id, email: user.email, companyID: user.tenantId, mfa: true },
        process.env.JWT_SECRET,
        { expiresIn: "10m" }
      );
      return res.status(200).json({
        mfaRequired: true,
        message: `MFA is enabled. An OTP has been sent to your ${user.mfaType === "EMAIL" ? "email" : "phone"}.`,
        tempToken,
        mfaType: user.mfaType,
      });
    } else {
      res.status(400);
      throw new Error("Unsupported MFA type");
    }
  }

  // If MFA is not enabled, issue the final token.
  const token = jwt.sign(
    { id: user.id, email: user.email, companyID: user.tenantId },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
  console.log("Final JWT token issued for user:", email);
  res.status(200).json({
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    token,
  });
});

module.exports = { loginUser };


// POST /api/auth/request-mfa-code
// For EMAIL/SMS MFA flows; must be called after login.
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
  // Only for EMAIL or SMS MFA.
  if (user.mfaType === "EMAIL" || user.mfaType === "SMS") {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[user.id] = { code: otp, expires: Date.now() + 5 * 60 * 1000 };
    if (user.mfaType === "EMAIL") {
      console.log(`Sending OTP to email ${user.email}: ${otp}`);
      await sendOTPEmail(user.email, otp);
    } else {
      console.log(`Sending OTP via SMS for user ${user.email}: ${otp}`);
      // TODO: Integrate with an SMS service (e.g., Twilio) in production.
    }
    return res.status(200).json({
      message: `OTP has been sent to your ${user.mfaType === "EMAIL" ? "email" : "phone"}.`,
    });
  } else {
    res.status(400);
    throw new Error("MFA type does not require an external OTP request");
  }
});

// POST /api/auth/verify-mfa
// Verifies the provided OTP or TOTP code.
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

  // For TOTP (authenticator apps).
  if (user.mfaType === "TOTP") {
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
  // For EMAIL or SMS, validate the OTP stored in-memory.
  else if (user.mfaType === "EMAIL" || user.mfaType === "SMS") {
    console.log(`Verifying OTP for ${user.mfaType}`);
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
    // Remove the OTP entry after successful verification.
    delete otpStore[user.id];
  } else {
    res.status(400);
    throw new Error("Unsupported MFA type for verification");
  }

  // MFA verified: Issue the final JWT token.
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
// Generates a TOTP secret for the authenticated user, stores it, and returns a QR code.
const setupTotp = asyncHandler(async (req, res) => {
  // Assume req.user is populated by the protect middleware.
  // The req.user object has { id, email, companyID }.
  const { id, email, companyID } = req.user;
  console.log(`Setting up TOTP for user: ${email}, Company: ${companyID}`);

  // Generate a new TOTP secret.
  const secret = speakeasy.generateSecret({
    name: `HRMS-SaaS (${email})`,
  });

  // Update the user's totpSecret with company isolation.
  // Note: the User model is expected to store tenant affiliation in the "tenantId" column.
  await User.update(
    { totpSecret: secret.base32 },
    { where: { id, tenantId: companyID } }
  );

  // Generate a QR code data URL from the otpauth URL.
  const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url);

  // Return the generated TOTP details.
  res.status(200).json({
    message: "TOTP secret generated successfully",
    totpSecret: secret.base32,   // Consider removing this in production if sensitive.
    otpauthUrl: secret.otpauth_url,
    qrCodeDataURL,               // Display this QR code in the front end for scanning.
  });
});

module.exports = { loginUser, requestMfaCode, verifyMfa, setupTotp };