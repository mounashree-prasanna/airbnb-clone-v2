import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    travelerId: { type: String, required: true },
    propertyId: { type: String, required: true },
    ownerId: { type: String, required: false },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    guests: { type: Number, required: true },
    status: { type: String, default: "PENDING" } // PENDING | ACCEPTED | CANCELLED
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
