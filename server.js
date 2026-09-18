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

const allowedOrigins = [
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================
// DATABASE CONNECTION
// =====================================

let dbPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!dbPromise) {
    dbPromise = mongoose.connect(process.env.MONGO_URI);
  }

  await dbPromise;
};

// =====================================
// HEALTH CHECK
// =====================================

app.get("/", async (req, res) => {
  res.status(200).json({
    success: true,
    message: "DevTrace API is running",
  });
});

app.get("/api/health", async (req, res) => {
  res.status(200).json({
    success: true,
    message: "DevTrace API is healthy",
  });
});

// =====================================
// DATABASE FOR API ROUTES
// =====================================

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("MongoDB connection failed:", error);

    return res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
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
// EXPORT FOR VERCEL
// =====================================

module.exports = app;

// =====================================
// LOCAL DEVELOPMENT
// =====================================

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`DevTrace API running on port ${PORT}`);

    connectDB()
      .then(() => {
        console.log("MongoDB Connected");
      })
      .catch((error) => {
        console.error("MongoDB connection failed:", error);
      });
  });
}