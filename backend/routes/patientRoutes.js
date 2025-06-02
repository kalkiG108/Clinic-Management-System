const express = require("express");
const {
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
} = require("../controllers/patientController");

const { authenticate, authorizeRole } = require("../middleware/authMiddleware");
const Patient = require("../models/Patient");

const router = express.Router();

// Both Doctors & Receptionists can view all patients
router.get("/", authenticate, authorizeRole(["doctor", "receptionist"]), getPatients);

// Doctors can view individual patient details
router.get("/:id", authenticate, authorizeRole(["doctor"]), getPatientById);

// Doctors can update patient prescriptions or records
router.put("/:id", authenticate, authorizeRole(["doctor","receptionist"]), updatePatient);

// // Only doctors can update services
// router.put("/:id/services", authenticate, authorizeRole(["doctor","receptionist"]), updatePatientServices);

// Receptionists can delete patient records if needed
router.delete("/:id", authenticate, authorizeRole(["receptionist"]), deletePatient);

// Get patient bill details
router.get("/:id/bill", authenticate, authorizeRole(["receptionist"]), async (req, res) => {
  try {
    // Fetch patient with all necessary details for billing
    const patient = await Patient.findById(req.params.id)
      .select("name aadharNo age phoneNumber services doctorName latestTokenNumber updatedAt billAmount")
      .lean();

    if (!patient) {
      return res.status(404).json({ error: "❌ Patient not found" });
    }

    res.json({
      name: patient.name,
      aadharNo: patient.aadharNo,
      age: patient.age,
      phoneNumber: patient.phoneNumber,
      services: patient.services || [],
      doctorName: patient.doctorName,
      tokenNumber: patient.latestTokenNumber,
      consultationDate: patient.updatedAt,
      billAmount: patient.billAmount
    });

  } catch (error) {
    res.status(500).json({ error: "❌ Error retrieving bill", details: error.message });
  }
});

module.exports = router;
