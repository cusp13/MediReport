import type { Report } from "../types/report";

// A realistic canned result so visitors (and demo judges) can experience the
// full flow in one click — no upload, no OpenAI call.
export const SAMPLE_REPORT: Report = {
  patientName: "Priya Sharma",
  patientAge: "34",
  overallUrgency: "yellow",
  summary:
    "5 markers checked. Most look healthy, with two worth reviewing with your doctor.",
  markers: [
    {
      name: "Hemoglobin",
      value: "10.2",
      unit: "g/dL",
      refRange: "13.0–17.0",
      status: "low",
      plainExplanation:
        "Hemoglobin carries oxygen around your body. Yours is a little below the typical range, which can sometimes leave you feeling tired.",
      mayIndicate: [
        "Iron deficiency",
        "Vitamin B12 or folate deficiency",
        "Ongoing blood loss"
      ],
      urgency: "yellow",
      lifestyleSuggestions: [
        "Include iron-rich foods like spinach, lentils, and beans",
        "Pair them with vitamin C (citrus, tomatoes) to help absorption"
      ],
      doctorQuestions: [
        "Should I get an iron or ferritin test done?",
        "Could my diet be the cause, or is something else worth checking?"
      ]
    },
    {
      name: "Vitamin D",
      value: "18",
      unit: "ng/mL",
      refRange: "30–100",
      status: "low",
      plainExplanation:
        "Vitamin D helps your body absorb calcium and keep bones strong. Yours is below the usual range, which is very common.",
      mayIndicate: [
        "Limited sun exposure",
        "Low dietary vitamin D",
        "Reduced absorption"
      ],
      urgency: "yellow",
      lifestyleSuggestions: [
        "Get a little safe sunlight most days",
        "Consider vitamin-D-rich foods like fortified milk, eggs, and fish"
      ],
      doctorQuestions: [
        "Would a vitamin D supplement help, and at what dose?"
      ]
    },
    {
      name: "Fasting Glucose",
      value: "92",
      unit: "mg/dL",
      refRange: "70–99",
      status: "normal",
      plainExplanation: "Within the typical range.",
      mayIndicate: [],
      urgency: "green",
      lifestyleSuggestions: [],
      doctorQuestions: []
    },
    {
      name: "Total Cholesterol",
      value: "185",
      unit: "mg/dL",
      refRange: "125–200",
      status: "normal",
      plainExplanation: "Within the typical range.",
      mayIndicate: [],
      urgency: "green",
      lifestyleSuggestions: [],
      doctorQuestions: []
    },
    {
      name: "TSH",
      value: "2.1",
      unit: "mIU/L",
      refRange: "0.4–4.0",
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

// Lightweight numeric data for the animated hero gauges (independent of the
// full result above so gauge math stays simple).
export type PreviewGauge = {
  name: string;
  value: number;
  low: number;
  high: number;
  display: string;
  status: "low" | "normal" | "high";
};

export const PREVIEW_GAUGES: PreviewGauge[] = [
  { name: "Hemoglobin", value: 10.2, low: 13, high: 17, display: "10.2 g/dL", status: "low" },
  { name: "Vitamin D", value: 18, low: 30, high: 100, display: "18 ng/mL", status: "low" },
  { name: "Fasting Glucose", value: 92, low: 70, high: 99, display: "92 mg/dL", status: "normal" }
];
