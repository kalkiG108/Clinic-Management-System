const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Get user profile
const getProfile = async (req, res) => {
  try {
    console.log("Looking for user with id:", req.user.id);
    const user = await User.findById(req.user.id)
      .select("-password")
      .lean();

   // console.log("Found user:", user);

    if (!user) {
      console.log("No user found with id:", req.user.id);
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Error retrieving profile", details: error.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: req.user.id } 
    });
    
    if (existingUser) {
      return res.status(400).json({ error: "Email is already in use" });
    }

    // Prepare update data
    const updateData = {
      name,
      email,
      phone,
      updatedAt: Date.now()
    };

    // If password is provided, hash it
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ 
      message: "Profile updated successfully",
      user 
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Error updating profile", details: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile
}; 