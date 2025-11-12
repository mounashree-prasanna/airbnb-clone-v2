import express from "express";
import {
  createBooking,
  getTravelerBookings,
  getOwnerBookings,
  updateBookingStatus
} from "../controllers/bookingController.js";

const router = express.Router();

// Traveler
router.post("/", createBooking);
router.get("/traveler", getTravelerBookings);

// Owner
router.get("/owner/:ownerId", getOwnerBookings);
router.put("/:id/status", updateBookingStatus);

export default router;
