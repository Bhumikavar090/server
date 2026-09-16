require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const issueRoutes = require("./routes/issueRoutes");
const projectRoutes = require("./routes/projectRoutes");
const activityRoutes = require("./routes/activityRoutes");
const app = express();


// DATABASE

connectDB();


// MIDDLEWARE

app.use(cors());

app.use(express.json());


// HEALTH CHECK

app.get("/", (req, res) => {
  res.json({
    message: "DevTraxe API is running",
  });
});


// API ROUTES

app.use("/api/issues", issueRoutes);
app.use("/api/issues", activityRoutes);
app.use("/api/projects", projectRoutes);



// SERVER

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});