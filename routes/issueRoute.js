const express = require("express");
const Issue = require("../models/Issue");

const router = express.Router();


// CREATE ISSUE
router.post("/", async (req, res) => {
  try {
    const { title, description, priority } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        message: "Title and description are required",
      });
    }

    const issue = await Issue.create({
      title,
      description,
      priority: priority || "medium",
    });

    res.status(201).json({
      message: "Issue created successfully",
      issue,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create issue",
      error: error.message,
    });
  }
});


// GET ALL ISSUES
router.get("/", async (req, res) => {
  try {
    const issues = await Issue.find().sort({
      createdAt: -1,
    });

    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch issues",
      error: error.message,
    });
  }
});


module.exports = router;