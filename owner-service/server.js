// server.js
const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const ownerRoutes = require("./routes/ownerRoutes");
const cors = require("cors");

dotenv.config();           // Load environment variables

const app = express();
const PORT = process.env.PORT || 7003;

// Middleware
app.use(express.json());
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

// Database
connectDB();

// Routes
app.use("/auth", ownerRoutes);

// Health check (for Docker/Kubernetes readiness)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", service: "Owner Service" });
});

app.get("/", (req, res) => {
    res.send("Owner Service is running");
  });

// Start server
app.listen(PORT, () => {
  console.log(`Owner Service running on port ${PORT}`);
});
