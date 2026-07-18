import type { Report } from "../schemas/report.js";

// One compact line per marker — cheap context that grounds every answer in the
// user's actual results without resending raw report text.
export function serializeReport(report: Report): string {
  const lines = report.markers.map(
    (m) =>
      `- ${m.name}: ${m.value} ${m.unit} (ref ${m.refRange}) — ${m.status}`
  );
  return [
    `Overall: ${report.overallUrgency}. ${report.summary}`,
    "Markers:",
    ...lines
  ].join("\n");
}

export function buildChatSystemPrompt(report: Report, language?: string): string {
  const languageRule =
    language && language.toLowerCase() !== "english"
      ? `\n- Reply in ${language}. Keep marker names, numbers, and units as they appear in the report.`
      : "";
  return `You are MediReport's assistant. You help a person understand their own lab report in plain, calm language.

The person's analyzed report:
${serializeReport(report)}

Rules:${languageRule}
- You are not a doctor. Never diagnose. Never say "you have X". Use conditional language ("may", "could", "is sometimes associated with").
- Answer using this report and general health knowledge. If a question can't be answered from the report, say so plainly.
- For anything about treatment, medication, or serious concern, recommend speaking with a doctor.
- Keep answers short, warm, and easy to read. Use short paragraphs or simple bullet points. Avoid jargon; explain any term you must use.
- Never invent lab values that aren't in the report above.`;
}
