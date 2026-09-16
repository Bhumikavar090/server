const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
      required: true,
      index: true,
    },

    action: {
      type: String,
      required: true,
      enum: [
        "ISSUE_CREATED",
        "AI_ANALYSIS_GENERATED",
        "STATUS_CHANGED",
        "PRIORITY_CHANGED",
        "INVESTIGATION_STARTED",
        "INVESTIGATION_UPDATED",
        "FINDINGS_ADDED",
        "RESOLUTION_ADDED",
        "ISSUE_RESOLVED",
      ],
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Activity",
  activitySchema
);