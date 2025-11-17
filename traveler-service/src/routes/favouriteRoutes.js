import express from "express";
import mongoose from "mongoose";
import Favourite from "../models/favouriteModels.js";
import axios from "axios";

const router = express.Router();

// ✅ Get all favourites for logged-in traveler
router.get("/my-favourites", async (req, res) => {
  try {
    const travelerId = req.user?.id || req.user?._id;

    if (!travelerId) {
      return res.status(401).json({ message: "Unauthorized: traveler ID not found" });
    }

    // 🔹 Step 1: Get favourites from DB (no populate)
    const favourites = await Favourite.find({ traveler_id: travelerId }).lean();

    // 🔹 Step 2: Fetch each property detail from Property Service
    const propertyDetails = await Promise.all(
      favourites.map(async (fav) => {
        try {
          const res = await axios.get(
            `http://property-service:7002/api/property/${fav.property_id}`
          );
          return res.data;
        } catch (err) {
          console.error(`Failed to fetch property ${fav.property_id}:`, err.message);
          return null;
        }
      })
    );

    // Filter out any nulls (failed property fetch)
    const validProperties = propertyDetails.filter(Boolean);

    res.json(validProperties);
  } catch (err) {
    console.error("🔥 Error fetching favourites:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ✅ Add a favourite
router.post("/add", async (req, res) => {
  try {
    const { propertyId } = req.body;
    const travelerId = req.user.id;

    if (!propertyId || !travelerId) {
      return res.status(400).json({ message: "Missing propertyId or travelerId" });
    }

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ message: "Invalid propertyId format" });
    }

    const exists = await Favourite.findOne({ property_id: propertyId, traveler_id: travelerId });
    if (exists) return res.status(409).json({ message: "Already in favourites" });

    const fav = await Favourite.create({ traveler_id: travelerId, property_id: propertyId });
    res.status(201).json(fav);
  } catch (err) {
    console.error("Error adding favourite:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Remove a favourite
router.delete("/remove/:propertyId", async (req, res) => {
  try {
    const travelerId = req.user.id;
    const { propertyId } = req.params;

    await Favourite.deleteOne({ traveler_id: travelerId, property_id: propertyId });
    res.json({ message: "Removed from favourites" });
  } catch (err) {
    console.error("Error removing favourite:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
