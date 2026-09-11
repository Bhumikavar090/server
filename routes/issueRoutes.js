const express = require("express");

const Issue = require("../models/Issue");
const Project = require("../models/Project");

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
      project,
    } = req.body;

    if (!title || !description || !project) {
      return res.status(400).json({
        message:
          "Title, description and project are required",
      });
    }

    const existingProject =
      await Project.findById(project);

    if (!existingProject) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Save issue first
    const issue = await Issue.create({
      title,
      description,
      priority: priority || "medium",
      technicalContext: technicalContext || "",
      project,
    });

    try {
      // Generate AI analysis
      const analysis = await analyzeIssue(
        title,
        description,
        technicalContext
      );

      issue.category = analysis.category;

      issue.aiAnalysis = {
        summary: analysis.summary,
        possibleCause: analysis.possibleCause,
        suggestedAction:
          analysis.suggestedAction,
        investigationSteps:
          analysis.investigationSteps,
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
    const issues = await Issue.find()
      .populate("project", "name")
      .sort({
        createdAt: -1,
      });

    res.status(200).json(issues);
  } catch (error) {
    console.error(
      "Issue fetch failed:",
      error.message
    );

    res.status(500).json({
      message: "Failed to fetch issues",
    });
  }
});


// GET ISSUES BY PROJECT

router.get("/project/:projectId", async (req, res) => {
  try {
    const issues = await Issue.find({
      project: req.params.projectId,
    })
      .populate("project", "name")
      .sort({
        createdAt: -1,
      });

    res.status(200).json(issues);
  } catch (error) {
    console.error(
      "Project issues fetch failed:",
      error.message
    );

    res.status(500).json({
      message: "Failed to fetch project issues",
    });
  }
});


// GET SINGLE ISSUE

router.get("/:id", async (req, res) => {
  try {
    const issue = await Issue.findById(
      req.params.id
    ).populate("project", "name");

    if (!issue) {
      return res.status(404).json({
        message: "Issue not found",
      });
    }

    res.status(200).json(issue);
  } catch (error) {
    console.error(
      "Issue fetch failed:",
      error.message
    );

    res.status(500).json({
      message: "Failed to fetch issue",
    });
  }
});


module.exports = router;