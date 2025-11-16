import Traveler from "../models/travelerModel.js";
import jwt from "jsonwebtoken";

// Helper: generate JWT token
const generateToken = (traveler) => {
  return jwt.sign(
    { id: traveler._id, email: traveler.email, role: traveler.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// @desc Register new traveler
export const signupTraveler = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // ✅ Validate role
    if (role && role !== "traveler") {
      return res
        .status(403)
        .json({ message: "Access denied: traveler signup only" });
    }

    const existing = await Traveler.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already registered" });

    // Always enforce traveler role
    const traveler = new Traveler({ name, email, password, role: "traveler" });
    await traveler.save();

    const token = generateToken(traveler);

    res.status(201).json({
      message: "Traveler registered successfully",
      token,
      traveler: {
        id: traveler._id,
        name: traveler.name,
        email: traveler.email,
        role: traveler.role,
      },
    });
  } catch (error) {
    console.error("Traveler registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Login traveler
export const loginTraveler = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // ✅ Must come from traveler role toggle
    if (role && role !== "traveler") {
      return res.status(403).json({
        message: "Access denied: wrong login role (expected traveler)",
      });
    }

    const traveler = await Traveler.findOne({ email });
    if (!traveler)
      return res.status(404).json({ message: "Traveler not found" });

    // Ensure stored account belongs to traveler
    if (traveler.role !== "traveler") {
      return res.status(403).json({
        message: "Access denied: this account is not a traveler account",
      });
    }

    const isMatch = await traveler.matchPassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(traveler);

    res.json({
      message: "Traveler login successful",
      token,
      traveler: {
        id: traveler._id,
        name: traveler.name,
        email: traveler.email,
        role: traveler.role,
      },
    });
  } catch (error) {
    console.error("Traveler login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Logout traveler
export const logoutTraveler = (req, res) => {
  res.json({ message: "Traveler logged out (client deletes token)" });
};

// @desc Check traveler session
export const checkSession = async (req, res) => {
  try {
    const token =
      req.headers.authorization?.split(" ")[1] || req.cookies?.token;
    if (!token) return res.json({ isLoggedIn: false, role: null });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const traveler = await Traveler.findById(decoded.id).select("-password");
    if (!traveler) return res.json({ isLoggedIn: false, role: null });

    res.json({
      isLoggedIn: true,
      role: traveler.role,
      user: {
        id: traveler._id,
        name: traveler.name,
        email: traveler.email,
      },
    });
  } catch (err) {
    res.json({ isLoggedIn: false, role: null });
  }
};
