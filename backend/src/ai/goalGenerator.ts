import { getClient, MODEL } from "./client.js";

export interface DailyGoals {
  reportBased: boolean;
  reportDate?: string;
  waterTargetL: number;
  stepsTarget: number;
  exerciseMinutes: number;
  exerciseType: string;
  foodsToEat: string[];
  foodsToAvoid: string[];
  sleepHours: number;
  tips: string[];
}

// General defaults when no report is available
const GENERAL: DailyGoals = {
  reportBased: false,
  waterTargetL: 2.0,
  stepsTarget: 10000,
  exerciseMinutes: 30,
  exerciseType: "brisk walk or light cardio",
  foodsToEat: ["fruits", "vegetables", "whole grains", "lean protein", "nuts"],
  foodsToAvoid: ["processed foods", "excess sugar", "fried foods", "alcohol"],
  sleepHours: 8,
  tips: [
    "Aim for 7–9 hours of sleep each night",
    "Drink water throughout the day, not just when thirsty",
    "Take a short walk after meals to aid digestion"
  ]
};

const GOALS_SCHEMA = {
  type: "object",
  properties: {
    waterTargetL: { type: "number" },
    stepsTarget: { type: "number" },
    exerciseMinutes: { type: "number" },
    exerciseType: { type: "string" },
    foodsToEat: { type: "array", items: { type: "string" } },
    foodsToAvoid: { type: "array", items: { type: "string" } },
    sleepHours: { type: "number" },
    tips: { type: "array", items: { type: "string" } }
  },
  required: ["waterTargetL", "stepsTarget", "exerciseMinutes", "exerciseType", "foodsToEat", "foodsToAvoid", "sleepHours", "tips"],
  additionalProperties: false
} as const;

const cache = new Map<string, DailyGoals>();

interface FlaggedMarker {
  name: string;
  value: string;
  unit: string;
  status: string;
  mayIndicate: string[];
  lifestyleSuggestions: string[];
}

export async function generateDailyGoals(
  reportId: string,
  reportDate: string,
  flaggedMarkers: FlaggedMarker[]
): Promise<DailyGoals> {
  if (cache.has(reportId)) return cache.get(reportId)!;

  if (flaggedMarkers.length === 0) {
    const goals = { ...GENERAL, reportBased: true, reportDate };
    cache.set(reportId, goals);
    return goals;
  }

  const markerSummary = flaggedMarkers.map((m) =>
    `${m.name}: ${m.value} ${m.unit} (${m.status}) — may indicate: ${m.mayIndicate.join(", ")}. Suggestions: ${m.lifestyleSuggestions.join("; ")}`
  ).join("\n");

  const prompt = `A patient's recent lab report flagged the following markers:

${markerSummary}

Based on these findings, generate specific, quantified daily health goals. Return JSON with exactly these fields:
- waterTargetL: daily water intake target in litres (be specific, e.g. 2.5 for kidney concerns)
- stepsTarget: daily steps target as integer (reduce if condition requires rest, e.g. 6000 for anemia)
- exerciseMinutes: daily exercise duration in minutes
- exerciseType: specific type of exercise suitable for these markers (e.g. "20 min light walking + 10 min stretching")
- foodsToEat: 5-8 specific foods that address the flagged conditions (e.g. "spinach" for low hemoglobin)
- foodsToAvoid: 4-6 specific foods to avoid given these markers
- sleepHours: recommended sleep hours (usually 7-9, but adjust for conditions like anemia or hypothyroidism)
- tips: 3-4 concise, actionable daily tips directly addressing the flagged markers`;

  const response = await getClient().chat.completions.create({
    model: MODEL,
    temperature: 0,
    messages: [{ role: "user", content: prompt }],
    response_format: {
      type: "json_schema",
      json_schema: { name: "daily_goals", strict: true, schema: GOALS_SCHEMA }
    }
  });

  const raw = JSON.parse(response.choices[0]?.message.content ?? "{}") as Omit<DailyGoals, "reportBased" | "reportDate">;
  const goals: DailyGoals = { ...raw, reportBased: true, reportDate };
  cache.set(reportId, goals);
  return goals;
}

export { GENERAL as GENERAL_GOALS };
