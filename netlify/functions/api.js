const serverless = require("serverless-http");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// CORS configuration for Netlify
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://hirely-ai.netlify.app",
      /\.netlify\.app$/,
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Import routes
const jobsRouter = require("../../src/api/jobs");
const jobApplicationRouter = require("../../src/api/jobApplication");

// Use routes
app.use("/jobs", jobsRouter);
app.use("/jobApplications", jobApplicationRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "API is running" });
});

// Export the serverless handler
exports.handler = serverless(app);
