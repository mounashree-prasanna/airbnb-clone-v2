import Booking from "../models/bookingModel.js";
import jwt from "jsonwebtoken";

/** Traveler: create booking */
export const createBooking = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Missing token" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const travelerId = decoded.id;

    const { propertyId, ownerId, startDate, endDate, guests } = req.body;
    if (new Date(endDate) <= new Date(startDate))
      return res.status(400).json({ message: "End date must be after start date" });

    const newBooking = await Booking.create({
      travelerId,
      propertyId,
      ownerId,
      startDate,
      endDate,
      guests
    });

    res.status(201).json({
      success: true,
      message: "Booking created (status: PENDING)",
      booking: newBooking
    });
  } catch (err) {
    console.error("Create booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/** Traveler: view own bookings */
export const getTravelerBookings = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const bookings = await Booking.find({ travelerId: decoded.id });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Owner: view received bookings */
export const getOwnerBookings = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const bookings = await Booking.find({ ownerId });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Owner: accept or cancel booking */
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // ACCEPTED or CANCELLED
    const updated = await Booking.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) return res.status(404).json({ message: "Booking not found" });
    res.json({ message: "Booking status updated", booking: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
