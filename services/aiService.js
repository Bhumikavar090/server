const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const analyzeIssue = async (
  title,
  description,
  technicalContext = ""
) => {
  const prompt = `
You are DevTraxe AI, an intelligent software issue investigation assistant.

Analyze the reported software issue using the information provided.

IMPORTANT RULES:

- Do not claim an exact root cause unless the evidence clearly proves it.
- Clearly distinguish likely causes from confirmed information.
- Use the technical context when available.
- Give practical investigation steps a software developer can follow.
- Keep the analysis concise but technically useful.
- Confidence should represent how strongly the provided evidence supports the analysis.

ISSUE TITLE:
${title}

ISSUE DESCRIPTION:
${description}

TECHNICAL CONTEXT:
${technicalContext || "No additional technical context was provided."}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",

    contents: prompt,

    config: {
      responseMimeType: "application/json",

      responseSchema: {
        type: "object",

        properties: {
          category: {
            type: "string",
            description:
              "Technical category such as frontend, backend, database, authentication, deployment, networking, performance, or other.",
          },

          summary: {
            type: "string",
            description:
              "A short technical summary of the reported issue.",
          },

          possibleCause: {
            type: "string",
            description:
              "The most likely cause based only on the available evidence.",
          },

          suggestedAction: {
            type: "string",
            description:
              "The most useful immediate action for the developer.",
          },

          investigationSteps: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "Three to five practical steps a developer can follow to investigate the issue.",
          },

          confidence: {
            type: "integer",
            description:
              "Confidence percentage from 0 to 100.",
          },
        },

        required: [
          "category",
          "summary",
          "possibleCause",
          "suggestedAction",
          "investigationSteps",
          "confidence",
        ],
      },
    },
  });

  const analysis = JSON.parse(response.text);

  return {
    category: analysis.category,
    summary: analysis.summary,
    possibleCause: analysis.possibleCause,
    suggestedAction: analysis.suggestedAction,
    investigationSteps: analysis.investigationSteps,
    confidence: Math.min(
      100,
      Math.max(0, analysis.confidence)
    ),
  };
};

module.exports = {
  analyzeIssue,
};