import express from "express";
import { getTravelerProfile } from "../controllers/travelerProfileController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Apply protect middleware before the controller
router.get("/profile", protect, getTravelerProfile);

export default router;
