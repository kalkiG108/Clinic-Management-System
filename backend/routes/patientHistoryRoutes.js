const express = require("express");
const {finishConsultation, getPatientHistory } = require("../controllers/patientHistoryController");
const { authenticate, authorizeRole } = require("../middleware/authMiddleware");
const Patient = require("../models/Patient");
const PatientHistory = require("../models/PatientHistory");

const router = express.Router();

// // Doctors add a patient's visit history
// router.post("/add", authenticate, authorizeRole(["doctor"]), addPatientHistory);

// Doctors view a patient's full visit history
router.get("/:id", authenticate, authorizeRole(["doctor"]), getPatientHistory);

// Doctors finish consultation and update patient history
router.put("/:id/finish-consultation", authenticate, authorizeRole(["doctor"]), finishConsultation);

// Receptionist can generate a prescription report for printing
router.get("/:id/prescription-report", authenticate, authorizeRole(["receptionist"]), async (req, res) => {
  try {
    // Retrieve the most recent visit history for the patient
    const history = await PatientHistory.findOne({ patientId: req.params.id })
      .sort({ visitDate: -1 }) // Get the latest visit first

    if (!history) {
      return res.status(404).json({ error: "❌ No prescription record found for this patient" });
    }

    // Fetch the patient's basic details
    const patient = await Patient.findById(req.params.id, "name age phoneNumber doctorName");

    if (!patient) {
      return res.status(404).json({ error: "❌ Patient not found" });
    }

    res.json({
      name: patient.name,
      age: patient.age,
      phoneNumber: patient.phoneNumber,
      visitDate: history.visitDate,
      symptoms: history.symptoms,
      diagnosis: history.diagnosis,
      prescribedMedications: history.prescribedMedications,
      doctorName: patient.doctorName || 'Not Specified'
    });

  } catch (error) {
    res.status(500).json({ error: "❌ Error generating prescription report", details: error.message });
  }
});

module.exports = router;
