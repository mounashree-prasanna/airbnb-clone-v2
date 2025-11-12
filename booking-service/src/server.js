import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import { errorHandler } from "./middlewares/errorMiddleware.js";

dotenv.config();
const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Health check route
app.get("/", (req, res) => {
  res.send("🚀 Booking Service is running and connected to MongoDB");
});

// Main routes
app.use("/booking", bookingRoutes);

// Handle unknown routes
app.use((req, res, next) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handling middleware (MUST be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 7004;
app.listen(PORT, () => {
  console.log(`✅ Booking Service running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
});
