const express = require("express");
const { finalizeBill } = require("../controllers/billingController");
const { authenticate, authorizeRole } = require("../middleware/authMiddleware");

const router = express.Router();

// Receptionists finalize billing and remove prescription after payment
router.put("/finalize-bill/:patientId", authenticate, authorizeRole(["receptionist"]), finalizeBill);

module.exports = router;
