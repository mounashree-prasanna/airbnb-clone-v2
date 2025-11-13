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
app.use(cors());

// Database
connectDB();

// Routes
app.use("/api/owner", ownerRoutes);

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
