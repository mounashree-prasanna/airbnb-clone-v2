const Owner = require("../models/Owner");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Helper: generate token
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
    const { name, email, password, phone, role } = req.body;

    // ✅ Role validation (only owner role allowed)
    if (role && role !== "owner") {
      return res.status(403).json({
        message: "Access denied: only owner signup allowed",
      });
    }

    // ✅ Check if email already exists
    const existing = await Owner.findOne({ email });
    if (existing)
      return res
        .status(400)
        .json({ message: "Email already registered. Please log in." });

    // ✅ Use .save() to ensure pre('save') hook hashes the password
    const owner = new Owner({ name, email, password, phone, role: "owner" });
    await owner.save();

    const token = generateToken(owner);

    res.status(201).json({
      message: "Owner registered successfully",
      token,
      owner: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        role: owner.role,
      },
    });
  } catch (error) {
    console.error("Owner registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Login owner
exports.loginOwner = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // ✅ Role validation (frontend toggle must send "owner")
    if (role && role !== "owner") {
      return res.status(403).json({
        message: "Access denied: wrong login role (expected owner)",
      });
    }

    // ✅ Find the owner by email
    const owner = await Owner.findOne({ email });
    if (!owner)
      return res.status(404).json({ message: "Owner not found" });

    // ✅ Validate role stored in DB
    if (owner.role !== "owner") {
      return res.status(403).json({
        message: "Access denied: this account is not an owner account",
      });
    }

    // ✅ Compare entered password with hashed password
    const isMatch = await bcrypt.compare(password, owner.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(owner);

    res.json({
      message: "Owner login successful",
      token,
      owner: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        role: owner.role,
      },
    });
  } catch (error) {
    console.error("Owner login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Get owner profile
exports.getOwnerProfile = async (req, res) => {
  try {
    const owner = await Owner.findById(req.user.id).select("-password");
    if (!owner)
      return res.status(404).json({ message: "Owner not found" });

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
    const owner = await Owner.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    }).select("-password");

    res.json({
      message: "Profile updated successfully",
      owner,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
