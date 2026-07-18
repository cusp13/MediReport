import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fastifyJwt from "@fastify/jwt";

// Payload we sign into every token.
export type JwtUser = { userId: string; name: string };

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtUser;
    user: JwtUser;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    // Required auth — 401s if no/invalid token.
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    // Optional auth — populates req.user if a valid token is present, else no-op.
    optionalAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export async function registerAuth(app: FastifyInstance) {
  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET ?? "dev-insecure-secret-change-me"
  });

  app.decorate(
    "authenticate",
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        await req.jwtVerify();
      } catch {
        await reply.code(401).send({ error: "Please sign in to continue." });
      }
    }
  );

  app.decorate(
    "optionalAuth",
    async (req: FastifyRequest) => {
      try {
        await req.jwtVerify();
      } catch {
        // No/invalid token is fine here — stays anonymous.
      }
    }
  );
}
