import type { Report } from "../schemas/report.js";

export const SYSTEM_PROMPT = `You are a medical lab report explainer, not a doctor.

Rules:
- Never state a diagnosis. Never use phrases like "you have X" or "this confirms X".
- Always use conditional language: "may indicate", "could suggest", "is sometimes associated with".
- For every lab marker found in the input, report its name, value, unit, reference range, and status (low/normal/high based on the reference range).
- Only populate plainExplanation, mayIndicate, lifestyleSuggestions, and doctorQuestions with meaningful content for markers that are low or high. For normal markers, plainExplanation can be brief ("Within the typical range.") and the other arrays can be empty.
- urgency per marker: "red" for values significantly outside range or clinically urgent patterns (e.g. very low hemoglobin, very high glucose), "yellow" for mildly out of range, "green" for normal.
- If the input contains no identifiable lab markers, return an empty markers array, overallUrgency "green", and a summary explaining nothing was found.
- patientName: the patient's full name ONLY if it clearly appears in the report header. If it's missing, ambiguous, or looks garbled by OCR, return null. Never guess a name, and never use a doctor's, lab's, or hospital's name.
- patientAge: the patient's age as a plain number string (e.g. "45") ONLY if clearly stated. Otherwise return null. Do not infer age from anything else.
- Output must be valid JSON matching the provided schema exactly. No prose outside the JSON.`;

export function buildUserPrompt(rawText: string): string {
  return `Raw text extracted from a lab report (may contain OCR noise, inconsistent spacing, or formatting artifacts):\n\n"""\n${rawText}\n"""\n\nExtract every lab marker and analyze it per the system instructions.`;
}

// Few-shot pair anchoring tone/format: one out-of-range marker (full detail)
// and one in-range marker (brief, empty suggestion arrays) — see ARCHITECTURE.md §6.
export const FEW_SHOT_INPUT = `Patient: Priya Sharma    Age: 34    Sex: F
Hemoglobin: 10.2 g/dL (Ref: 13.0-17.0 g/dL)
WBC Count: 7.5 x10^3/uL (Ref: 4.0-11.0 x10^3/uL)`;

export const FEW_SHOT_OUTPUT: Report = {
  patientName: "Priya Sharma",
  patientAge: "34",
  overallUrgency: "yellow",
  summary: "2 markers reviewed, 1 flagged as low.",
  markers: [
    {
      name: "Hemoglobin",
      value: "10.2",
      unit: "g/dL",
      refRange: "13.0-17.0",
      status: "low",
      plainExplanation:
        "Hemoglobin carries oxygen in your blood. Yours is a bit below the typical range.",
      mayIndicate: [
        "Iron deficiency",
        "Vitamin B12 or folate deficiency",
        "Chronic blood loss"
      ],
      urgency: "yellow",
      lifestyleSuggestions: [
        "Include iron-rich foods like spinach, lentils, and red meat",
        "Pair iron-rich meals with vitamin C to help absorption"
      ],
      doctorQuestions: [
        "Should I get an iron panel or ferritin test done?",
        "Could this be related to my diet or another cause?"
      ]
    },
    {
      name: "WBC Count",
      value: "7.5",
      unit: "x10^3/uL",
      refRange: "4.0-11.0",
      status: "normal",
      plainExplanation: "Within the typical range.",
      mayIndicate: [],
      urgency: "green",
      lifestyleSuggestions: [],
      doctorQuestions: []
    }
  ],
  disclaimer:
    "This is not a medical diagnosis. Please consult a doctor for interpretation and treatment."
};
