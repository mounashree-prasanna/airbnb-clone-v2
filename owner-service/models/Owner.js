// src/models/Owner.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ownerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  about: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  languages: { type: String },
  gender: { type: String },
  profile_image: { type: String },
  role: { type: String, default: "owner" },
}, { timestamps: true });

// hash password before saving
ownerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const Owner = mongoose.model("Owner", ownerSchema);
module.exports = Owner;
