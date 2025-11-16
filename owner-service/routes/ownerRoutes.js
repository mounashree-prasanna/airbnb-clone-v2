// src/routes/ownerRoutes.js
const express = require("express");
const { registerOwner, loginOwner, getOwnerProfile, updateOwnerProfile } = require("../controllers/ownerController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// Public routes
router.post("/signup", registerOwner);
router.post("/login", loginOwner);

// Protected routes
router.get("/profile", protect, getOwnerProfile);
router.put("/profile", protect, updateOwnerProfile);

module.exports = router;