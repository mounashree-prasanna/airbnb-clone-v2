// server.js
const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const propertyRoutes = require("./routes/propertyRoutes");
const cors = require("cors");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 7002;

// Middleware
app.use(express.json());
app.use(cors());

// Connect Database
connectDB();

// Routes
app.use("/api/property", propertyRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("Property Service is running 🚀");
});

// Start server
app.listen(PORT, () => {
  console.log(`Property Service running on port ${PORT}`);
});
