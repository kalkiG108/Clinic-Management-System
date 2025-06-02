const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String, required: true }, // For OTP verification
  password: { type: String, required: true },
  role: { type: String, enum: ["doctor", "receptionist"], required: true },
  
  // Doctor & Receptionist ID (based on role)
  doctorId: { type: String, unique: true, sparse: true }, // Only required for doctors
  receptionistId: { type: String, unique: true, sparse: true }, // Only required for receptionists
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'users' }); // Explicitly set collection name

// Hash password before saving user
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model("User", userSchema);
