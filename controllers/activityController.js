const Activity = require("../models/Activity");
const Issue = require("../models/Issue");

// GET /api/issues/:issueId/activity
const getIssueActivity = async (req, res) => {
  try {
    const { issueId } = req.params;

    const issue = await Issue.findById(issueId);

    if (!issue) {
      return res.status(404).json({
        message: "Issue not found",
      });
    }

    const activities = await Activity.find({
      issue: issueId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error(
      "Get activity error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch issue activity",
      error: error.message,
    });
  }
};


// POST /api/issues/:issueId/activity
const createActivity = async (req, res) => {
  try {
    const { issueId } = req.params;

    const {
      action,
      message,
      metadata,
    } = req.body;

    if (!action || !message) {
      return res.status(400).json({
        message:
          "Action and message are required",
      });
    }

    const issue = await Issue.findById(issueId);

    if (!issue) {
      return res.status(404).json({
        message: "Issue not found",
      });
    }

    const activity =
      await Activity.create({
        issue: issueId,
        action,
        message,
        metadata: metadata || {},
      });

    return res.status(201).json({
      message: "Activity created",
      activity,
    });
  } catch (error) {
    console.error(
      "Create activity error:",
      error
    );

    return res.status(500).json({
      message: "Failed to create activity",
      error: error.message,
    });
  }
};


module.exports = {
  getIssueActivity,
  createActivity,
};