import type { FastifyInstance } from "fastify";
import { FamilyMember } from "../models/FamilyMember.js";

function serialize(m: InstanceType<typeof FamilyMember>) {
  return {
    id: m.id as string,
    name: m.name,
    relation: m.relation ?? null,
    age: m.age ?? null
  };
}

export async function familyRoutes(app: FastifyInstance) {
  app.get(
    "/api/family",
    { preHandler: [app.authenticate] },
    async (request) => {
      const members = await FamilyMember.find({
        userId: request.user.userId
      }).sort({ createdAt: 1 });
      return { members: members.map(serialize) };
    }
  );

  app.post(
    "/api/family",
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 1, maxLength: 80 },
            relation: { type: "string", maxLength: 40 },
            age: { type: "string", maxLength: 10 }
          },
          required: ["name"],
          additionalProperties: false
        }
      }
    },
    async (request) => {
      const body = request.body as {
        name: string;
        relation?: string;
        age?: string;
      };
      const member = await FamilyMember.create({
        userId: request.user.userId,
        ...body
      });
      return { member: serialize(member) };
    }
  );

  app.delete(
    "/api/family/:id",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const res = await FamilyMember.deleteOne({
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
