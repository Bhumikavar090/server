const express = require("express");

const Issue = require("../models/Issue");
const { analyzeIssue } = require("../services/aiService");

const router = express.Router();


// CREATE ISSUE

router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      technicalContext,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        message: "Title and description are required",
      });
    }

    // Save the issue first so the user's report is never lost
    const issue = await Issue.create({
      title,
      description,
      priority: priority || "medium",
      technicalContext: technicalContext || "",
    });

    try {
      // Generate AI analysis using the available technical context
      const analysis = await analyzeIssue(
        title,
        description,
        technicalContext
      );

      issue.category = analysis.category;

      issue.aiAnalysis = {
        summary: analysis.summary,
        possibleCause: analysis.possibleCause,
        suggestedAction: analysis.suggestedAction,
        investigationSteps: analysis.investigationSteps,
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
    });
  }
});


module.exports = router;