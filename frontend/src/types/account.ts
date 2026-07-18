import type { Report } from "./report";

export type User = { id: string; name: string; email: string };

export type FamilyMember = {
  id: string;
  name: string;
  relation: string | null;
  age: string | null;
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
