import type { FastifyInstance } from "fastify";
import { User } from "../models/User.js";

const profileSchema = {
  type: "object",
  properties: {
    age: { type: "string", maxLength: 10 },
    sex: { type: "string", maxLength: 20 },
    conditions: { type: "array", items: { type: "string", maxLength: 60 } },
    dietPreference: { type: "string", maxLength: 30 },
    activityLevel: { type: "string", maxLength: 30 },
    heightCm: { type: "string", maxLength: 10 },
    weightKg: { type: "string", maxLength: 10 }
  },
  additionalProperties: false
} as const;

export async function profileRoutes(app: FastifyInstance) {
  app.get(
    "/api/profile",
    { preHandler: [app.authenticate] },
    async (request) => {
      const user = await User.findById(request.user.userId);
      return { profile: user?.healthProfile ?? null };
    }
  );

  app.put(
    "/api/profile",
    { preHandler: [app.authenticate], schema: { body: profileSchema } },
    async (request, reply) => {
      const user = await User.findByIdAndUpdate(
        request.user.userId,
        { healthProfile: request.body },
        { new: true }
      );
      if (!user) return reply.code(404).send({ error: "User not found." });
      return { profile: user.healthProfile };
    }
  );
}
