const Issue = require("../models/Issue");

const {
  analyzeIssue,
  analyzeFindings,
} = require("../services/aiService");


/**
 * POST /api/issues/:id/analyze
 *
 * Generate initial AI analysis for an issue.
 */
const analyzeIssueController = async (req, res) => {
  try {
    const { id } = req.params;

    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    const analysis = await analyzeIssue(issue);

    issue.aiAnalysis = {
      summary: analysis.summary || "",

      possibleCause:
        analysis.possibleCause || "",

      suggestedAction:
        analysis.suggestedAction || "",

      investigationSteps:
        Array.isArray(analysis.investigationSteps)
          ? analysis.investigationSteps
          : [],

      confidence:
        Number(analysis.confidence) || 0,
    };


    if (analysis.category) {
      issue.category = analysis.category;
    }


    if (
      ["low", "medium", "high", "critical"].includes(
        analysis.priority
      )
    ) {
      issue.priority = analysis.priority;
    }


    /*
     * Create developer investigation checklist
     * from AI investigation steps.
     */
    if (
      (!issue.investigation ||
        issue.investigation.steps.length === 0) &&
      Array.isArray(analysis.investigationSteps)
    ) {
      issue.investigation = {
        steps: analysis.investigationSteps.map(
          (step) => ({
            text: step,
            completed: false,
          })
        ),

        findings:
          issue.investigation?.findings || "",

        resolution:
          issue.investigation?.resolution || "",
      };
    }


    await issue.save();


    return res.status(200).json({
      success: true,

      message:
        "AI analysis generated successfully.",

      analysis: {
        summary:
          issue.aiAnalysis.summary,

        possibleCause:
          issue.aiAnalysis.possibleCause,

        suggestedAction:
          issue.aiAnalysis.suggestedAction,

        investigationSteps:
          issue.aiAnalysis.investigationSteps,

        confidence:
          issue.aiAnalysis.confidence,

        category:
          issue.category,

        priority:
          issue.priority,
      },

      issue,
    });

  } catch (error) {
    console.error(
      "AI ANALYSIS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Failed to generate AI analysis.",
    });
  }
};


/**
 * POST /api/issues/:id/analyze-findings
 *
 * Analyze developer findings using Gemini.
 */
const analyzeFindingsController = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const { findings } = req.body;


    if (
      !findings ||
      typeof findings !== "string" ||
      !findings.trim()
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Developer findings are required.",
      });
    }


    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({
        success: false,

        message:
          "Issue not found.",
      });
    }


    const result = await analyzeFindings(
      issue,
      findings.trim()
    );


    /*
     * Save AI findings analysis
     * to the issue.
     */
    issue.aiFindingsAnalysis = {
      rootCause:
        result.rootCause || "",

      evidenceAssessment:
        result.evidenceAssessment || "",

      nextAction:
        result.nextAction || "",

      resolutionConfidence:
        Number(
          result.resolutionConfidence
        ) || 0,

      sufficientEvidence:
        Boolean(
          result.sufficientEvidence
        ),

      analyzedAt: new Date(),
    };


    /*
     * Also save developer findings.
     */
    if (!issue.investigation) {
      issue.investigation = {
        steps: [],
        findings: findings.trim(),
        resolution: "",
      };
    } else {
      issue.investigation.findings =
        findings.trim();
    }


    await issue.save();


    return res.status(200).json({
      success: true,

      message:
        "Findings analyzed successfully.",

      analysis:
        issue.aiFindingsAnalysis,

      issue,
    });

  } catch (error) {
    console.error(
      "FINDINGS AI ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Failed to analyze findings.",
    });
  }
};


module.exports = {
  analyzeIssueController,
  analyzeFindingsController,
};