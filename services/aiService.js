const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const analyzeIssue = async (title, description) => {
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5.6-luna",

    input: [
      {
        role: "system",
        content: `
You are an AI software issue analyst.

Your job is to analyze software issues reported by developers.

Do not pretend you know the exact codebase or root cause when there is not enough evidence.

Provide a useful technical hypothesis based only on the information given.

The confidence score represents confidence in the analysis, not the severity of the issue.
        `,
      },
      {
        role: "user",
        content: `
Analyze this software issue.

Title:
${title}

Description:
${description}
        `,
      },
    ],

    text: {
      format: {
        type: "json_schema",

        name: "issue_analysis",

        strict: true,

        schema: {
          type: "object",

          properties: {
            category: {
              type: "string",
              enum: [
                "authentication",
                "database",
                "api",
                "performance",
                "frontend",
                "backend",
                "payment",
                "security",
                "network",
                "other",
              ],
            },

            summary: {
              type: "string",
            },

            possibleCause: {
              type: "string",
            },

            suggestedAction: {
              type: "string",
            },

            confidence: {
              type: "number",
            },
          },

          required: [
            "category",
            "summary",
            "possibleCause",
            "suggestedAction",
            "confidence",
          ],

          additionalProperties: false,
        },
      },
    },
  });

  return JSON.parse(response.output_text);
};

module.exports = {
  analyzeIssue,
};