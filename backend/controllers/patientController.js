const Patient = require("../models/Patient");
const PatientHistory = require("../models/PatientHistory");



// Get all patients
const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: "❌ Error retrieving patients", details: error.message });
  }
};

// Get a single patient by ID
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: "❌ Patient not found" });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: "❌ Error retrieving patient", details: error.message });
  }
};

// Update patient details
const updatePatient = async (req, res) => {
  try {
    const updatedPatient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedPatient) {
      return res.status(404).json({ error: "❌ Patient not found" });
    }
    res.json({ message: "✅ Patient updated successfully!", patient: updatedPatient });
  } catch (error) {
    res.status(500).json({ error: "❌ Error updating patient", details: error.message });
  }
};

// Delete a patient record
const deletePatient = async (req, res) => {
  try {
    const deletedPatient = await Patient.findByIdAndDelete(req.params.id);
    if (!deletedPatient) {
      return res.status(404).json({ error: "❌ Patient not found" });
    }
    res.json({ message: "✅ Patient deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: "❌ Error deleting patient", details: error.message });
  }
};

// const updatePatientServices = async (req, res) => {
//   try {
//     const { services } = req.body;
//     const serviceCosts = { "Consultation": 500, "X-ray": 1000, "Blood Test": 800 };

//     let totalBill = 0;
//     services.forEach(service => {
//       totalBill += serviceCosts[service] || 0;
//     });

//     const updatedPatient = await Patient.findByIdAndUpdate(req.params.id, {
//       services,
//       billAmount: totalBill
//     }, { new: true });

//     res.json({ message: "✅ Services updated successfully!", patient: updatedPatient });
//   } catch (error) {
//     res.status(500).json({ error: "❌ Error updating services", details: error.message });
//   }
// };


// Export the functions to use in patientRoutes.js
module.exports = {

  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
 
};
