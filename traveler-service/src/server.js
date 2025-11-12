import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";

// Route imports (make sure filenames match exactly)
import travelerAuthRoute from "./routes/travelerAuthRoute.js";
import travelerRoute from "./routes/travelerRoute.js";

dotenv.config();
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
connectDB();

// Base route for health check
app.get("/", (req, res) => {
  res.send("🚀 Traveler Service is running and connected to MongoDB");
});

// Traveler routes
app.use("/traveler/auth", travelerAuthRoute);
app.use("/traveler", travelerRoute);

// Start server
const PORT = process.env.PORT || 7001;
app.listen(PORT, () => {
  console.log(`✅ Traveler Service running on port ${PORT}`);
});
