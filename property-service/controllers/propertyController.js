// controllers/propertyController.js
const Property = require("../models/Property");

// @desc Get all properties
exports.getProperties = async (req, res) => {
  try {
    const properties = await Property.find();
    res.json(properties);
  } catch (err) {
    console.error("getProperties error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Search properties by location/date
exports.searchProperties = async (req, res) => {
  try {
    const { location, minPrice, maxPrice } = req.query;
    const filter = {};
    if (location) filter.location = { $regex: location, $options: "i" };
    if (minPrice || maxPrice) filter.price = {};
    if (minPrice) filter.price.$gte = parseInt(minPrice);
    if (maxPrice) filter.price.$lte = parseInt(maxPrice);

    const properties = await Property.find(filter);
    res.json(properties);
  } catch (err) {
    console.error("searchProperties error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Get single property by ID
exports.getProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).lean();
    if (!property) return res.status(404).json({ message: "Property not found" });

    // Normalize field names for frontend
    property.id = property._id;
    delete property._id;

    res.json(property);
  } catch (err) {
    console.error("getProperty error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// @desc Get properties for logged-in owner
exports.getMyProperties = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const properties = await Property.find({ ownerId });
    res.json(properties);
  } catch (err) {
    console.error("getMyProperties error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Create property (Owner only)
exports.createMyProperty = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const property = await Property.create({ ...req.body, ownerId });
    res.status(201).json({ message: "Property created", property });
  } catch (err) {
    console.error("createMyProperty error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Update property (Owner only)
exports.updateMyProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found" });
    if (property.ownerId.toString() !== req.user.id)
      return res.status(403).json({ message: "You don't own this property" });

    const updated = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: "Property updated", property: updated });
  } catch (err) {
    console.error("updateMyProperty error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Delete property (Owner only)
exports.deleteMyProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found" });
    if (property.ownerId.toString() !== req.user.id)
      return res.status(403).json({ message: "You don't own this property" });

    await property.deleteOne();
    res.json({ message: "Property deleted" });
  } catch (err) {
    console.error("deleteMyProperty error:", err);
    res.status(500).json({ message: "Server error" });
  }
};