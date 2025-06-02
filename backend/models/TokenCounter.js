const mongoose = require("mongoose");

const tokenCounterSchema = new mongoose.Schema({
  lastTokenNumber: { type: Number, default: 0 } // Stores last assigned token
});

module.exports = mongoose.model("TokenCounter", tokenCounterSchema, "tokencounters");
