import Booking from "../models/bookingModel.js";
import jwt from "jsonwebtoken";

/** Traveler: create booking */
export const createBooking = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Missing token" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const travelerId = decoded.id.toString(); // Ensure it's a string for storage

    const { propertyId, ownerId, startDate, endDate, guests } = req.body;
    if (new Date(endDate) <= new Date(startDate))
      return res.status(400).json({ message: "End date must be after start date" });

    const newBooking = await Booking.create({
      travelerId,
      propertyId,
      ownerId: ownerId ? ownerId.toString() : undefined, // Ensure ownerId is string
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
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/** Traveler: view own bookings */
import axios from "axios";

const PROPERTY_SERVICE_URL =
  process.env.PROPERTY_SERVICE_URL || "http://property-service:7002";

export const getTravelerBookings = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Missing token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const travelerId = decoded.id.toString(); // Ensure it's a string for comparison

    // Get the traveler's bookings - ensure travelerId matches exactly
    const bookings = await Booking.find({ travelerId: travelerId });

    // If no bookings
    if (bookings.length === 0) {
      return res.json([]);
    }

    // Fetch property details for each booking
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        try {
          const propertyRes = await axios.get(
            `${PROPERTY_SERVICE_URL}/api/property/${booking.propertyId}`
          );
          const property = propertyRes.data;

          return {
            ...booking.toObject(),
            title: property.title || "Unknown Property",
            location: property.location || "Unknown Location",
            photo_url: property.photo_url || property.photoUrl || "",
            price: property.price || 0,
          };
        } catch (error) {
          console.warn(
            `Failed to fetch property ${booking.propertyId}: ${error.message}`
          );
          return booking; // fallback to base booking data
        }
      })
    );

    res.json(enrichedBookings);
  } catch (err) {
    console.error("Get traveler bookings error:", err);
    res.status(500).json({ message: err.message });
  }
};

/** Owner: view received bookings */
export const getOwnerBookings = async (req, res) => {
  try {
    const { ownerId } = req.params;
    if (!ownerId) {
      return res.status(400).json({ message: "Owner ID is required" });
    }
    
    // Ensure ownerId is a string for comparison
    const normalizedOwnerId = ownerId.toString();
    console.log("Fetching bookings for ownerId:", normalizedOwnerId);
    
    // Find bookings matching ownerId (exact string match)
    const bookings = await Booking.find({ ownerId: normalizedOwnerId });
    
    console.log(`Found ${bookings.length} bookings for owner ${normalizedOwnerId}`);

    // If no bookings
    if (bookings.length === 0) {
      return res.json([]);
    }

    // Fetch property details for each booking
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        try {
          const propertyRes = await axios.get(
            `${PROPERTY_SERVICE_URL}/api/property/${booking.propertyId}`
          );
          const property = propertyRes.data;

          return {
            ...booking.toObject(),
            property_title: property.title || "Unknown Property",
            location: property.location || "Unknown Location",
            photo_url: property.photo_url || property.photoUrl || property.photoURL || "",
            price: property.price || 0,
            start_date: booking.startDate ? new Date(booking.startDate).toLocaleDateString() : "",
            end_date: booking.endDate ? new Date(booking.endDate).toLocaleDateString() : "",
            booking_id: booking._id,
          };
        } catch (error) {
          console.warn(
            `Failed to fetch property ${booking.propertyId}: ${error.message}`
          );
          return {
            ...booking.toObject(),
            property_title: "Unknown Property",
            location: "Unknown Location",
            photo_url: "",
            price: 0,
            start_date: booking.startDate ? new Date(booking.startDate).toLocaleDateString() : "",
            end_date: booking.endDate ? new Date(booking.endDate).toLocaleDateString() : "",
            booking_id: booking._id,
          };
        }
      })
    );

    res.json(enrichedBookings);
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
