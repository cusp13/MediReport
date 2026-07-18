import { reportSchema, type Report } from "../schemas/report.js";
import { getClient, MODEL } from "./client.js";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  FEW_SHOT_INPUT,
  FEW_SHOT_OUTPUT
} from "./prompt.js";

const MAX_ATTEMPTS = 2;

const urgencyRank: Record<Report["overallUrgency"], number> = {
  green: 0,
  yellow: 1,
  red: 2
};

function deriveOverallUrgency(report: Report): Report["overallUrgency"] {
  let max: Report["overallUrgency"] = "green";
  for (const marker of report.markers) {
    if (urgencyRank[marker.urgency] > urgencyRank[max]) max = marker.urgency;
  }
  return max;
}

async function callModel(rawText: string): Promise<Report> {
  const completion = await getClient().chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(FEW_SHOT_INPUT) },
      { role: "assistant", content: JSON.stringify(FEW_SHOT_OUTPUT) },
      { role: "user", content: buildUserPrompt(rawText) }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "medireport_analysis",
        strict: true,
        schema: reportSchema
      }
    }
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from model");

  const parsed = JSON.parse(content) as Report;
  parsed.overallUrgency = deriveOverallUrgency(parsed);
  return parsed;
}

// One retry on transient failures (empty response, unparseable JSON) —
// ARCHITECTURE.md §4 step 5.
export async function analyzeReportText(rawText: string): Promise<Report> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await callModel(rawText);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}
