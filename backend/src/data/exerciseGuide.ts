// Static, condition-keyed yoga + exercise suggestions. Deterministic and free —
// powers the dashboard without any AI. Matched by keyword against the user's
// listed conditions AND against flagged lab marker names from the latest report.

export type GuideEntry = {
  condition: string;
  yoga: string[];
  exercises: string[];
};

const GUIDE: { keywords: string[]; entry: GuideEntry }[] = [
  {
    // Lab markers: TSH, T3, T4, Free T4, Free T3
    keywords: ["thyroid", "hypothyroid", "hyperthyroid", "tsh", "t3", "t4", "free t"],
    entry: {
      condition: "Thyroid health",
      yoga: ["Sarvangasana (shoulder stand)", "Matsyasana (fish pose)", "Ujjayi pranayama"],
      exercises: ["Brisk walking 30 min", "Light strength training", "Stretching"]
    }
  },
  {
    // Lab markers: Blood Glucose, HbA1c, Fasting Glucose, Post-Prandial Glucose, Insulin
    keywords: ["diabetes", "sugar", "glucose", "hba1c", "glycated", "insulin", "fasting blood", "post-prandial"],
    entry: {
      condition: "Blood sugar",
      yoga: ["Surya Namaskar (sun salutation)", "Dhanurasana (bow pose)", "Kapalbhati pranayama"],
      exercises: ["Post-meal walking 15 min", "Cycling", "Resistance bands"]
    }
  },
  {
    // Lab markers: Total Cholesterol, LDL, HDL, Triglycerides, VLDL, Blood Pressure
    keywords: ["hypertension", "blood pressure", "bp", "cardio", "cholesterol", "heart", "ldl", "hdl", "triglyceride", "vldl", "lipid"],
    entry: {
      condition: "Heart & blood pressure",
      yoga: ["Shavasana (relaxation)", "Anulom Vilom (alternate nostril breathing)", "Sukhasana (easy pose)"],
      exercises: ["Brisk walking 30 min", "Swimming", "Light aerobic activity"]
    }
  },
  {
    // Lab markers: Hemoglobin, RBC, Hematocrit, Serum Iron, Ferritin, MCV
    keywords: ["anemia", "hemoglobin", "haemoglobin", "iron", "ferritin", "rbc", "hematocrit", "haematocrit", "mcv", "serum iron"],
    entry: {
      condition: "Blood & energy",
      yoga: ["Gentle Surya Namaskar", "Bhujangasana (cobra pose)", "Deep breathing (Pranayama)"],
      exercises: ["Short 10–15 min walks", "Gentle stretching", "Low-intensity yoga"]
    }
  },
  {
    // Lab markers: Creatinine, BUN, eGFR, Uric Acid, Urea
    keywords: ["kidney", "renal", "creatinine", "egfr", "urea", "bun", "uric acid", "gfr"],
    entry: {
      condition: "Kidney health",
      yoga: ["Pawanmuktasana (wind-relieving pose)", "Bhujangasana (cobra pose)", "Deep abdominal breathing"],
      exercises: ["Gentle walking 20 min", "Light stretching", "Avoid heavy lifting"]
    }
  },
  {
    // Lab markers: AST, ALT, SGPT, SGOT, Bilirubin, GGT, ALP, Liver enzymes
    keywords: ["liver", "hepatic", "ast", "alt", "sgpt", "sgot", "bilirubin", "ggt", "alp", "alkaline phosphatase"],
    entry: {
      condition: "Liver health",
      yoga: ["Ardha Matsyendrasana (spinal twist)", "Balasana (child's pose)", "Kapalbhati"],
      exercises: ["Light walking 20 min", "Gentle yoga", "Avoid strenuous exercise"]
    }
  },
  {
    // Lab markers: Vitamin D, Calcium, Phosphorus, PTH, Bone density
    keywords: ["vitamin d", "calcium", "phosphorus", "bone", "pth", "parathyroid", "osteoporosis", "rickets"],
    entry: {
      condition: "Bone & vitamin D",
      yoga: ["Trikonasana (triangle pose)", "Vrikshasana (tree pose)", "Tadasana (mountain pose)"],
      exercises: ["Weight-bearing walking 30 min", "Light resistance training", "Outdoor activity for sunlight"]
    }
  },
  {
    // Lab markers: Vitamin B12, Folate, Folic Acid
    keywords: ["vitamin b12", "b12", "folate", "folic acid", "cobalamin"],
    entry: {
      condition: "Vitamin B12 & folate",
      yoga: ["Surya Namaskar (gentle)", "Pranayama breathing", "Shavasana"],
      exercises: ["Light walking", "Gentle stretching", "Avoid over-exertion until levels improve"]
    }
  },
  {
    // Lab markers: WBC, Neutrophils, Lymphocytes, CRP, ESR (inflammation / infection markers)
    keywords: ["infection", "immunity", "wbc", "white blood", "neutrophil", "lymphocyte", "crp", "esr", "inflammation", "c-reactive"],
    entry: {
      condition: "Immune support",
      yoga: ["Pranayama (Anulom Vilom)", "Bhramari (humming bee breath)", "Shavasana"],
      exercises: ["Rest-focused; light 10 min walks only", "Gentle yoga", "Avoid intense exercise while inflamed"]
    }
  }
];

const GENERAL: GuideEntry = {
  condition: "General wellness",
  yoga: ["Surya Namaskar (sun salutation)", "Tadasana (mountain pose)", "Anulom Vilom breathing"],
  exercises: ["30 min brisk walk", "Basic stretching", "Bodyweight exercises"]
};

// Returns one guide entry per matched condition (deduped), or general wellness.
// Pass both profile conditions AND flagged lab marker names for best matching.
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
