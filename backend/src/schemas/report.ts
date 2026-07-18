// Shared JSON schema for the report contract (ARCHITECTURE.md §5).
// Used both as the Fastify route response schema (ajv validation) and
// handed to the OpenAI call as the structured-output schema.

export const markerSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    value: { type: "string" },
    unit: { type: "string" },
    refRange: { type: "string" },
    status: { type: "string", enum: ["low", "normal", "high"] },
    plainExplanation: { type: "string" },
    mayIndicate: { type: "array", items: { type: "string" } },
    urgency: { type: "string", enum: ["green", "yellow", "red"] },
    lifestyleSuggestions: { type: "array", items: { type: "string" } },
    doctorQuestions: { type: "array", items: { type: "string" } }
  },
  required: [
    "name",
    "value",
    "unit",
    "refRange",
    "status",
    "plainExplanation",
    "mayIndicate",
    "urgency",
    "lifestyleSuggestions",
    "doctorQuestions"
  ],
  additionalProperties: false
} as const;

export const reportSchema = {
  type: "object",
  properties: {
    // Nullable + listed in `required`: OpenAI strict structured-output mode
    // requires every property in `required`, so absence is modeled as null.
    patientName: { type: ["string", "null"] },
    patientAge: { type: ["string", "null"] },
    overallUrgency: { type: "string", enum: ["green", "yellow", "red"] },
    summary: { type: "string" },
    markers: { type: "array", items: markerSchema },
    disclaimer: { type: "string" }
  },
  required: [
    "patientName",
    "patientAge",
    "overallUrgency",
    "summary",
    "markers",
    "disclaimer"
  ],
  additionalProperties: false
} as const;

export type Marker = {
  name: string;
  value: string;
  unit: string;
  refRange: string;
  status: "low" | "normal" | "high";
  plainExplanation: string;
  mayIndicate: string[];
  urgency: "green" | "yellow" | "red";
  lifestyleSuggestions: string[];
  doctorQuestions: string[];
};

export type Report = {
  patientName: string | null;
  patientAge: string | null;
  overallUrgency: "green" | "yellow" | "red";
  summary: string;
  markers: Marker[];
  disclaimer: string;
};
