// Simplified nutrition lookup — calories and protein per common item.
// Sufficient for hackathon demo; swap with a real API later.
const NUTRITION_TABLE: Record<string, { calories: number; proteinG: number }> = {
  rice: { calories: 206, proteinG: 4 },
  "boiled rice": { calories: 206, proteinG: 4 },
  "rice porridge": { calories: 90, proteinG: 2 },
  dal: { calories: 120, proteinG: 8 },
  lentils: { calories: 120, proteinG: 9 },
  banana: { calories: 89, proteinG: 1 },
  "boiled egg": { calories: 78, proteinG: 6 },
  egg: { calories: 78, proteinG: 6 },
  "mashed potato": { calories: 100, proteinG: 2 },
  potato: { calories: 77, proteinG: 2 },
  curd: { calories: 60, proteinG: 3 },
  yogurt: { calories: 60, proteinG: 3 },
  toast: { calories: 70, proteinG: 2 },
  bread: { calories: 70, proteinG: 2 },
  apple: { calories: 52, proteinG: 0 },
  orange: { calories: 47, proteinG: 1 },
  "coconut water": { calories: 19, proteinG: 0 },
  ors: { calories: 10, proteinG: 0 },
  soup: { calories: 50, proteinG: 3 },
  "chicken soup": { calories: 70, proteinG: 5 },
  spinach: { calories: 23, proteinG: 3 },
  idli: { calories: 58, proteinG: 2 },
  upma: { calories: 150, proteinG: 4 },
  khichdi: { calories: 180, proteinG: 6 }
};

export const nutritionInfoSchema = {
  name: "get_nutrition_info",
  description:
    "Returns approximate calories and protein for a list of food items eaten by the patient.",
  inputSchema: {
    type: "object" as const,
    properties: {
      foodItems: {
        type: "array",
        items: { type: "string" },
        description: "List of food items to look up"
      }
    },
    required: ["foodItems"]
  }
};

export function getNutritionInfo(args: { foodItems: string[] }): {
  totalCalories: number;
  totalProteinG: number;
  breakdown: { item: string; calories: number; proteinG: number }[];
  notes: string;
} {
  let totalCalories = 0;
  let totalProteinG = 0;
  const breakdown: { item: string; calories: number; proteinG: number }[] = [];

  for (const raw of args.foodItems) {
    const key = raw.toLowerCase().trim();
    const match =
      NUTRITION_TABLE[key] ??
      Object.entries(NUTRITION_TABLE).find(([k]) => key.includes(k) || k.includes(key))?.[1];
    const calories = match?.calories ?? 80;
    const proteinG = match?.proteinG ?? 2;
    totalCalories += calories;
    totalProteinG += proteinG;
    breakdown.push({ item: raw, calories, proteinG });
  }

  const notes =
    totalCalories < 600
      ? "Caloric intake appears low — patient may need encouragement to eat more."
      : totalCalories > 2000
        ? "Caloric intake looks adequate."
        : "Caloric intake is moderate.";

  return { totalCalories, totalProteinG, breakdown, notes };
}
