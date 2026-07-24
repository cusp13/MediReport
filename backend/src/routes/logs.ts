import type { FastifyInstance } from "fastify";
import { FoodLog } from "../models/FoodLog.js";
import { ExerciseLog } from "../models/ExerciseLog.js";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function logRoutes(app: FastifyInstance) {
  // --- Food ---
  app.get(
    "/api/logs/food",
    { preHandler: [app.authenticate] },
    async (request) => {
      const query = request.query as { memberId?: string };
      const memberId = query.memberId && query.memberId !== "self" ? query.memberId : null;
      const logs = await FoodLog.find({ userId: request.user.userId, memberId })
        .sort({ date: -1, createdAt: -1 })
        .limit(30);
      return {
        logs: logs.map((l) => ({
          id: l.id as string,
          date: l.date,
          items: l.items,
          notes: l.notes ?? null
        }))
      };
    }
  );

  app.post(
    "/api/logs/food",
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: "object",
          properties: {
            date: { type: "string", maxLength: 10 },
            items: { type: "array", items: { type: "string", maxLength: 120 } },
            notes: { type: "string", maxLength: 300 },
            memberId: { type: ["string", "null"] }
          },
          required: ["items"],
          additionalProperties: false
        }
      }
    },
    async (request) => {
      const body = request.body as {
        date?: string;
        items: string[];
        notes?: string;
        memberId?: string | null;
      };
      const log = await FoodLog.create({
        userId: request.user.userId,
        memberId: body.memberId ?? null,
        date: body.date ?? today(),
        items: body.items,
        notes: body.notes
      });
      return {
        log: {
          id: log.id as string,
          date: log.date,
          items: log.items,
          notes: log.notes ?? null
        }
      };
    }
  );

  // --- Exercise ---
  app.get(
    "/api/logs/exercise",
    { preHandler: [app.authenticate] },
    async (request) => {
      const query = request.query as { memberId?: string };
      const memberId = query.memberId && query.memberId !== "self" ? query.memberId : null;
      const logs = await ExerciseLog.find({ userId: request.user.userId, memberId })
        .sort({ date: -1, createdAt: -1 })
        .limit(30);
      return {
        logs: logs.map((l) => ({
          id: l.id as string,
          date: l.date,
          type: l.type,
          durationMin: l.durationMin ?? null,
          steps: l.steps ?? null,
          done: l.done
        }))
      };
    }
  );

  app.post(
    "/api/logs/exercise",
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: "object",
          properties: {
            date: { type: "string", maxLength: 10 },
            type: { type: "string", maxLength: 200 },
            durationMin: { type: "number" },
            steps: { type: "number" },
            done: { type: "boolean" },
            memberId: { type: ["string", "null"] }
          },
          required: ["type"],
          additionalProperties: false
        }
      }
    },
    async (request) => {
      const body = request.body as {
        date?: string;
        type: string;
        durationMin?: number;
        steps?: number;
        done?: boolean;
        memberId?: string | null;
      };
      const log = await ExerciseLog.create({
        userId: request.user.userId,
        memberId: body.memberId ?? null,
        date: body.date ?? today(),
        type: body.type,
        durationMin: body.durationMin,
        steps: body.steps,
        done: body.done ?? true
      });
      return {
        log: {
          id: log.id as string,
          date: log.date,
          type: log.type,
          durationMin: log.durationMin ?? null,
          steps: log.steps ?? null,
          done: log.done
        }
      };
    }
  );
}
