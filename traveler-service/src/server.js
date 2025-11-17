import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import travelerAuthRoute from "./routes/travelerAuthRoute.js";
import travelerRoute from "./routes/travelerRoute.js";
import favouriteRoutes from "./routes/favouriteRoutes.js";
import { protect } from "./middlewares/authMiddleware.js";


dotenv.config();
const app = express();

// ✅ CORS middleware — allow frontend and ingress
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://airbnb.local",
      /^http:\/\/.*\.airbnb\.local$/,
      process.env.FRONTEND_URL || "",
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Middleware for parsing JSON
app.use(express.json());

// ✅ Connect MongoDB
connectDB();

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("🚀 Traveler Service is running and connected to MongoDB");
});

// ✅ Traveler routes
app.use("/auth", travelerAuthRoute);
app.use("/", travelerRoute);
app.use("/favourites", protect(["traveler"]), favouriteRoutes);

// ✅ Start server
const PORT = process.env.PORT || 7001;
app.listen(PORT, () => {
  console.log(`✅ Traveler Service running on port ${PORT}`);
});
