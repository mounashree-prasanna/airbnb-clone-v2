// src/models/travelerModel.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const travelerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    favorites: { type: Array, default: [] },
    role: { type: String, default: "traveler" },
  },
  { timestamps: true }
);

// ✅ Hash password before saving
travelerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Instance method to compare passwords
travelerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Traveler = mongoose.model("Traveler", travelerSchema);
export default Traveler;