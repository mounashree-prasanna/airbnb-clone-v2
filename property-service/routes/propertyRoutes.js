// routes/propertyRoutes.js
const express = require("express");
const {
  getProperties,
  searchProperties,
  getProperty,
  getMyProperties,
  createMyProperty,
  updateMyProperty,
  deleteMyProperty,
} = require("../controllers/propertyController");

const { protect, ensureOwner } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.get("/", getProperties);
router.get("/search", searchProperties);
router.get("/:id", getProperty);

// Owner-protected routes
router.get("/owner/me", protect, ensureOwner, getMyProperties);
router.post("/owner", protect, ensureOwner, createMyProperty);
router.put("/owner/:id", protect, ensureOwner, updateMyProperty);
router.delete("/owner/:id", protect, ensureOwner, deleteMyProperty);

module.exports = router;
