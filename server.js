require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const issueRoutes = require("./routes/issueRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "DevTraxe API is running",
  });
});

app.use("/api/issues", issueRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});