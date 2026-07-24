import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { analyzeRoutes } from "./routes/analyze.js";
import { chatRoutes } from "./routes/chat.js";
import { translateRoutes } from "./routes/translate.js";
import { authRoutes } from "./routes/auth.js";
import { familyRoutes } from "./routes/family.js";
import { reportRoutes } from "./routes/reports.js";
import { referralRoutes } from "./routes/referrals.js";
import { profileRoutes } from "./routes/profile.js";
import { logRoutes } from "./routes/logs.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { conditionRoutes } from "./routes/conditions.js";
import { healthLogRoutes } from "./routes/healthLogs.js";
import { adviceRoutes } from "./routes/advice.js";
import { dailyGoalsRoutes } from "./routes/dailyGoals.js";
import { clinicRoutes } from "./routes/clinics.js";
import { registerAuth } from "./auth/jwt.js";
import { connectDb } from "./db.js";
import { DailyVitalsLog } from "./models/DailyVitalsLog.js";
import { ensureCollections } from "./ai/qdrantClient.js";
import { seedMedicalKb } from "./ai/medicalKb.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.FRONTEND_ORIGIN?.split(",") ?? [
    "http://localhost:1234"
  ]
});
await app.register(multipart);
await registerAuth(app);

// Connect to Mongo if configured; the core flow still works without it.
try {
  const connected = await connectDb();
  app.log.info(
    connected
      ? "MongoDB connected — account features enabled"
      : "MONGODB_URI not set — running anonymous-only (no accounts)"
  );
  if (connected) {
    // The unique index gained memberId (family-member vitals support) — drop
    // the old {userId,date} index left over from before that change.
    await DailyVitalsLog.syncIndexes();
  }
} catch (err) {
  app.log.error({ err }, "MongoDB connection failed — accounts disabled");
}

// Initialise Qdrant vector store and seed medical knowledge base.
try {
  await ensureCollections();
  await seedMedicalKb();
} catch (err) {
  app.log.warn({ err }, "Qdrant unavailable — recovery feature disabled (start Qdrant to enable)");
}

app.get("/health", async () => ({ status: "ok" }));

await app.register(analyzeRoutes);
await app.register(chatRoutes);
await app.register(translateRoutes);
await app.register(authRoutes);
await app.register(familyRoutes);
await app.register(reportRoutes);
await app.register(referralRoutes);
await app.register(profileRoutes);
await app.register(logRoutes);
await app.register(dashboardRoutes);
await app.register(conditionRoutes);
await app.register(healthLogRoutes);
await app.register(adviceRoutes);
await app.register(dailyGoalsRoutes);
await app.register(clinicRoutes);

const port = Number(process.env.PORT ?? 4000);
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
