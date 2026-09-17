const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();


// =====================================
// ROUTES
// =====================================

const authRoutes = require("./routes/authRoutes");
const issueRoutes = require("./routes/issueRoutes");
const projectRoutes = require("./routes/projectRoutes");
const activityRoutes = require("./routes/activityRoutes");
const aiRoutes = require("./routes/aiRoutes");


const app = express();


// =====================================
// MIDDLEWARE
// =====================================

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// =====================================
// HEALTH CHECK
// =====================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DevTrace API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DevTrace API is healthy",
  });
});


// =====================================
// AUTH
// =====================================

app.use("/api/auth", authRoutes);


// =====================================
// ISSUES
// =====================================

app.use("/api/issues", issueRoutes);


// =====================================
// ACTIVITIES
// =====================================

app.use("/api/issues", activityRoutes);


// =====================================
// PROJECTS
// =====================================

app.use("/api/projects", projectRoutes);


// =====================================
// FINDINGS
// =====================================



// =====================================
// AI
// =====================================

app.use("/api/ai", aiRoutes);


// =====================================
// 404
// =====================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.originalUrl,
  });
});


// =====================================
// ERROR HANDLER
// =====================================

app.use((error, req, res, next) => {
  console.error("SERVER ERROR:", error);

  res.status(500).json({
    success: false,
    message: error.message || "Internal server error",
  });
});


// =====================================
// DATABASE + SERVER
// =====================================

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`DevTrace API running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  });