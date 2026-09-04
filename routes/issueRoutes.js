const express = require("express");

const Issue = require("../models/Issue");
const { analyzeIssue } = require("../services/aiService");

const router = express.Router();


// CREATE ISSUE AND ANALYZE WITH AI

router.post("/", async (req, res) => {
  try {
    const { title, description, priority } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        message: "Title and description are required",
      });
    }

    // First save the issue in the database
    const issue = await Issue.create({
      title,
      description,
      priority: priority || "medium",
    });


    try {
      // Ask AI to analyze the issue
      const analysis = await analyzeIssue(
        title,
        description
      );

      // Save AI analysis into the issue
      issue.category = analysis.category;

      issue.aiAnalysis = {
        summary: analysis.summary,
        possibleCause: analysis.possibleCause,
        suggestedAction: analysis.suggestedAction,
        confidence: analysis.confidence,
      };

      issue.status = "investigating";

      await issue.save();

    } catch (aiError) {
      console.error(
        "AI analysis failed:",
        aiError.message
      );
    }


    res.status(201).json({
      message: "Issue created successfully",
      issue,
    });

  } catch (error) {
    console.error(
      "Issue creation failed:",
      error.message
    );

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


// GET SINGLE ISSUE

router.get("/:id", async (req, res) => {
  try {
    const issue = await Issue.findById(
      req.params.id
    );

    if (!issue) {
      return res.status(404).json({
        message: "Issue not found",
      });
    }

    res.status(200).json(issue);

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch issue",
      error: error.message,
    });
  }
});


module.exports = router;