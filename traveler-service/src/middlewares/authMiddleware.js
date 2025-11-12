import jwt from "jsonwebtoken";
import Traveler from "../models/travelerModel.js";

/**
 * Middleware to protect routes with JWT authentication
 * Optionally restricts access by role
 */
export const protect = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user info from DB (Traveler for this service)
      const traveler = await Traveler.findById(decoded.id).select("-password");
      if (!traveler) {
        return res.status(404).json({ message: "Traveler not found" });
      }

      // Attach user to request
      req.user = {
        id: traveler._id,
        email: traveler.email,
        role: decoded.role || "traveler", // default traveler if not in token
      };

      // Role-based check (if roles array is provided)
      if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      next();
    } catch (err) {
      console.error("JWT validation error:", err.message);
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired, please log in again" });
      }
      return res.status(401).json({ message: "Not authorized, invalid token" });
    }
  };
};
