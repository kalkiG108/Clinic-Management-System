const mongoose = require("mongoose");

const patientHistorySchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
  visitDate: { type: Date, default: Date.now },
  symptoms: String,
  diagnosis: String,
  prescribedMedications: String
}, { timestamps: true });

module.exports = mongoose.model("PatientHistory", patientHistorySchema);
