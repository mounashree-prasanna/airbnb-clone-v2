// src/routes/ownerRoutes.js
const express = require("express");
const { registerOwner, loginOwner, getOwnerProfile, updateOwnerProfile, checkSession, logoutOwner, refreshToken } = require("../controllers/ownerController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// Public routes
router.post("/signup", registerOwner);
router.post("/login", loginOwner);
router.post("/logout", logoutOwner);
router.post("/refresh", refreshToken);
router.post("/check-session", checkSession); // Changed to POST to accept refreshToken in body
router.get("/check-session", checkSession); // Keep GET for backward compatibility

// Protected routes
router.get("/profile", protect, getOwnerProfile);
router.put("/profile", protect, updateOwnerProfile);

module.exports = router;