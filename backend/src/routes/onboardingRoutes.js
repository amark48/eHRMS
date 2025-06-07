// routes/onboardingRoutes.js
const express = require("express");
const router = express.Router();
const { saveOnboardingProgress } = require("../controllers/onboardingController");

router.post("/save-progress", saveOnboardingProgress);

module.exports = router;
