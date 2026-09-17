const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema(
  {
    // --------------------------------------------------
    // BASIC ISSUE INFORMATION
    // --------------------------------------------------

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    technicalContext: {
      type: String,
      default: "",
      trim: true,
    },

    // --------------------------------------------------
    // PROJECT
    // --------------------------------------------------

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true,
},

    // --------------------------------------------------
    // ISSUE STATUS
    // --------------------------------------------------

    status: {
      type: String,
      enum: ["open", "investigating", "resolved"],
      default: "open",
    },

    // --------------------------------------------------
    // PRIORITY
    // --------------------------------------------------

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    // --------------------------------------------------
    // CATEGORY
    // --------------------------------------------------

    category: {
      type: String,
      default: "unclassified",
      trim: true,
    },

    // --------------------------------------------------
    // AI ANALYSIS
    // --------------------------------------------------

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

      investigationSteps: {
        type: [String],
        default: [],
      },

      confidence: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
    aiFindingsAnalysis: {
  rootCause: {
    type: String,
    default: "",
  },

  evidenceAssessment: {
    type: String,
    default: "",
  },

  nextAction: {
    type: String,
    default: "",
  },

  resolutionConfidence: {
    type: Number,
    default: 0,
  },

  sufficientEvidence: {
    type: Boolean,
    default: false,
  },

  analyzedAt: {
    type: Date,
    default: null,
  },
},

    // --------------------------------------------------
    // DEVELOPER INVESTIGATION
    // --------------------------------------------------

    investigation: {
      // AI-generated / developer investigation checklist
      steps: [
        {
          text: {
            type: String,
            required: true,
          },

          completed: {
            type: Boolean,
            default: false,
          },
        },
      ],

      // What the developer actually discovered
      findings: {
        type: String,
        default: "",
      },

      // Final solution applied by developer
      resolution: {
        type: String,
        default: "",
      },
    },
  },

  // Automatically creates:
  // createdAt
  // updatedAt
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Issue", issueSchema);