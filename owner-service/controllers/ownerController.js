// src/controllers/ownerController.js
const Owner = require("../models/Owner");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// helper: generate token
const generateToken = (owner) => {
  return jwt.sign(
    { id: owner._id, email: owner.email, role: owner.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// @desc Register new owner
exports.registerOwner = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const existing = await Owner.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const owner = await Owner.create({ name, email, password, phone });
    const token = generateToken(owner);
    res.status(201).json({ token, owner });
  } catch (error) {
    console.error("Owner registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Login owner
exports.loginOwner = async (req, res) => {
  try {
    const { email, password } = req.body;
    const owner = await Owner.findOne({ email });
    if (!owner) return res.status(404).json({ message: "Owner not found" });

    const isMatch = await bcrypt.compare(password, owner.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(owner);
    res.json({ token, owner });
  } catch (error) {
    console.error("Owner login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Get owner profile
exports.getOwnerProfile = async (req, res) => {
  try {
    const owner = await Owner.findById(req.user.id).select("-password");
    if (!owner) return res.status(404).json({ message: "Owner not found" });
    res.json(owner);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Update owner profile
exports.updateOwnerProfile = async (req, res) => {
  try {
    const updates = req.body;
    const owner = await Owner.findByIdAndUpdate(req.user.id, updates, { new: true }).select("-password");
    res.json({ message: "Profile updated successfully", owner });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
