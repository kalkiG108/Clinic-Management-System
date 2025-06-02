const PatientHistory = require("../models/PatientHistory");
const Patient = require("../models/Patient");

// // Add a new visit history (Doctor)
// const addPatientHistory = async (req, res) => {
//   try {
//     const { patientId, symptoms, diagnosis, prescribedMedications } = req.body;

//     // Check if the patient exists
//     const existingPatient = await Patient.findById(patientId);
//     if (!existingPatient) {
//       return res.status(404).json({ error: "❌ Patient not found" });
//     }

//     // Create a new visit record in PatientHistory
//     const newHistory = new PatientHistory({
//       patientId,
//       symptoms,
//       diagnosis,
//       prescribedMedications,
//     });

//     await newHistory.save();
//     res.status(201).json({ message: "✅ Patient history recorded successfully!", history: newHistory });
//   } catch (error) {
//     res.status(500).json({ error: "❌ Error saving patient history", details: error.message });
//   }
// };

// Get all visit history for a patient (Doctor)
const getPatientHistory = async (req, res) => {
  try {
    const history = await PatientHistory.find({ patientId: req.params.id }).sort({ visitDate: -1 });

    if (history.length === 0) {
      return res.status(404).json({ error: "❌ No visit history found for this patient" });
    }

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "❌ Error retrieving patient history", details: error.message });
  }
};

const finishConsultation = async (req, res) => {
  try {
    const { services, symptoms, diagnosis, prescribedMedications } = req.body;
    const serviceCosts = { "Consultation": 500, "X-ray": 1000, "Blood Test": 800 };

    let totalBill = 0;
    services.forEach(service => {
      totalBill += serviceCosts[service] || 0;
    });

    // Update patient record (Services, Bill amount & Doctor name)
    const updatedPatient = await Patient.findByIdAndUpdate(req.params.id, {
      services,
      billAmount: totalBill,
      latestTokenNumber: 0, // Set token to 0 after consultation
      doctorName: req.user.name // Add doctor's name from the authenticated user
    }, { new: true });

    if (!updatedPatient) {
      return res.status(404).json({ error: "❌ Patient not found" });
    }

    // Record history in `PatientHistory`
    const newHistory = new PatientHistory({
      patientId: req.params.id,
      visitDate: new Date(),
      symptoms,
      diagnosis,
      prescribedMedications,
    });

    await newHistory.save();

    res.json({ message: "✅ Consultation finished, history recorded!", patient: updatedPatient });

  } catch (error) {
    res.status(500).json({ error: "❌ Error finishing consultation", details: error.message });
  }
};

module.exports = { finishConsultation, getPatientHistory };
