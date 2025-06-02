const express = require("express");
const { login, signup, sendOTP } = require("../controllers/authController");
const { authenticate, authorizeRole } = require("../middleware/authMiddleware");

const router = express.Router();

// Render login pages for doctors and receptionists
router.get("/logindoctor", (req, res) => {
    res.render("logindoctor");
});

router.get("/loginreceptionist", (req, res) => {
    res.render("loginreceptionist");
});

// Handle login with OTP verification
router.post("/login", login);
router.post("/send-otp", sendOTP);
router.post("/signup", signup);

// Render dashboard pages (no authentication here - frontend will handle auth)
router.get("/receptionist-dashboard", (req, res) => {
    res.render("receptionistdashboard");
});

router.get("/doctor-dashboard", (req, res) => {
    res.render("doctordashboard");
});

// Protected API routes
router.get("/receptionist-info", authenticate, authorizeRole(["receptionist"]), (req, res) => {
    res.json({ receptionistName: req.user.name });
});

router.get("/doctor-info", authenticate, authorizeRole(["doctor"]), (req, res) => {
    res.json({ doctorName: req.user.name });
});

module.exports = router;
