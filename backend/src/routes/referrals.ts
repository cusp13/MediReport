import type { FastifyInstance } from "fastify";
import { ReferralClick } from "../models/ReferralClick.js";
import { dbReady } from "../db.js";

// Records a partner-clinic click. No auth required (works for anonymous
// visitors); attaches the userId when a valid token is present.
export async function referralRoutes(app: FastifyInstance) {
  app.post(
    "/api/referrals",
    {
      preHandler: [app.optionalAuth],
      schema: {
        body: {
          type: "object",
          properties: {
            partnerId: { type: "string", minLength: 1, maxLength: 80 },
            partnerName: { type: "string", minLength: 1, maxLength: 120 },
            specialty: { type: "string", maxLength: 60 }
          },
          required: ["partnerId", "partnerName"],
          additionalProperties: false
        }
      }
    },
    async (request, reply) => {
      if (!dbReady()) return reply.send({ ok: true, recorded: false });

      const body = request.body as {
        partnerId: string;
        partnerName: string;
        specialty?: string;
      };
      await ReferralClick.create({
        ...body,
        userId: request.user?.userId ?? null
      });
      return reply.send({ ok: true, recorded: true });
    }
  );
}
