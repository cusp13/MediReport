import type { FastifyInstance } from "fastify";
import { ConditionLog } from "../models/ConditionLog.js";
import { DailyHealthLog } from "../models/DailyHealthLog.js";
import { DailyAdvice } from "../models/DailyAdvice.js";
import { User } from "../models/User.js";
import { FamilyMember } from "../models/FamilyMember.js";
import { dbReady } from "../db.js";
import { buildRagContext } from "../ai/ragContext.js";
import { generateAdvice } from "../ai/healthAdvice.js";
import { maybeGenerateWeeklySummary } from "../ai/weeklyDigest.js";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildUserProfileText(user: {
  name: string;
  healthProfile?: {
    age?: string | null;
    sex?: string | null;
    conditions?: string[];
    dietPreference?: string | null;
    activityLevel?: string | null;
  } | null;
}): string {
  const p = user.healthProfile;
  if (!p) return `Name: ${user.name}`;
  const parts = [`Name: ${user.name}`];
  if (p.age) parts.push(`Age: ${p.age}`);
  if (p.sex) parts.push(`Sex: ${p.sex}`);
  if (p.conditions?.length) parts.push(`Pre-existing conditions: ${p.conditions.join(", ")}`);
  if (p.dietPreference) parts.push(`Diet preference: ${p.dietPreference}`);
  if (p.activityLevel) parts.push(`Activity level: ${p.activityLevel}`);
  return parts.join(". ");
}

function buildFamilyProfileText(member: {
  name: string;
  relation?: string | null;
  age?: string | null;
  preExistingConditions?: string | null;
  currentMedications?: string | null;
  medicalNotes?: string | null;
}): string {
  const parts = [`Name: ${member.name}`];
  if (member.relation) parts.push(`Relation to account holder: ${member.relation}`);
  if (member.age) parts.push(`Age: ${member.age}`);
  if (member.preExistingConditions) parts.push(`Pre-existing conditions: ${member.preExistingConditions}`);
  if (member.currentMedications) parts.push(`Current medications: ${member.currentMedications}`);
  if (member.medicalNotes) parts.push(`Additional notes: ${member.medicalNotes}`);
  return parts.join(". ");
}

export async function adviceRoutes(app: FastifyInstance) {
  app.get(
    "/api/advice/today",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      if (!dbReady()) return reply.code(500).send({ error: "Internal server error." });

      const query = request.query as { conditionId?: string };
      if (!query.conditionId) {
        return reply.code(400).send({ error: "conditionId query param required." });
      }

      const userId = request.user.userId;
      const conditionId = query.conditionId;
      const date = today();

      // Return cached advice if already generated today
      const cached = await DailyAdvice.findOne({ userId, conditionId, date });
      if (cached) {
        return {
          advice: {
            id: cached.id as string,
            date: cached.date,
            recoveryAssessment: cached.recoveryAssessment,
            dietPlan: cached.dietPlan,
            hydrationTarget: cached.hydrationTarget,
            exerciseAdvice: cached.exerciseAdvice,
            warningFlags: cached.warningFlags,
            tomorrowGoal: cached.tomorrowGoal,
            cached: true
          }
        };
      }

      // Fetch condition and today's log
      const condition = await ConditionLog.findOne({ _id: conditionId, userId });
      if (!condition) return reply.code(404).send({ error: "Condition not found." });

      const todayLog = await DailyHealthLog.findOne({ userId, conditionId, date });
      if (!todayLog) {
        return reply.code(400).send({
          error: "No check-in found for today. Please submit your daily health log first."
        });
      }

      // Fetch user profile for personalisation
      const user = await User.findById(userId);
      if (!user) return reply.code(401).send({ error: "User not found." });

      // When this condition belongs to a family member, personalise using their
      // own medical profile instead of the account owner's.
      let profileText = buildUserProfileText(user);
      if (condition.memberId) {
        const member = await FamilyMember.findOne({ _id: condition.memberId, userId });
        if (member) profileText = buildFamilyProfileText(member);
      }

      // Build RAG context
      const ragCtx = await buildRagContext(userId, conditionId, condition.name, todayLog.logText);

      // Generate advice via LLM + MCP tools
      const payload = await generateAdvice({
        userId,
        conditionId,
        conditionName: condition.name,
        stage: condition.stage,
        dayNumber: todayLog.dayNumber,
        todayLogText: todayLog.logText,
        userProfile: profileText,
        ragCtx
      });

      // Persist and return
      const advice = await DailyAdvice.create({ userId, conditionId, date, ...payload });

      // Fire-and-forget weekly digest (won't block response)
      maybeGenerateWeeklySummary(userId, conditionId, condition.name).catch(() => null);

      return {
        advice: {
          id: advice.id as string,
          date: advice.date,
          recoveryAssessment: advice.recoveryAssessment,
          dietPlan: advice.dietPlan,
          hydrationTarget: advice.hydrationTarget,
          exerciseAdvice: advice.exerciseAdvice,
          warningFlags: advice.warningFlags,
          tomorrowGoal: advice.tomorrowGoal,
          cached: false
        }
      };
    }
  );
}
