const express = require("express");
const mongoose = require("mongoose");

const Activity = require("../models/Activity");
const Issue = require("../models/Issue");

const router = express.Router();

// ======================================================
// GET ACTIVITY FOR AN ISSUE
// GET /api/issues/:id/activity
// ======================================================

router.get("/:id/activity", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue ID",
      });
    }

    const issue = await Issue.findById(id).select("_id");

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    const activities = await Activity.find({
      issue: id,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error("GET ACTIVITY ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch activity",
    });
  }
});


// ======================================================
// CREATE ACTIVITY
// POST /api/issues/:id/activity
// ======================================================

router.post("/:id/activity", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      action,
      message,
      metadata,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue ID",
      });
    }

    if (!action || !message) {
      return res.status(400).json({
        success: false,
        message: "Action and message are required",
      });
    }

    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    const activity = await Activity.create({
      issue: id,
      action,
      message,
      metadata: metadata || {},
    });

    res.status(201).json({
      success: true,
      message: "Activity created successfully",
      activity,
    });
  } catch (error) {
    console.error("CREATE ACTIVITY ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create activity",
      error: error.message,
    });
  }
});


module.exports = router;