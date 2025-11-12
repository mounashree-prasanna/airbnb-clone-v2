import jwt from "jsonwebtoken";

/**
 * Middleware to protect routes using JWT authentication.
 * Optionally restricts access based on allowed roles.
 *
 * @param {Array} roles - Array of allowed roles (e.g., ["traveler", "owner"])
 */
export const protect = (roles = []) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // attach user info to request
      req.user = decoded; // decoded includes id, email, and role

      // Role-based restriction check
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: "Access denied — insufficient permissions" });
      }

      next();
    } catch (err) {
      console.error("JWT validation error:", err.message);
      res.status(401).json({ message: "Not authorized, invalid or expired token" });
    }
  };
};
