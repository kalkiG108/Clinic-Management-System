const Patient = require("../models/Patient");

const finalizeBill = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Update patient record and set unnecessary fields to null after billing
    const updatedPatient = await Patient.findByIdAndUpdate(patientId, { 
      $unset: { 
         
        services: 1, 
        billAmount: 1 
      } 
    }, { new: true });

    if (!updatedPatient) {
      return res.status(404).json({ error: "❌ Patient not found" });
    }

    res.json({ message: "✅ Bill finalized - cleared unnecessary records!", patient: updatedPatient });

  } catch (error) {
    res.status(500).json({ error: "❌ Error finalizing bill", details: error.message });
  }
};

module.exports = { finalizeBill };
