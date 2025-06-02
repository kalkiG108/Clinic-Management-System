const Patient = require("../models/Patient");
const TokenCounter = require("../models/TokenCounter");

const assignNewToken = async (req, res) => {
  try {
    const { aadharNo, name, age, phoneNumber, medicalHistory } = req.body;
    let patient = await Patient.findOne({ aadharNo });

    // If patient exists, validate the details match
    if (patient) {
      const detailsMismatch = [];
      
      if (patient.name !== name) {
        detailsMismatch.push("Name");
      }
      if (patient.age !== parseInt(age)) {
        detailsMismatch.push("Age");
      }
      if (patient.phoneNumber !== phoneNumber) {
        detailsMismatch.push("Phone Number");
      }

      if (detailsMismatch.length > 0) {
        return res.status(400).json({
          error: "Details mismatch for existing Aadhar number",
          mismatchedFields: detailsMismatch,
          existingDetails: {
            name: patient.name,
            age: patient.age,
            phoneNumber: patient.phoneNumber
          }
        });
      }
    }

    // Retrieve the last token number from TokenCounter collection
    let tokenCounter = await TokenCounter.findOne();
    if (!tokenCounter) {
      tokenCounter = new TokenCounter({ lastTokenNumber: 0 });
      await tokenCounter.save();
    }

    const newToken = tokenCounter.lastTokenNumber + 1; // Assign the next sequential token
    let isNewPatient = false;

    if (patient) {
      // Existing patient - update token and medical history
      patient.latestTokenNumber = newToken;
      // Only update medical history if new information is provided
      if (medicalHistory) {
        patient.medicalHistory = medicalHistory;
      }
      await patient.save();
    } else {
      // New patient - create entry and assign token
      patient = new Patient({ aadharNo, name, age, phoneNumber, medicalHistory, latestTokenNumber: newToken });
      await patient.save();
      isNewPatient = true;
    }

    // Update token counter in database
    tokenCounter.lastTokenNumber = newToken;
    await tokenCounter.save();

    res.json({ 
      message: isNewPatient ? "New patient registered successfully!" : "Token updated for existing patient!",
      patient,
      isNewPatient 
    });

  } catch (error) {
    res.status(500).json({ error: "Error assigning token", details: error.message });
  }
};

module.exports = { assignNewToken };
