const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  aadharNo: { type: String, required: true, unique: true }, // Unique patient identifier
  name: String,
  age: Number,
  phoneNumber: { type: String, required: true }, // Added phone number
  medicalHistory: String,  
  latestTokenNumber: Number, 
  services: [{ type: String }], 
  billAmount: { type: Number, default: 0 },
  doctorName: { type: String, default: null } // Added doctor name field
}, { timestamps: true });

module.exports = mongoose.model("Patient", patientSchema);
