// src/routes/ownerRoutes.js
const express = require("express");
const { registerOwner, loginOwner, getOwnerProfile, updateOwnerProfile, checkSession, logoutOwner } = require("../controllers/ownerController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// Public routes
router.post("/signup", registerOwner);
router.post("/login", loginOwner);
router.post("/logout", logoutOwner);
router.get("/check-session", checkSession);

// Protected routes
router.get("/profile", protect, getOwnerProfile);
router.put("/profile", protect, updateOwnerProfile);

module.exports = router;