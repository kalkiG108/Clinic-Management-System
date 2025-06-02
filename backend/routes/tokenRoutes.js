const express = require("express");
const { assignNewToken } = require("../controllers/tokenController");
const { authenticate, authorizeRole } = require("../middleware/authMiddleware");

const router = express.Router();
router.post("/assign-token", authenticate, authorizeRole(["receptionist"]), assignNewToken);

module.exports = router;
