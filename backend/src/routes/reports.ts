import type { FastifyInstance } from "fastify";
import { SavedReport } from "../models/SavedReport.js";
import type { Report } from "../schemas/report.js";

type SavedDoc = InstanceType<typeof SavedReport>;

function serialize(doc: SavedDoc) {
  return {
    id: doc.id as string,
    memberId: doc.memberId ? String(doc.memberId) : null,
    title: doc.title ?? null,
    createdAt: doc.get("createdAt"),
    report: doc.report as Report
  };
}

export async function reportRoutes(app: FastifyInstance) {
  // List (metadata + report); optional ?memberId filter.
  app.get(
    "/api/reports",
    { preHandler: [app.authenticate] },
    async (request) => {
      const { memberId } = request.query as { memberId?: string };
      const filter: Record<string, unknown> = { userId: request.user.userId };
      if (memberId) filter.memberId = memberId === "self" ? null : memberId;

      const docs = await SavedReport.find(filter).sort({ createdAt: -1 });
      return { reports: docs.map(serialize) };
    }
  );

  app.post(
    "/api/reports",
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: "object",
          properties: {
            report: { type: "object" },
            memberId: { type: ["string", "null"] },
            title: { type: "string", maxLength: 120 }
          },
          required: ["report"],
          additionalProperties: false
        }
      }
    },
    async (request) => {
      const body = request.body as {
        report: Report;
        memberId?: string | null;
        title?: string;
      };
      const doc = await SavedReport.create({
        userId: request.user.userId,
        memberId: body.memberId ?? null,
        title: body.title,
        report: body.report
      });
      return { report: serialize(doc) };
    }
  );

  app.get(
    "/api/reports/:id",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const doc = await SavedReport.findOne({
        _id: id,
        userId: request.user.userId
      });
      if (!doc) return reply.code(404).send({ error: "Not found." });
      return { report: serialize(doc) };
    }
  );

  app.delete(
    "/api/reports/:id",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const res = await SavedReport.deleteOne({
        _id: id,
        userId: request.user.userId
      });
      if (res.deletedCount === 0) {
        return reply.code(404).send({ error: "Not found." });
      }
      return { ok: true };
    }
  );
}
