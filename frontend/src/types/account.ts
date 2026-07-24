import type { Report } from "./report";

export type User = { id: string; name: string; email: string };

export type FamilyMember = {
  id: string;
  name: string;
  relation: string | null;
  age: string | null;
  preExistingConditions: string | null;
  currentMedications: string | null;
  medicalNotes: string | null;
};

export type SavedReport = {
  id: string;
  memberId: string | null;
  title: string | null;
  createdAt: string;
  report: Report;
};

export type HealthProfile = {
  age?: string;
  sex?: string;
  conditions: string[];
  dietPreference?: string;
  activityLevel?: string;
  heightCm?: string;
  weightKg?: string;
};

export type FoodLog = {
  id: string;
  date: string;
  items: string[];
  notes?: string | null;
};

export type ExerciseLog = {
  id: string;
  date: string;
  type: string;
  durationMin?: number | null;
  steps?: number | null;
  done?: boolean;
};

export type HeatmapDay = {
  date: string;
  minutes: number;
  steps: number;
  sessions: number;
};

export type GuideEntry = {
  condition: string;
  yoga: string[];
  exercises: string[];
};

// --- Health Recovery Monitor ---

export type ConditionLog = {
  id: string;
  memberId: string | null;
  name: string;
  startDate: string;
  endDate: string | null;
  stage: "acute" | "recovery" | "resolved";
  notes: string | null;
};

export type DailyHealthLog = {
  id: string;
  conditionId: string;
  date: string;
  dayNumber: number;
  fever: number | null;
  energyLevel: number | null;
  nauseaLevel: number | null;
  sleepHours: number | null;
  hydrationLitres: number | null;
  symptoms: string[];
  medicationTaken: boolean | null;
  notes: string | null;
};

export type DietPlan = {
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
  avoid: string[];
};

export type DailyAdvice = {
  id: string;
  date: string;
  recoveryAssessment: string;
  dietPlan: DietPlan;
  hydrationTarget: string;
  exerciseAdvice: string;
  warningFlags: string[];
  tomorrowGoal: string;
  cached: boolean;
};

export type DashboardData = {
  profile: HealthProfile | null;
  streak: number;
  exerciseDays: number;
  heatmap: HeatmapDay[];
  totals: { minutes: number; steps: number };
  concerns: { name: string; value: string; unit: string; status: string }[];
  reportDate: string | null;
  guide: GuideEntry[];
  recentFood: { id: string; date: string; items: string[] }[];
  recentExercise: {
    id: string;
    date: string;
    type: string;
    durationMin: number | null;
    steps?: number | null;
  }[];
};
