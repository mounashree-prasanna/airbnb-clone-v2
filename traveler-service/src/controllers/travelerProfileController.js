import Traveler from "../models/travelerModel.js";
import jwt from "jsonwebtoken";

export const getTravelerProfile = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Missing token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const traveler = await Traveler.findById(decoded.id).select("-password");
    res.json(traveler);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
