import type { FastifyInstance } from "fastify";
import { DailyHealthLog } from "../models/DailyHealthLog.js";
import { ConditionLog } from "../models/ConditionLog.js";
import { dbReady } from "../db.js";
import { embedText } from "../ai/embeddings.js";
import { getQdrant, COLLECTIONS } from "../ai/qdrantClient.js";
import { randomUUID } from "crypto";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.floor(ms / 86400000) + 1);
}

function composeLogText(
  conditionName: string,
  dayNumber: number,
  body: {
    fever?: number;
    primaryMetricLogLabel?: string;
    energyLevel?: number;
    nauseaLevel?: number;
    nauseaLogLabel?: string;
    sleepHours?: number;
    hydrationLitres?: number;
    symptoms?: string[];
    medicationTaken?: boolean;
    notes?: string;
  }
): string {
  const parts: string[] = [`Day ${dayNumber} of ${conditionName}.`];
  if (body.fever != null) {
    const label = body.primaryMetricLogLabel ?? "Fever (°C)";
    parts.push(`${label}: ${body.fever}.`);
  }
  if (body.energyLevel != null) parts.push(`Energy: ${body.energyLevel}/10.`);
  if (body.nauseaLevel != null) {
    const label = body.nauseaLogLabel ?? "Nausea";
    parts.push(`${label}: ${body.nauseaLevel}/5.`);
  }
  if (body.sleepHours != null) parts.push(`Sleep: ${body.sleepHours}h.`);
  if (body.hydrationLitres != null) parts.push(`Hydration: ${body.hydrationLitres}L.`);
  if (body.symptoms?.length) parts.push(`Symptoms: ${body.symptoms.join(", ")}.`);
  if (body.medicationTaken != null)
    parts.push(`Medication: ${body.medicationTaken ? "taken" : "not taken"}.`);
  if (body.notes) parts.push(body.notes);
  return parts.join(" ");
}

export async function healthLogRoutes(app: FastifyInstance) {
  app.post(
    "/api/health-logs",
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: "object",
          properties: {
            conditionId: { type: "string" },
            date: { type: "string", maxLength: 10 },
            fever: { type: "number" },
            primaryMetricLogLabel: { type: "string", maxLength: 60 },
            energyLevel: { type: "number", minimum: 1, maximum: 10 },
            nauseaLevel: { type: "number", minimum: 1, maximum: 5 },
            nauseaLogLabel: { type: "string", maxLength: 40 },
            sleepHours: { type: "number" },
            hydrationLitres: { type: "number" },
            symptoms: { type: "array", items: { type: "string", maxLength: 60 } },
            medicationTaken: { type: "boolean" },
            notes: { type: "string", maxLength: 500 }
          },
          required: ["conditionId"],
          additionalProperties: false
        }
      }
    },
    async (request, reply) => {
      if (!dbReady()) return reply.code(500).send({ error: "Internal server error." });
      const body = request.body as {
        conditionId: string;
        date?: string;
        fever?: number;
        primaryMetricLogLabel?: string;
        energyLevel?: number;
        nauseaLevel?: number;
        nauseaLogLabel?: string;
        sleepHours?: number;
        hydrationLitres?: number;
        symptoms?: string[];
        medicationTaken?: boolean;
        notes?: string;
      };

      const condition = await ConditionLog.findOne({
        _id: body.conditionId,
        userId: request.user.userId
      });
      if (!condition) return reply.code(404).send({ error: "Condition not found." });

      const logDate = body.date ?? today();
      const dayNumber = daysBetween(condition.startDate, logDate);
      const logText = composeLogText(condition.name, dayNumber, body);

      // Embed and upsert to Qdrant (non-fatal — skip if Qdrant is offline)
      let qdrantId: string | undefined;
      try {
        const embedding = await embedText(logText);
        qdrantId = randomUUID();
        await getQdrant().upsert(COLLECTIONS.HEALTH_LOGS, {
          wait: true,
          points: [
            {
              id: qdrantId,
              vector: embedding,
              payload: {
                userId: request.user.userId,
                conditionId: body.conditionId,
                date: logDate,
                dayNumber,
                energy: body.energyLevel ?? null,
                fever: body.fever ?? null,
                logText
              }
            }
          ]
        });
      } catch (qdrantErr) {
        console.warn("[qdrant] upsert skipped:", (qdrantErr as Error).message);
        qdrantId = undefined;
      }

      const log = await DailyHealthLog.findOneAndUpdate(
        { userId: request.user.userId, conditionId: body.conditionId, date: logDate },
        {
          $set: {
            dayNumber,
            fever: body.fever ?? null,
            energyLevel: body.energyLevel ?? null,
            nauseaLevel: body.nauseaLevel ?? null,
            sleepHours: body.sleepHours ?? null,
            hydrationLitres: body.hydrationLitres ?? null,
            symptoms: body.symptoms ?? [],
            medicationTaken: body.medicationTaken ?? null,
            notes: body.notes ?? null,
            logText,
            qdrantId
          }
        },
        { upsert: true, new: true }
      );

      return {
        log: {
          id: String(log!.id),
          date: log!.date,
          dayNumber: log!.dayNumber,
          energyLevel: log!.energyLevel ?? null,
          fever: log!.fever ?? null
        }
      };
    }
  );

  app.get(
    "/api/health-logs",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      if (!dbReady()) return reply.code(500).send({ error: "Internal server error." });
      const query = request.query as { conditionId?: string; limit?: string };
      const filter: Record<string, unknown> = { userId: request.user.userId };
      if (query.conditionId) filter.conditionId = query.conditionId;
      const limit = Math.min(Number(query.limit ?? 30), 90);
      const logs = await DailyHealthLog.find(filter).sort({ date: -1 }).limit(limit);
      return {
        logs: logs.map((l) => ({
          id: String(l.id),
          conditionId: l.conditionId,
          date: l.date,
          dayNumber: l.dayNumber,
          fever: l.fever ?? null,
          energyLevel: l.energyLevel ?? null,
          nauseaLevel: l.nauseaLevel ?? null,
          sleepHours: l.sleepHours ?? null,
          hydrationLitres: l.hydrationLitres ?? null,
          symptoms: l.symptoms,
          medicationTaken: l.medicationTaken ?? null,
          notes: l.notes ?? null
        }))
      };
    }
  );
}
