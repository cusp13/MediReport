import type { Report, Marker } from "../types/report";

export type SpecialtyId =
  | "endocrinologist"
  | "diabetologist"
  | "cardiologist"
  | "nephrologist"
  | "hepatologist"
  | "hematologist"
  | "general";

export type Specialty = {
  id: SpecialtyId;
  name: string;
  blurb: string;
};

export const SPECIALTIES: Record<SpecialtyId, Specialty> = {
  endocrinologist: {
    id: "endocrinologist",
    name: "Endocrinologist",
    blurb: "Specialists in hormones and the thyroid gland."
  },
  diabetologist: {
    id: "diabetologist",
    name: "Diabetologist",
    blurb: "Specialists in blood sugar and diabetes care."
  },
  cardiologist: {
    id: "cardiologist",
    name: "Cardiologist",
    blurb: "Specialists in the heart and cholesterol."
  },
  nephrologist: {
    id: "nephrologist",
    name: "Nephrologist",
    blurb: "Specialists in kidney health."
  },
  hepatologist: {
    id: "hepatologist",
    name: "Hepatologist",
    blurb: "Specialists in the liver."
  },
  hematologist: {
    id: "hematologist",
    name: "Hematologist",
    blurb: "Specialists in blood and blood counts."
  },
  general: {
    id: "general",
    name: "General Physician",
    blurb: "A great first stop for overall health and guidance."
  }
};

// Keyword → specialty. Checked against the lowercased marker name.
const RULES: { specialty: SpecialtyId; keywords: string[] }[] = [
  { specialty: "cardiologist", keywords: ["cholesterol", "hdl", "ldl", "triglycer", "lipid", "vldl"] },
  { specialty: "diabetologist", keywords: ["glucose", "hba1c", "sugar", "insulin"] },
  { specialty: "endocrinologist", keywords: ["tsh", "thyroid", "thyroxine", "t3", "t4"] },
  { specialty: "nephrologist", keywords: ["creatinine", "urea", "bun", "egfr", "uric acid"] },
  { specialty: "hepatologist", keywords: ["alt", "ast", "sgpt", "sgot", "bilirubin", "alkaline phosphatase", "ggt"] },
  { specialty: "hematologist", keywords: ["hemoglobin", "haemoglobin", "hgb", "rbc", "wbc", "platelet", "hematocrit", "haematocrit", "mcv", "mch", "neutrophil", "lymphocyte"] }
];

function specialtyForMarker(marker: Marker): SpecialtyId {
  const name = marker.name.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => name.includes(k))) return rule.specialty;
  }
  return "general";
}

const urgencyRank: Record<Marker["urgency"], number> = {
  green: 0,
  yellow: 1,
  red: 2
};

export type Recommendation = {
  specialty: Specialty;
  markers: string[]; // flagged marker names driving this recommendation
  topUrgency: Marker["urgency"];
};

// Turns flagged markers into an ordered set of specialist recommendations.
// Most urgent specialty first. If nothing is flagged, suggests a routine
// general check-up.
export function recommendSpecialties(report: Report): Recommendation[] {
  const flagged = report.markers.filter((m) => m.status !== "normal");
  if (flagged.length === 0) {
    return [
      { specialty: SPECIALTIES.general, markers: [], topUrgency: "green" }
    ];
  }

  const bySpecialty = new Map<SpecialtyId, Recommendation>();
  for (const marker of flagged) {
    const id = specialtyForMarker(marker);
    const existing = bySpecialty.get(id);
    if (existing) {
      existing.markers.push(marker.name);
      if (urgencyRank[marker.urgency] > urgencyRank[existing.topUrgency]) {
        existing.topUrgency = marker.urgency;
      }
    } else {
      bySpecialty.set(id, {
        specialty: SPECIALTIES[id],
        markers: [marker.name],
        topUrgency: marker.urgency
      });
    }
  }

  return [...bySpecialty.values()].sort(
    (a, b) => urgencyRank[b.topUrgency] - urgencyRank[a.topUrgency]
  );
}
