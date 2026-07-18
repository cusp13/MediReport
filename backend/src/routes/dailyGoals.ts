import type { FastifyInstance } from "fastify";
import { SavedReport } from "../models/SavedReport.js";
import { ExerciseLog } from "../models/ExerciseLog.js";
import { DailyVitalsLog } from "../models/DailyVitalsLog.js";
import { dbReady } from "../db.js";
import { generateDailyGoals, GENERAL_GOALS } from "../ai/goalGenerator.js";
import type { Report } from "../schemas/report.js";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function dailyGoalsRoutes(app: FastifyInstance) {
  // GET /api/daily-goals — returns AI-generated goals + today's logged vitals
  app.get(
    "/api/daily-goals",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      if (!dbReady()) return reply.code(500).send({ error: "Internal server error." });

      const userId = request.user.userId;
      const date = today();

      const [latest, exerciseLogs, vitals] = await Promise.all([
        SavedReport.findOne({ userId, memberId: null }).sort({ createdAt: -1 }),
        ExerciseLog.find({ userId, date }),
        DailyVitalsLog.findOne({ userId, date })
      ]);

      // Summarise today's exercise from existing logs
      const todaySteps = exerciseLogs.reduce((s, l) => s + (l.steps ?? 0), 0);
      const todayExerciseMin = exerciseLogs.reduce((s, l) => s + (l.durationMin ?? 0), 0);

      // Generate / retrieve goals
      let goals;
      if (latest) {
        const report = latest.report as Report;
        const flagged = (report.markers ?? []).filter(
          (m) => m.status === "low" || m.status === "high"
        );
        try {
          goals = await generateDailyGoals(
            String(latest._id),
            latest.createdAt.toISOString().slice(0, 10),
            flagged.map((m) => ({
              name: m.name,
              value: m.value,
              unit: m.unit,
              status: m.status,
              mayIndicate: m.mayIndicate,
              lifestyleSuggestions: m.lifestyleSuggestions
            }))
          );
        } catch {
          goals = { ...GENERAL_GOALS, reportBased: false };
        }
      } else {
        goals = GENERAL_GOALS;
      }

      return {
        goals,
        today: {
          waterLitres: vitals?.waterLitres ?? null,
          sleepHours: vitals?.sleepHours ?? null,
          mood: vitals?.mood ?? null,
          steps: todaySteps,
          exerciseMinutes: todayExerciseMin
        }
      };
    }
  );

  // POST /api/daily-vitals — log water, sleep, mood for today
  app.post(
    "/api/daily-vitals",
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: "object",
          properties: {
            waterLitres: { type: "number", minimum: 0, maximum: 20 },
            sleepHours: { type: "number", minimum: 0, maximum: 24 },
            mood: { type: "number", minimum: 1, maximum: 5 }
          },
          additionalProperties: false
        }
      }
    },
    async (request, reply) => {
      if (!dbReady()) return reply.code(500).send({ error: "Internal server error." });

      const userId = request.user.userId;
      const body = request.body as {
        waterLitres?: number;
        sleepHours?: number;
        mood?: number;
      };

      const vitals = await DailyVitalsLog.findOneAndUpdate(
        { userId, date: today() },
        { $set: { ...body } },
        { upsert: true, new: true }
      );

      return {
        vitals: {
          date: vitals.date,
          waterLitres: vitals.waterLitres ?? null,
          sleepHours: vitals.sleepHours ?? null,
          mood: vitals.mood ?? null
        }
      };
    }
  );
}
