const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// Mock OTP storage (Use a database for production)
const otpStorage = {};

const sendMail = require("../utils/sendMail"); // Import sendMail utility

const sendOTP = async (req, res) => {
    try {
        const { doctorId, receptionistId, email } = req.body;

        let user = null;
        if (doctorId) {
            user = await User.findOne({ doctorId, email });
        } else if (receptionistId) {
            user = await User.findOne({ receptionistId, email });
        } else {
            return res.status(400).json({ success: false, error: "Your respective ID is required!" });
        }

        if (!user) return res.status(400).json({ success: false, error: "Invalid credentials!" });

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000);
        otpStorage[email] = otp;

        // Send OTP via Email
        await sendMail(email, "Your OTP Code", `Your OTP is: ${otp}. It will expire in 10 minutes.`);

        console.log(`OTP for ${email}: ${otp}`); // Debugging

        res.json({ success: true, message: "OTP sent successfully!" });
    } catch (error) {
        console.error("❌ Error sending OTP:", error.message);
        res.status(500).json({ error: "Error sending OTP", details: error.message });
    }
};



// Login Function
const login = async (req, res) => {
    try {
        const { email, password, otp, rememberMe } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid password" });

        if (!otpStorage[email] || otpStorage[email] != otp) {
            return res.status(400).json({ error: "Invalid OTP. Please request a new one." });
        }
        delete otpStorage[email];

        const tokenOptions = rememberMe ? { expiresIn: "7d" } : { expiresIn: "1h" }; // Longer session for "Remember Me"
        console.log('Creating token with payload:', { id: user._id, role: user.role, name: user.name }); // Debug log
        console.log('Using JWT_SECRET:', process.env.JWT_SECRET); // Debug log
        const token = jwt.sign(
          { id: user._id, role: user.role, name: user.name },
          process.env.JWT_SECRET,
          tokenOptions
        );
        console.log('Generated token:', token); // Debug log

        res.json({ message: "Login successful!", token, role: user.role });
    } catch (error) {
        res.status(500).json({ error: "Login error", details: error.message });
    }
};



const signup = async (req, res) => {
    try {
        const { name, email, phone, password, role, doctorId, receptionistId } = req.body;

        // Ensure doctorId or receptionistId exists based on role
        if (role === "doctor" && !doctorId) return res.status(400).json({ error: "Doctor ID is required!" });
        if (role === "receptionist" && !receptionistId) return res.status(400).json({ error: "Receptionist ID is required!" });

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "User already registered!" });

        // Create new user
        const newUser = new User({ name, email, phone, password, role, doctorId, receptionistId });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Signup error", details: error.message });
    } 
};

module.exports = { login, signup, sendOTP};
