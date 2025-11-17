import mongoose from "mongoose";

const favouriteSchema = new mongoose.Schema(
  {
    traveler_id: { type: mongoose.Schema.Types.ObjectId, ref: "Traveler", required: true },
    property_id: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Favourite = mongoose.model("Favourite", favouriteSchema);
export default Favourite;
