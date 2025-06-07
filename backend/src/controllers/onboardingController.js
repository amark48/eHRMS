// controllers/onboardingController.js
const { Tenant } = require("../models");

const saveOnboardingProgress = async (req, res) => {
  try {
    console.log("Incoming update request body:", req.body);
    // Expect the request body to have the updated fields from the wizard.
    const { tenantId, name, companyStreet, companyCity, companyState, companyZip, companyCountry } = req.body;
    
    // Validate that we have the tenantId
    if (!tenantId) {
      return res.status(400).json({ message: "Missing tenant id." });
    }
    
    // Update the tenant record with the latest onboarding progress.
    // (Adjust the fields being updated as needed.)
    const tenant = await Tenant.update(
      {
        name, // Company name updated
        // Optionally, you might store partial address info in a separate OnboardingProgress column,
        // or—in our case—leave them to be handled via a separate Address record.
      },
      { where: { id: tenantId } }
    );
    
    // Return success response.
    return res.status(200).json({ message: "Onboarding progress saved successfully." });
  } catch (error) {
    console.error("Error saving onboarding progress:", error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { saveOnboardingProgress };
