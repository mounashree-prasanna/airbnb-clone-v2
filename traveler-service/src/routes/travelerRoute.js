import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  getTravelerProfile,
  updateTravelerProfile,
} from "../controllers/travelerProfileController.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// ✅ Protected profile routes
// Note: upload middleware is optional - we support both JSON (base64) and FormData (file upload)
router.get("/profile", protect(["traveler"]), getTravelerProfile);
router.put("/profile", protect(["traveler"]), updateTravelerProfile);

export default router;
