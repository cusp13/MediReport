import type { FastifyInstance } from "fastify";
import { User } from "../models/User.js";
import { ExerciseLog } from "../models/ExerciseLog.js";
import { FoodLog } from "../models/FoodLog.js";
import { SavedReport } from "../models/SavedReport.js";
import { FamilyMember } from "../models/FamilyMember.js";
import { guideForConditions } from "../data/exerciseGuide.js";
import type { Report } from "../schemas/report.js";

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Consecutive days (ending today, or yesterday if today isn't logged yet) with a
// completed exercise. Deduped by date.
function computeStreak(doneDates: Set<string>): number {
  const cursor = new Date();
  if (!doneDates.has(dateStr(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  let streak = 0;
  while (doneDates.has(dateStr(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export async function dashboardRoutes(app: FastifyInstance) {
  app.get(
    "/api/dashboard",
    { preHandler: [app.authenticate] },
    async (request) => {
      const userId = request.user.userId;
      const query = request.query as { memberId?: string };
      const memberId = query.memberId && query.memberId !== "self" ? query.memberId : null;

      const [user, member, exerciseLogs, foodLogs, latest] = await Promise.all([
        User.findById(userId),
        memberId ? FamilyMember.findOne({ _id: memberId, userId }) : null,
        ExerciseLog.find({ userId, memberId }).sort({ date: -1 }).limit(120),
        FoodLog.find({ userId, memberId }).sort({ date: -1 }).limit(10),
        SavedReport.findOne({ userId, memberId }).sort({ createdAt: -1 })
      ]);

      // Self uses the account's health profile; a family member uses their own
      // medical fields captured in the Family modal.
      const profile = member
        ? {
            conditions: member.preExistingConditions
              ? member.preExistingConditions.split(",").map((c) => c.trim()).filter(Boolean)
              : [],
            age: member.age ?? undefined
          }
        : user?.healthProfile
          ? {
              conditions: user.healthProfile.conditions ?? [],
              dietPreference: user.healthProfile.dietPreference ?? undefined,
              activityLevel: user.healthProfile.activityLevel ?? undefined,
              age: user.healthProfile.age ?? undefined
            }
          : null;
      const conditions = profile?.conditions ?? [];

      const doneDates = new Set(
        exerciseLogs.filter((l) => l.done).map((l) => l.date)
      );
      const streak = computeStreak(doneDates);

      // Per-day aggregates for the activity heatmap + running totals.
      const byDay = new Map<
        string,
        { minutes: number; steps: number; sessions: number }
      >();
      let totalMinutes = 0;
      let totalSteps = 0;
      for (const l of exerciseLogs) {
        const day = byDay.get(l.date) ?? { minutes: 0, steps: 0, sessions: 0 };
        day.minutes += l.durationMin ?? 0;
        day.steps += l.steps ?? 0;
        day.sessions += 1;
        byDay.set(l.date, day);
        totalMinutes += l.durationMin ?? 0;
        totalSteps += l.steps ?? 0;
      }
      const heatmap = [...byDay.entries()].map(([date, v]) => ({
        date,
        ...v
      }));

      // Major concerns = flagged markers from the most recent saved report.
      let concerns: {
        name: string;
        value: string;
        unit: string;
        status: string;
      }[] = [];
      let reportDate: string | null = null;
      if (latest) {
        const report = latest.report as Report;
        reportDate = (latest.get("createdAt") as Date).toISOString();
        concerns = report.markers
          .filter((m) => m.status !== "normal")
          .map((m) => ({
            name: m.name,
            value: m.value,
            unit: m.unit,
            status: m.status
          }));
      }

      // Merge profile conditions with flagged marker names so the guide
      // reflects what the report found (e.g. "Hemoglobin" → anemia guide)
      const markerHints = concerns.map((c) => c.name);
      return {
        profile,
        streak,
        exerciseDays: doneDates.size,
        heatmap,
        totals: { minutes: totalMinutes, steps: totalSteps },
        concerns,
        reportDate,
        guide: guideForConditions([...conditions, ...markerHints]),
        recentFood: foodLogs.map((l) => ({
          id: l.id as string,
          date: l.date,
          items: l.items
        })),
        recentExercise: exerciseLogs.slice(0, 10).map((l) => ({
          id: l.id as string,
          date: l.date,
          type: l.type,
          durationMin: l.durationMin ?? null,
          steps: l.steps ?? null
        }))
      };
    }
  );
}
