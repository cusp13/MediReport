import type { FastifyInstance, FastifyRequest } from "fastify";
import { streamAnswer, type ChatMessage } from "../ai/chat.js";
import { reportSchema, type Report } from "../schemas/report.js";

const MAX_QUESTIONS = 5;

const errorSchema = {
  type: "object",
  properties: { error: { type: "string" } },
  required: ["error"]
} as const;

const bodySchema = {
  type: "object",
  properties: {
    report: reportSchema,
    messages: {
      type: "array",
      items: {
        type: "object",
        properties: {
          role: { type: "string", enum: ["user", "assistant"] },
          content: { type: "string" }
        },
        required: ["role", "content"],
        additionalProperties: false
      }
    },
    language: { type: "string", minLength: 2, maxLength: 24 }
  },
  required: ["report", "messages"],
  additionalProperties: false
} as const;

type ChatBody = { report: Report; messages: ChatMessage[]; language?: string };

function allowedOrigins(): string[] {
  return (
    process.env.FRONTEND_ORIGIN?.split(",") ?? ["http://localhost:1234"]
  );
}

// hijack() bypasses @fastify/cors, so the streamed response needs its CORS
// header set by hand.
function corsOrigin(request: FastifyRequest): string {
  const origin = request.headers.origin;
  const allowed = allowedOrigins();
  return origin && allowed.includes(origin) ? origin : allowed[0];
}

export async function chatRoutes(app: FastifyInstance) {
  app.post(
    "/api/chat",
    {
      schema: {
        body: bodySchema,
        response: { 429: errorSchema, 502: errorSchema }
      }
    },
    async (request, reply) => {
      const { report, messages, language } = request.body as ChatBody;

      const questionCount = messages.filter((m) => m.role === "user").length;
      if (questionCount > MAX_QUESTIONS) {
        return reply.code(429).send({
          error: `You've reached the ${MAX_QUESTIONS}-question limit for this report.`
        });
      }

      // Create the stream first so a setup failure returns a clean JSON error
      // before we commit to a 200 streamed response.
      let stream: Awaited<ReturnType<typeof streamAnswer>>;
      try {
        stream = await streamAnswer(report, messages, language);
      } catch (err) {
        request.log.error(err);
        return reply
          .code(502)
          .send({ error: "Couldn't reach the assistant. Please try again." });
      }

      reply.hijack();
      const raw = reply.raw;
      raw.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        "Access-Control-Allow-Origin": corsOrigin(request)
      });

      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (delta) raw.write(delta);
        }
      } catch (err) {
        request.log.error(err);
      } finally {
        raw.end();
      }
    }
  );
}
