// Static, condition-keyed yoga + exercise suggestions. Deterministic and free —
// powers the dashboard without any AI. Matched by keyword against the user's
// listed conditions; falls back to "general" wellness.

export type GuideEntry = {
  condition: string;
  yoga: string[];
  exercises: string[];
};

const GUIDE: { keywords: string[]; entry: GuideEntry }[] = [
  {
    keywords: ["thyroid", "hypothyroid", "hyperthyroid", "tsh"],
    entry: {
      condition: "Thyroid health",
      yoga: ["Sarvangasana (shoulder stand)", "Matsyasana (fish pose)", "Ujjayi pranayama"],
      exercises: ["Brisk walking 30 min", "Light strength training"]
    }
  },
  {
    keywords: ["diabetes", "sugar", "glucose", "hba1c", "insulin"],
    entry: {
      condition: "Blood sugar",
      yoga: ["Surya Namaskar (sun salutation)", "Dhanurasana (bow pose)", "Kapalbhati pranayama"],
      exercises: ["Post-meal walking 15 min", "Cycling", "Resistance bands"]
    }
  },
  {
    keywords: ["hypertension", "blood pressure", "bp", "cardio", "cholesterol", "heart"],
    entry: {
      condition: "Heart & blood pressure",
      yoga: ["Shavasana (relaxation)", "Anulom Vilom (alternate nostril breathing)", "Sukhasana"],
      exercises: ["Brisk walking 30 min", "Swimming", "Light aerobic activity"]
    }
  },
  {
    keywords: ["anemia", "hemoglobin", "iron"],
    entry: {
      condition: "Blood & energy",
      yoga: ["Gentle Surya Namaskar", "Bhujangasana (cobra pose)", "Deep breathing"],
      exercises: ["Short walks", "Gentle stretching", "Low-intensity yoga"]
    }
  }
];

const GENERAL: GuideEntry = {
  condition: "General wellness",
  yoga: ["Surya Namaskar (sun salutation)", "Tadasana (mountain pose)", "Anulom Vilom breathing"],
  exercises: ["30 min brisk walk", "Basic stretching", "Bodyweight exercises"]
};

// Returns one guide entry per matched condition (deduped), or general wellness.
export function guideForConditions(conditions: string[]): GuideEntry[] {
  const matched = new Map<string, GuideEntry>();
  for (const c of conditions) {
    const lower = c.toLowerCase();
    for (const rule of GUIDE) {
      if (rule.keywords.some((k) => lower.includes(k))) {
        matched.set(rule.entry.condition, rule.entry);
      }
    }
  }
  return matched.size > 0 ? [...matched.values()] : [GENERAL];
}
