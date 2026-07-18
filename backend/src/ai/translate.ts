import { reportSchema, type Report } from "../schemas/report.js";
import { getClient, MODEL } from "./client.js";

// Translates only the human-readable text of an already-analyzed report into the
// target language. Numbers, units, reference ranges, statuses, and urgencies are
// kept exactly so the gauges and triage logic stay correct.
export async function translateReport(
  report: Report,
  language: string
): Promise<Report> {
  const completion = await getClient().chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `You translate a medical lab report app's text into ${language}, for a general reader.

Translate into ${language}: summary, and for each marker its plainExplanation, mayIndicate, lifestyleSuggestions, and doctorQuestions, and the disclaimer.
Keep EXACTLY as given (do not translate or change): patientName, patientAge, each marker's name, value, unit, refRange, status, urgency, and overallUrgency.
Do not add, remove, or reorder markers. Use simple, warm, non-technical ${language}. Return valid JSON matching the schema.`
      },
      { role: "user", content: JSON.stringify(report) }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "translated_report",
        strict: true,
        schema: reportSchema
      }
    }
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Empty translation response");
  return JSON.parse(content) as Report;
}
