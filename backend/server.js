const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db"); // Import MongoDB connection

const authRoutes = require("./routes/authRoutes");
const tokenRoutes = require("./routes/tokenRoutes");
const patientRoutes = require("./routes/patientRoutes");
const patientHistoryRoutes = require("./routes/patientHistoryRoutes");
const billingRoutes = require("./routes/billingRoutes");
const TokenCounter = require("./models/TokenCounter");
const userRoutes = require("./routes/userRoutes");

dotenv.config(); // Load environment variables

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));


// Connect to MongoDB
connectDB();

// Serve static files from `../frontend/public` (go up one level)
app.use(express.static(path.join(__dirname, "../frontend/public")));

// Set EJS as the templating engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend/views")); // Go up one level

// Frontend Routes
app.get("/", (req, res) => {
    res.render("index", { clinicName: "HealthCare Plus Clinic" });
});

// Protected routes that require authentication
const { authenticate } = require("./middleware/authMiddleware");

app.get("/profile", (req, res) => {
    res.render("profile");
});

app.get("/doctorprofile", (req, res) => {
  res.render("doctorprofile");
});


// Load Routes
app.use("/auth", authRoutes);
app.use("/tokens", tokenRoutes);
app.use("/patients", patientRoutes);
app.use("/history", patientHistoryRoutes);
app.use("/billing", billingRoutes);
app.use("/users", userRoutes);



// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Ensure TokenCounter exists on startup
const initializeTokenCounter = async () => {
  try {
    let tokenCounter = await TokenCounter.findOne();
    if (!tokenCounter) {
      await new TokenCounter({ lastTokenNumber: 0 }).save();
      console.log("✅ Token Counter initialized!");
    }
  } catch (error) {
    console.error("❌ Error initializing token counter:", error);
  }
};

initializeTokenCounter();

