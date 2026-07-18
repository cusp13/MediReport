import { embedText } from "./embeddings.js";
import { getQdrant, COLLECTIONS } from "./qdrantClient.js";
import { WeeklyHealthSummary } from "../models/WeeklyHealthSummary.js";
import { DailyHealthLog } from "../models/DailyHealthLog.js";

export interface RagContext {
  similarLogs: string[];        // top-K past logText entries
  guidelines: string[];         // top-K medical KB chunks
  weeklySummaries: string[];    // last 2 weekly summaries
  recentLogTexts: string[];     // last 3 days always included
}

export async function retrieveSimilarLogs(
  userId: string,
  conditionId: string,
  queryVec: number[],
  topK = 5
): Promise<string[]> {
  const result = await getQdrant().search(COLLECTIONS.HEALTH_LOGS, {
    vector: queryVec,
    limit: topK,
    filter: {
      must: [
        { key: "userId", match: { value: userId } },
        { key: "conditionId", match: { value: conditionId } }
      ]
    },
    with_payload: true
  });
  return result
    .filter((r) => r.payload?.logText)
    .map((r) => r.payload!.logText as string);
}

export async function retrieveMedicalGuidelines(
  condition: string,
  queryVec: number[],
  topK = 3
): Promise<string[]> {
  const result = await getQdrant().search(COLLECTIONS.MEDICAL_KNOWLEDGE, {
    vector: queryVec,
    limit: topK,
    filter: {
      must: [{ key: "condition", match: { value: condition } }]
    },
    with_payload: true
  });
  return result
    .filter((r) => r.payload?.content)
    .map((r) => r.payload!.content as string);
}

export async function retrieveWeeklySummaries(
  userId: string,
  conditionId: string
): Promise<string[]> {
  const summaries = await WeeklyHealthSummary.find({ userId, conditionId })
    .sort({ weekStart: -1 })
    .limit(2);
  return summaries.map((s) => s.summaryText);
}

async function getRecentLogTexts(
  userId: string,
  conditionId: string
): Promise<string[]> {
  const logs = await DailyHealthLog.find({ userId, conditionId })
    .sort({ date: -1 })
    .limit(3);
  return logs.map((l) => l.logText);
}

export async function buildRagContext(
  userId: string,
  conditionId: string,
  conditionName: string,
  todayLogText: string
): Promise<RagContext> {
  const [recentLogTexts, queryVec] = await Promise.all([
    getRecentLogTexts(userId, conditionId),
    embedText(todayLogText)
  ]);

  // Qdrant searches are non-fatal — return empty arrays if Qdrant is offline
  const [similarLogs, guidelines, weeklySummaries] = await Promise.all([
    retrieveSimilarLogs(userId, conditionId, queryVec).catch(() => [] as string[]),
    retrieveMedicalGuidelines(conditionName, queryVec).catch(() => [] as string[]),
    retrieveWeeklySummaries(userId, conditionId)
  ]);

  // Deduplicate: similar logs may overlap with recent logs
  const recentSet = new Set(recentLogTexts);
  const dedupedSimilar = similarLogs.filter((l) => !recentSet.has(l));

  return { similarLogs: dedupedSimilar, guidelines, weeklySummaries, recentLogTexts };
}

export function formatContextForPrompt(ctx: RagContext): string {
  const parts: string[] = [];

  if (ctx.recentLogTexts.length) {
    parts.push("=== Recent logs (last 3 days) ===\n" + ctx.recentLogTexts.join("\n"));
  }
  if (ctx.similarLogs.length) {
    parts.push("=== Similar past episodes ===\n" + ctx.similarLogs.join("\n"));
  }
  if (ctx.guidelines.length) {
    parts.push("=== Medical guidelines ===\n" + ctx.guidelines.join("\n\n"));
  }
  if (ctx.weeklySummaries.length) {
    parts.push("=== Weekly summaries ===\n" + ctx.weeklySummaries.join("\n\n"));
  }
  return parts.join("\n\n");
}
