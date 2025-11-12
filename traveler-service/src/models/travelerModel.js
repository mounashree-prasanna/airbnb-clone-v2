import mongoose from "mongoose";
import bcrypt from "bcrypt";

const travelerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  favorites: [String],
});

// Automatically hash password before saving
travelerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // only hash if modified
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed one
travelerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("Traveler", travelerSchema);
