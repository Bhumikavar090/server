const { GoogleGenAI, Type } = require("@google/genai");

const PRIMARY_MODEL =
  process.env.GEMINI_MODEL || "gemini-3.8-flash";

/*
|--------------------------------------------------------------------------
| Fallback models
|--------------------------------------------------------------------------
*/

const FALLBACK_MODELS = [
  PRIMARY_MODEL,
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
];

/*
|--------------------------------------------------------------------------
| Gemini client
|--------------------------------------------------------------------------
*/

const getAIClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured in environment variables."
    );
  }

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
};


/*
|--------------------------------------------------------------------------
| Parse JSON response
|--------------------------------------------------------------------------
*/

const parseGeminiJSON = (response) => {
  if (!response) {
    throw new Error("Gemini returned no response.");
  }

  const text = response.text;

  if (!text || typeof text !== "string") {
    console.error("Gemini response:", response);

    throw new Error(
      "Gemini returned an empty response."
    );
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error(
      "Gemini returned invalid JSON:"
    );

    console.error(text);

    throw new Error(
      "Gemini returned invalid JSON."
    );
  }
};


/*
|--------------------------------------------------------------------------
| Check whether error is temporary
|--------------------------------------------------------------------------
*/

const isTemporaryGeminiError = (error) => {
  const message =
    error?.message?.toLowerCase() || "";

  return (
    message.includes("503") ||
    message.includes("unavailable") ||
    message.includes("high demand") ||
    message.includes("temporarily") ||
    message.includes("overloaded") ||
    message.includes("rate limit") ||
    message.includes("429")
  );
};


/*
|--------------------------------------------------------------------------
| Generate Gemini response with fallback
|--------------------------------------------------------------------------
*/

const generateWithFallback = async ({
  prompt,
  responseSchema,
}) => {
  const ai = getAIClient();

  const models = [
    ...new Set(FALLBACK_MODELS),
  ];

  let lastError = null;

  for (const model of models) {

    console.log(
      `\n[DevTrace AI] Trying model: ${model}`
    );

    for (let attempt = 1; attempt <= 2; attempt++) {

      try {

        const response =
          await ai.models.generateContent({
            model,

            contents: prompt,

            config: {
              responseMimeType:
                "application/json",

              responseSchema,
            },
          });

        console.log(
          `[DevTrace AI] ${model} succeeded.`
        );

        return response;

      } catch (error) {

        lastError = error;

        console.error(
          `[DevTrace AI] ${model} attempt ${attempt} failed:`
        );

        console.error(
          error?.message || error
        );

        /*
        |--------------------------------------------------------------------------
        | If this isn't a temporary error,
        | don't blindly try every model.
        |--------------------------------------------------------------------------
        */

        if (!isTemporaryGeminiError(error)) {
          throw error;
        }

        /*
        |--------------------------------------------------------------------------
        | Small retry delay
        |--------------------------------------------------------------------------
        */

        if (attempt === 1) {

          await new Promise(
            (resolve) =>
              setTimeout(resolve, 1000)
          );

        }
      }
    }

    console.log(
      `[DevTrace AI] ${model} unavailable. Trying fallback...`
    );
  }

  throw new Error(
    lastError?.message ||
      "All Gemini models are currently unavailable."
  );
};


/*
|--------------------------------------------------------------------------
| Analyze Issue
|--------------------------------------------------------------------------
*/

const analyzeIssue = async (issue) => {

  const prompt = `
You are DevTrace AI, an expert software debugging
and incident investigation assistant.

Analyze the following software engineering issue.

ISSUE TITLE:
${issue.title}

DESCRIPTION:
${issue.description}

TECHNICAL CONTEXT:
${issue.technicalContext || "No technical context provided."}

CURRENT STATUS:
${issue.status}

CURRENT PRIORITY:
${issue.priority}

CURRENT CATEGORY:
${issue.category || "unclassified"}

Your job is to help a developer investigate
the problem.

Return ONLY JSON matching the requested schema.

Rules:

1. summary:
Give a concise technical explanation of the issue.

2. possibleCause:
Identify the most likely technical cause.
Do not pretend certainty when evidence is insufficient.

3. suggestedAction:
Give the most useful immediate debugging action.

4. investigationSteps:
Give 4-7 practical debugging steps.
Order them from easiest/highest-signal investigation
to deeper investigation.

5. confidence:
Give a number from 0 to 100.
Base confidence ONLY on the supplied evidence.

6. category:
Choose one:

frontend
backend
database
api
authentication
performance
deployment
networking
security
configuration
testing
infrastructure
other

7. priority:
Choose one:

low
medium
high
critical

Do not invent logs, stack traces,
errors, measurements, or facts.

Be technical, concise and practical.
`;


  const response =
    await generateWithFallback({

      prompt,

      responseSchema: {
        type: Type.OBJECT,

        properties: {

          summary: {
            type: Type.STRING,
          },

          possibleCause: {
            type: Type.STRING,
          },

          suggestedAction: {
            type: Type.STRING,
          },

          investigationSteps: {
            type: Type.ARRAY,

            items: {
              type: Type.STRING,
            },
          },

          confidence: {
            type: Type.NUMBER,
          },

          category: {
            type: Type.STRING,
          },

          priority: {
            type: Type.STRING,
          },

        },

        required: [
          "summary",
          "possibleCause",
          "suggestedAction",
          "investigationSteps",
          "confidence",
          "category",
          "priority",
        ],
      },
    });


  const result =
    parseGeminiJSON(response);


  /*
  |--------------------------------------------------------------------------
  | Normalize response
  |--------------------------------------------------------------------------
  */

  return {

    summary:
      result.summary || "",

    possibleCause:
      result.possibleCause || "",

    suggestedAction:
      result.suggestedAction || "",

    investigationSteps:
      Array.isArray(
        result.investigationSteps
      )
        ? result.investigationSteps
        : [],

    confidence:
      Math.max(
        0,
        Math.min(
          100,
          Number(result.confidence) || 0
        )
      ),

    category:
      result.category || "other",

    priority:
      [
        "low",
        "medium",
        "high",
        "critical",
      ].includes(result.priority)
        ? result.priority
        : "medium",
  };
};


/*
|--------------------------------------------------------------------------
| Analyze Developer Findings
|--------------------------------------------------------------------------
*/

const analyzeFindings = async (
  issue,
  findings
) => {

  const prompt = `
You are DevTrace AI, an expert software
debugging and incident investigation assistant.

The developer is investigating this issue.

ISSUE TITLE:
${issue.title}

DESCRIPTION:
${issue.description}

TECHNICAL CONTEXT:
${issue.technicalContext || "No technical context."}

PREVIOUS AI SUMMARY:
${issue.aiAnalysis?.summary || "No previous summary."}

PREVIOUS POSSIBLE CAUSE:
${issue.aiAnalysis?.possibleCause || "Unknown."}

DEVELOPER FINDINGS:
${findings}

Analyze the developer findings.

Determine:

1. Whether the findings support or contradict
the previous possible cause.

2. The most likely root cause based ONLY
on the available evidence.

3. What the developer should investigate next.

4. Whether the evidence is sufficient to
confidently resolve the issue.

Do not invent evidence.

Be explicit when evidence is insufficient.

Return ONLY JSON matching the requested schema.
`;


  const response =
    await generateWithFallback({

      prompt,

      responseSchema: {
        type: Type.OBJECT,

        properties: {

          rootCause: {
            type: Type.STRING,
          },

          evidenceAssessment: {
            type: Type.STRING,
          },

          nextAction: {
            type: Type.STRING,
          },

          resolutionConfidence: {
            type: Type.NUMBER,
          },

          sufficientEvidence: {
            type: Type.BOOLEAN,
          },

        },

        required: [
          "rootCause",
          "evidenceAssessment",
          "nextAction",
          "resolutionConfidence",
          "sufficientEvidence",
        ],
      },
    });


  const result =
    parseGeminiJSON(response);


  return {

    rootCause:
      result.rootCause || "",

    evidenceAssessment:
      result.evidenceAssessment || "",

    nextAction:
      result.nextAction || "",

    resolutionConfidence:
      Math.max(
        0,
        Math.min(
          100,
          Number(
            result.resolutionConfidence
          ) || 0
        )
      ),

    sufficientEvidence:
      Boolean(
        result.sufficientEvidence
      ),
  };
};


/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  analyzeIssue,
  analyzeFindings,
};