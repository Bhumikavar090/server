const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["open", "investigating", "resolved"],
      default: "open",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    category: {
      type: String,
      default: "unclassified",
    },

    aiAnalysis: {
      summary: {
        type: String,
        default: "",
      },

      possibleCause: {
        type: String,
        default: "",
      },

      suggestedAction: {
        type: String,
        default: "",
      },

      confidence: {
        type: Number,
        default: 0,
      },
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Issue", issueSchema);