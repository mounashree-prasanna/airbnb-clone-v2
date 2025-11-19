import Traveler from "../models/travelerModel.js";

// ✅ Get traveler profile
export const getTravelerProfile = async (req, res) => {
  try {
    const traveler = await Traveler.findById(req.user.id).select("-password");
    if (!traveler) return res.status(404).json({ message: "Traveler not found" });
    res.json(traveler);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update traveler profile
export const updateTravelerProfile = async (req, res) => {
  try {
    const traveler = await Traveler.findById(req.user.id);
    if (!traveler) return res.status(404).json({ message: "Traveler not found" });

    // Handle text fields
    const fields = [
      "name",
      "phone",
      "about",
      "city",
      "state",
      "country",
      "languages",
      "gender",
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== "") {
        traveler[field] = req.body[field];
      }
    });

    // Handle image upload - support both base64 (from frontend) and file upload (multer)
    if (req.body.profile_image) {
      // Base64 encoded image from frontend (like owner profile)
      traveler.profile_image = req.body.profile_image;
    } else if (req.file) {
      // File upload via multer (fallback)
      traveler.profile_image = `/uploads/${req.file.filename}`;
    }

    await traveler.save();
    
    // Return updated profile (excluding password)
    const updatedTraveler = await Traveler.findById(req.user.id).select("-password");
    res.json({ 
      message: "Profile updated successfully",
      ...updatedTraveler.toObject()
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

