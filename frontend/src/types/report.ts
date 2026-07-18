// Mirrors backend/src/schemas/report.ts (ARCHITECTURE.md §5) — keep in sync.

export type Urgency = "green" | "yellow" | "red";

export type Marker = {
  name: string;
  value: string;
  unit: string;
  refRange: string;
  status: "low" | "normal" | "high";
  plainExplanation: string;
  mayIndicate: string[];
  urgency: Urgency;
  lifestyleSuggestions: string[];
  doctorQuestions: string[];
};

export type Report = {
  patientName: string | null;
  patientAge: string | null;
  overallUrgency: Urgency;
  summary: string;
  markers: Marker[];
  disclaimer: string;
};

export type ChatMessage = { role: "user" | "assistant"; content: string };
