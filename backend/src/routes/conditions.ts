import type { FastifyInstance } from "fastify";
import { ConditionLog } from "../models/ConditionLog.js";
import { dbReady } from "../db.js";
import { getCheckInSchema } from "../ai/schemaGenerator.js";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function conditionRoutes(app: FastifyInstance) {
  app.post(
    "/api/conditions",
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 1, maxLength: 80 },
            startDate: { type: "string", maxLength: 10 },
            stage: { type: "string", enum: ["acute", "recovery", "resolved"] },
            notes: { type: "string", maxLength: 500 }
          },
          required: ["name"],
          additionalProperties: false
        }
      }
    },
    async (request, reply) => {
      if (!dbReady()) return reply.code(500).send({ error: "Internal server error." });
      const body = request.body as {
        name: string;
        startDate?: string;
        stage?: string;
        notes?: string;
      };
      const condition = await ConditionLog.create({
        userId: request.user.userId,
        name: body.name.toLowerCase().trim(),
        startDate: body.startDate ?? today(),
        stage: body.stage ?? "acute",
        notes: body.notes
      });
      return {
        condition: {
          id: condition.id as string,
          name: condition.name,
          startDate: condition.startDate,
          endDate: condition.endDate ?? null,
          stage: condition.stage,
          notes: condition.notes ?? null
        }
      };
    }
  );

  app.get(
    "/api/conditions",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      if (!dbReady()) return reply.code(500).send({ error: "Internal server error." });
      const conditions = await ConditionLog.find({ userId: request.user.userId }).sort({ createdAt: -1 });
      return {
        conditions: conditions.map((c) => ({
          id: c.id as string,
          name: c.name,
          startDate: c.startDate,
          endDate: c.endDate ?? null,
          stage: c.stage,
          notes: c.notes ?? null
        }))
      };
    }
  );

  // Returns the check-in form schema for a condition (hardcoded fast-path or LLM-generated)
  app.get(
    "/api/conditions/form-schema",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const query = request.query as { name?: string };
      const name = query.name?.toLowerCase().trim();
      if (!name) return reply.code(400).send({ error: "name query param required." });
      try {
        const schema = await getCheckInSchema(name);
        return { schema };
      } catch {
        return reply.code(500).send({ error: "Internal server error." });
      }
    }
  );

  app.put(
    "/api/conditions/:id",
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: "object",
          properties: {
            stage: { type: "string", enum: ["acute", "recovery", "resolved"] },
            endDate: { type: "string", maxLength: 10 },
            notes: { type: "string", maxLength: 500 }
          },
          additionalProperties: false
        }
      }
    },
    async (request, reply) => {
      if (!dbReady()) return reply.code(500).send({ error: "Internal server error." });
      const { id } = request.params as { id: string };
      const body = request.body as { stage?: string; endDate?: string; notes?: string };
      const condition = await ConditionLog.findOneAndUpdate(
        { _id: id, userId: request.user.userId },
        { $set: body },
        { new: true }
      );
      if (!condition) return reply.code(404).send({ error: "Condition not found." });
      return {
        condition: {
          id: condition.id as string,
          name: condition.name,
          startDate: condition.startDate,
          endDate: condition.endDate ?? null,
          stage: condition.stage,
          notes: condition.notes ?? null
        }
      };
    }
  );
}
