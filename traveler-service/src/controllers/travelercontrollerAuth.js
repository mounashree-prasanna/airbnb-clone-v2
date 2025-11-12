import Traveler from "../models/travelerModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

/**
 * POST /traveler/signup
 */
export const signupTraveler = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // check duplicates
    const existing = await Traveler.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Traveler already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const newTraveler = await Traveler.create({ name, email, password: hashed });

    res.status(201).json({
      message: "Traveler registered successfully",
      travelerId: newTraveler._id,
    });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /traveler/login
 */
export const loginTraveler = async (req, res) => {
  try {
    const { email, password } = req.body;
    const traveler = await Traveler.findOne({ email });

    if (!traveler)
      return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await traveler.matchPassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: traveler._id, email: traveler.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      traveler: { id: traveler._id, name: traveler.name, email: traveler.email },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * GET /traveler/logout  (client simply deletes JWT)
 */
export const logoutTraveler = (req, res) => {
  res.json({ message: "Logout successful (client should delete token)" });
};
