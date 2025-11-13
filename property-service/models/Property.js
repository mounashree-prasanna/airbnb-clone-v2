// models/Property.js
const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Owner" },
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: Number, required: true },
    amenities: { type: [String] },
    bedrooms: { type: Number },
    bathrooms: { type: Number },
    availableFrom: { type: Date },
    availableTo: { type: Date },
    photoUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Property", propertySchema);
