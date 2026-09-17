const express = require("express");
const mongoose = require("mongoose");

const Issue = require("../models/Issue");
const Activity = require("../models/Activity");

const router = express.Router();

// ======================================================
// GET ALL ISSUES
// GET /api/issues
// ======================================================

router.get("/", async (req, res) => {
  try {
    const issues = await Issue.find()
      .populate("project", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: issues.length,
      issues,
    });
  } catch (error) {
    console.error("GET ISSUES ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch issues",
    });
  }
});


// ======================================================
// GET SINGLE ISSUE
// GET /api/issues/:id
// ======================================================

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue ID",
      });
    }

    const issue = await Issue.findById(id)
      .populate("project", "name")
      .lean();

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    res.status(200).json({
      success: true,
      issue,
    });
  } catch (error) {
    console.error("GET ISSUE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch issue",
    });
  }
});


// ======================================================
// CREATE ISSUE
// POST /api/issues
// ======================================================

router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      technicalContext,
      project,
      priority,
      category,
      aiAnalysis,
    } = req.body;

    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (!title || !description || !project) {
      return res.status(400).json({
        success: false,
        message: "Title, description and project are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(project)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    // -----------------------------------------------
    // CREATE ISSUE
    // -----------------------------------------------

    const issue = await Issue.create({
      title: title.trim(),

      description: description.trim(),

      technicalContext:
        technicalContext?.trim() || "",

      project,

      priority: priority || "medium",

      category:
        category || "unclassified",

      aiAnalysis: aiAnalysis || {},
    });

    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      issue,
    });
  } catch (error) {
    console.error("CREATE ISSUE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create issue",
      error: error.message,
    });
  }
});


// ======================================================
// UPDATE ISSUE
// PATCH /api/issues/:id
// ======================================================

router.patch("/:id/findings", async (req, res) => {
  try {
    const { id } = req.params;
    const { findings } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue ID",
      });
    }

    if (
      typeof findings !== "string" ||
      !findings.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Findings cannot be empty",
      });
    }

    const issue = await Issue.findByIdAndUpdate(
      id,
      {
        $set: {
          "investigation.findings":
            findings.trim(),
        },
        $setOnInsert: {},
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    // Create activity automatically
    await Activity.create({
      issue: id,
      action: "FINDING_ADDED",
      message: "Developer added investigation findings",
      metadata: {
        source: "issue_workspace",
      },
    });

    res.status(200).json({
      success: true,
      message: "Findings saved successfully",
      issue,
    });
  } catch (error) {
    console.error("UPDATE FINDINGS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save findings",
    });
  }
});

// ======================================================
// UPDATE FINDINGS
// PATCH /api/issues/:id/findings
// ======================================================

router.patch("/:id/findings", async (req, res) => {
  try {
    const { id } = req.params;
    const { findings } = req.body;

    // -----------------------------------------------
    // VALIDATE ID
    // -----------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue ID",
      });
    }

    // -----------------------------------------------
    // VALIDATE FINDINGS
    // -----------------------------------------------

    if (typeof findings !== "string") {
      return res.status(400).json({
        success: false,
        message: "Findings must be a string",
      });
    }

    // -----------------------------------------------
    // UPDATE ONLY FINDINGS
    // -----------------------------------------------

    const issue = await Issue.findByIdAndUpdate(
      id,
      {
        $set: {
          "investigation.findings": findings.trim(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Findings saved successfully",
      issue,
    });
  } catch (error) {
    console.error("UPDATE FINDINGS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save findings",
      error: error.message,
    });
  }
});


// ======================================================
// UPDATE RESOLUTION
// PATCH /api/issues/:id/resolution
// ======================================================

router.patch("/:id/resolution", async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue ID",
      });
    }

    if (
      typeof resolution !== "string" ||
      !resolution.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Resolution cannot be empty",
      });
    }

    const issue = await Issue.findByIdAndUpdate(
      id,
      {
        $set: {
          "investigation.resolution":
            resolution.trim(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    await Activity.create({
      issue: id,
      action: "RESOLUTION_ADDED",
      message: "Developer added a resolution",
      metadata: {
        source: "issue_workspace",
      },
    });

    res.status(200).json({
      success: true,
      message: "Resolution saved successfully",
      issue,
    });
  } catch (error) {
    console.error(
      "UPDATE RESOLUTION ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to save resolution",
    });
  }
});

// ======================================================
// UPDATE STATUS
// PATCH /api/issues/:id/status
// ======================================================

router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "open",
      "investigating",
      "resolved",
    ];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue ID",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const issue = await Issue.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    await Activity.create({
      issue: id,
      action:
        status === "resolved"
          ? "ISSUE_RESOLVED"
          : "STATUS_CHANGED",

      message:
        status === "resolved"
          ? "Issue was marked as resolved"
          : `Issue status changed to ${status}`,

      metadata: {
        status,
        source: "issue_workspace",
      },
    });

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      issue,
    });
  } catch (error) {
    console.error(
      "UPDATE STATUS ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
});


// ======================================================
// COMPLETE INVESTIGATION STEP
// PATCH /api/issues/:id/investigation-step/:stepIndex
// ======================================================

router.patch(
  "/:id/investigation-step/:stepIndex",
  async (req, res) => {
    try {
      const { id, stepIndex } = req.params;

      const index = Number(stepIndex);

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid issue ID",
        });
      }

      if (!Number.isInteger(index) || index < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid step index",
        });
      }

      const issue = await Issue.findById(id);

      if (!issue) {
        return res.status(404).json({
          success: false,
          message: "Issue not found",
        });
      }

      if (
        !issue.investigation ||
        !issue.investigation.steps ||
        !issue.investigation.steps[index]
      ) {
        return res.status(404).json({
          success: false,
          message: "Investigation step not found",
        });
      }

      // Toggle completed state
      issue.investigation.steps[index].completed =
        !issue.investigation.steps[index].completed;

      await issue.save();

      res.status(200).json({
        success: true,
        message: "Investigation step updated",
        issue,
      });
    } catch (error) {
      console.error(
        "UPDATE INVESTIGATION STEP ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update investigation step",
      });
    }
  }
);


// ======================================================
// DELETE ISSUE
// DELETE /api/issues/:id
// ======================================================

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue ID",
      });
    }

    const issue = await Issue.findByIdAndDelete(id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error) {
    console.error("DELETE ISSUE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete issue",
    });
  }
});


module.exports = router;