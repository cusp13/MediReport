import type { FastifyInstance } from "fastify";
import { translateReport } from "../ai/translate.js";
import { reportSchema, type Report } from "../schemas/report.js";

const errorSchema = {
  type: "object",
  properties: { error: { type: "string" } },
  required: ["error"]
} as const;

const bodySchema = {
  type: "object",
  properties: {
    report: reportSchema,
    language: { type: "string", minLength: 2, maxLength: 24 }
  },
  required: ["report", "language"],
  additionalProperties: false
} as const;

type TranslateBody = { report: Report; language: string };

export async function translateRoutes(app: FastifyInstance) {
  app.post(
    "/api/translate",
    { schema: { body: bodySchema, response: { 200: reportSchema, 502: errorSchema } } },
    async (request, reply) => {
      const { report, language } = request.body as TranslateBody;
      try {
        const translated = await translateReport(report, language);
        return reply.send(translated);
      } catch (err) {
        request.log.error(err);
        return reply
          .code(502)
          .send({ error: "Couldn't translate right now. Please try again." });
      }
    }
  );
}
