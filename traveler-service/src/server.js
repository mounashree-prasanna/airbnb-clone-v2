import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import travelerAuthRoute from "./routes/travelerAuthRoute.js";
import travelerRoute from "./routes/travelerRoute.js";
import favouriteRoutes from "./routes/favouriteRoutes.js";
import { protect } from "./middlewares/authMiddleware.js";
import { connectProducer } from "./kafka/producer.js";
// import { startTravelerConsumer } from "./kafka/consumer.js";


import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ Serve static files with proper MIME types and CORS headers
const uploadsPath = path.join(__dirname, "../uploads");

// Ensure uploads directory exists
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use(
  "/uploads",
  express.static(uploadsPath, {
    // Disable caching so the browser always gets a fresh 200 response
    etag: false,
    lastModified: false,
    cacheControl: false,
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();

      if (ext === ".jpg" || ext === ".jpeg") {
        res.setHeader("Content-Type", "image/jpeg");
      } else if (ext === ".png") {
        res.setHeader("Content-Type", "image/png");
      } else if (ext === ".gif") {
        res.setHeader("Content-Type", "image/gif");
      }

      // Allow image embedding from the frontend origin
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);


dotenv.config();


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
    exposedHeaders: ["Content-Disposition"],
  })
);

// ✅ Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Connect MongoDB
connectDB();

connectProducer();
// startTravelerConsumer();

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
