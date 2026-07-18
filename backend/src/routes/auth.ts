import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { dbReady } from "../db.js";

const errorSchema = {
  type: "object",
  properties: { error: { type: "string" } },
  required: ["error"]
} as const;

const authResponse = {
  type: "object",
  properties: {
    token: { type: "string" },
    user: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        email: { type: "string" }
      },
      required: ["id", "name", "email"]
    }
  },
  required: ["token", "user"]
} as const;

export async function authRoutes(app: FastifyInstance) {
  app.post(
    "/api/auth/signup",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            email: { type: "string", minLength: 3, maxLength: 120 },
            password: { type: "string", minLength: 6, maxLength: 200 },
            name: { type: "string", minLength: 1, maxLength: 80 }
          },
          required: ["email", "password", "name"],
          additionalProperties: false
        },
        response: { 200: authResponse, 409: errorSchema, 500: errorSchema }
      }
    },
    async (request, reply) => {
      if (!dbReady()) {
        return reply.code(500).send({ error: "Internal server error." });
      }
      const { email, password, name } = request.body as {
        email: string;
        password: string;
        name: string;
      };

      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return reply
          .code(409)
          .send({ error: "An account with this email already exists." });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({ email, passwordHash, name });
      const token = app.jwt.sign({ userId: user.id, name: user.name });
      return reply.send({
        token,
        user: { id: user.id, name: user.name, email: user.email }
      });
    }
  );

  app.post(
    "/api/auth/login",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            email: { type: "string" },
            password: { type: "string" }
          },
          required: ["email", "password"],
          additionalProperties: false
        },
        response: { 200: authResponse, 401: errorSchema, 500: errorSchema }
      }
    },
    async (request, reply) => {
      if (!dbReady()) {
        return reply.code(500).send({ error: "Internal server error." });
      }
      const { email, password } = request.body as {
        email: string;
        password: string;
      };

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return reply.code(401).send({ error: "Invalid email or password." });
      }

      const token = app.jwt.sign({ userId: user.id, name: user.name });
      return reply.send({
        token,
        user: { id: user.id, name: user.name, email: user.email }
      });
    }
  );

  app.get(
    "/api/auth/me",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = await User.findById(request.user.userId);
      if (!user) return reply.code(401).send({ error: "Not signed in." });
      return reply.send({
        user: { id: user.id, name: user.name, email: user.email }
      });
    }
  );
}
