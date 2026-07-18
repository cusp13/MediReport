interface Guidelines {
  dietRestrictions: string[];
  safeExercises: string[];
  redFlags: string[];
}

const GUIDELINES: Record<string, Record<string, Guidelines>> = {
  typhoid: {
    acute: {
      dietRestrictions: [
        "No raw vegetables or salads",
        "No spicy or oily foods",
        "No dairy products",
        "No high-fiber foods",
        "No street food or restaurant food"
      ],
      safeExercises: ["Complete bed rest — no exercise"],
      redFlags: [
        "Fever above 39.5°C",
        "Severe abdominal pain or rigidity",
        "Bloody stools",
        "Confusion or altered consciousness",
        "Signs of dehydration: no urine for 8+ hours"
      ]
    },
    recovery: {
      dietRestrictions: [
        "Avoid raw vegetables for 3 more weeks",
        "No spicy foods yet",
        "No alcohol",
        "No street food"
      ],
      safeExercises: [
        "5–10 minute gentle walk when fever-free 48 hours and energy ≥ 5/10",
        "Light stretching"
      ],
      redFlags: [
        "Fever returning after apparent recovery (relapse)",
        "Severe abdominal pain",
        "Bloody stools",
        "Jaundice (yellow eyes/skin)"
      ]
    },
    resolved: {
      dietRestrictions: ["No alcohol for 4 weeks post-recovery", "No NSAIDs — use paracetamol only"],
      safeExercises: [
        "Walking — increase duration weekly",
        "Yoga and stretching",
        "Light strength training after 6 weeks"
      ],
      redFlags: ["Jaundice", "Persistent fatigue beyond 6 weeks", "Recurring fever"]
    }
  },
  dengue: {
    acute: {
      dietRestrictions: [
        "No aspirin or ibuprofen — risk of bleeding",
        "No alcohol",
        "No caffeine"
      ],
      safeExercises: ["Complete bed rest"],
      redFlags: [
        "Bleeding gums or nose",
        "Blood in urine, stools, or vomit",
        "Severe abdominal pain",
        "Rapid breathing",
        "Platelet count below 50,000",
        "Petechiae (red spots on skin)"
      ]
    },
    recovery: {
      dietRestrictions: ["Continue high fluid intake", "Avoid alcohol"],
      safeExercises: ["Light walking when fever-free 48+ hours"],
      redFlags: ["Fever returning", "Bleeding", "Severe fatigue beyond 2 weeks"]
    }
  },
  malaria: {
    acute: {
      dietRestrictions: [
        "No alcohol — interferes with antimalarials",
        "Avoid fatty foods during fever spikes"
      ],
      safeExercises: ["Complete bed rest during fever cycles"],
      redFlags: [
        "Loss of consciousness",
        "Seizures",
        "Severe vomiting preventing medication",
        "Jaundice",
        "Dark urine (blackwater fever)"
      ]
    },
    recovery: {
      dietRestrictions: ["No alcohol until course complete + 1 week"],
      safeExercises: ["Light walking when fever-free"],
      redFlags: ["Fever returning after treatment", "Jaundice", "Extreme weakness"]
    }
  },
  diabetes: {
    acute: {
      dietRestrictions: [
        "No sugary drinks or fruit juices",
        "No white bread, white rice, refined carbs",
        "No skipping meals"
      ],
      safeExercises: [
        "30 min brisk walking",
        "Cycling",
        "Swimming — check BG before and after"
      ],
      redFlags: [
        "Blood glucose above 300 mg/dL",
        "Ketones in urine",
        "Chest pain",
        "Numbness or tingling in feet",
        "Vision changes"
      ]
    },
    recovery: {
      dietRestrictions: ["Maintain low-GI diet", "Limit alcohol strictly"],
      safeExercises: ["Regular 30 min moderate exercise most days"],
      redFlags: ["Hypoglycemia: shaking, sweating, confusion", "Foot wounds not healing"]
    }
  },
  anemia: {
    acute: {
      dietRestrictions: [
        "Avoid tea and coffee within 1 hour of iron supplements",
        "Avoid calcium-rich foods with iron supplements",
        "No alcohol"
      ],
      safeExercises: [
        "Light walking — short durations",
        "Avoid high-intensity exercise until Hb > 10 g/dL"
      ],
      redFlags: [
        "Chest pain or shortness of breath at rest",
        "Palpitations",
        "Fainting",
        "Extreme pallor",
        "Hemoglobin below 7 g/dL"
      ]
    },
    recovery: {
      dietRestrictions: ["Maintain iron-rich diet", "Pair iron foods with vitamin C"],
      safeExercises: [
        "Gradually increase aerobic exercise as Hb improves",
        "Strength training when Hb > 11 g/dL"
      ],
      redFlags: ["Symptoms returning after 3 months of treatment", "Black stools (GI bleeding)"]
    }
  }
};

export const conditionGuidelinesSchema = {
  name: "get_condition_stage_guidelines",
  description:
    "Returns diet restrictions, safe exercises, and red-flag warning signs for a given condition and recovery stage.",
  inputSchema: {
    type: "object" as const,
    properties: {
      condition: { type: "string", description: "Condition name e.g. typhoid, dengue, malaria" },
      stage: {
        type: "string",
        enum: ["acute", "recovery", "resolved"],
        description: "Current stage of the condition"
      }
    },
    required: ["condition", "stage"]
  }
};

export function getConditionGuidelines(args: {
  condition: string;
  stage: string;
}): Guidelines {
  const condKey = args.condition.toLowerCase().trim();
  const stageKey = args.stage.toLowerCase().trim();
  return (
    GUIDELINES[condKey]?.[stageKey] ?? {
      dietRestrictions: ["Eat soft, nutritious foods. Stay hydrated."],
      safeExercises: ["Rest during acute phase; light walking during recovery."],
      redFlags: ["High fever (>39°C)", "Severe pain", "Altered consciousness → seek immediate care"]
    }
  );
}
