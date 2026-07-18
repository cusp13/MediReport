import { DailyHealthLog } from "../models/DailyHealthLog.js";
import { WeeklyHealthSummary } from "../models/WeeklyHealthSummary.js";
import { getClient, MODEL } from "./client.js";
import { embedText } from "./embeddings.js";
import { getQdrant, COLLECTIONS } from "./qdrantClient.js";
import { randomUUID } from "crypto";

function getWeekBounds(date: Date): { weekStart: string; weekEnd: string } {
  const day = date.getDay(); // 0=Sun
  const diffToMon = (day === 0 ? -6 : 1 - day);
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    weekStart: monday.toISOString().slice(0, 10),
    weekEnd: sunday.toISOString().slice(0, 10)
  };
}

function calcTrend(logs: { energyLevel?: number | null }[]): "improving" | "stable" | "worsening" {
  const energies = logs
    .map((l) => l.energyLevel)
    .filter((e): e is number => e != null);
  if (energies.length < 2) return "stable";
  const first = energies.slice(0, Math.floor(energies.length / 2));
  const second = energies.slice(Math.floor(energies.length / 2));
  const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
  const avgSecond = second.reduce((a, b) => a + b, 0) / second.length;
  if (avgSecond - avgFirst > 0.5) return "improving";
  if (avgFirst - avgSecond > 0.5) return "worsening";
  return "stable";
}

export async function maybeGenerateWeeklySummary(
  userId: string,
  conditionId: string,
  conditionName: string
): Promise<void> {
  const now = new Date();
  // Run on Sundays, or if there are ≥7 logs and no summary yet
  const isSunday = now.getDay() === 0;
  const { weekStart, weekEnd } = getWeekBounds(now);

  const existing = await WeeklyHealthSummary.findOne({ userId, conditionId, weekStart });
  if (existing) return; // Already generated this week

  // Gather this week's logs
  const logs = await DailyHealthLog.find({
    userId,
    conditionId,
    date: { $gte: weekStart, $lte: weekEnd }
  }).sort({ date: 1 });

  // Also try generating if we have ≥7 total logs and no summary at all
  if (!isSunday && logs.length < 7) return;
  if (logs.length === 0) return;

  const logTexts = logs.map((l) => l.logText).join("\n");
  const avgEnergy =
    logs.filter((l) => l.energyLevel != null).reduce((s, l) => s + (l.energyLevel ?? 0), 0) /
    (logs.filter((l) => l.energyLevel != null).length || 1);
  const avgFever =
    logs.filter((l) => l.fever != null).reduce((s, l) => s + (l.fever ?? 0), 0) /
    (logs.filter((l) => l.fever != null).length || 1);
  const trend = calcTrend(logs);

  const completion = await getClient().chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content:
          "You are a medical assistant. Summarise the following week of health logs for a patient with " +
          conditionName +
          " in 3–4 sentences. Focus on overall trajectory, key symptoms, diet adherence, and any warning signs. Be concise — max 200 words."
      },
      { role: "user", content: logTexts }
    ]
  });

  const summaryText =
    completion.choices[0]?.message?.content?.trim() ??
    `Week summary: avg energy ${avgEnergy.toFixed(1)}/10, avg fever ${avgFever.toFixed(1)}°C, trend: ${trend}.`;

  const embedding = await embedText(summaryText);
  const qdrantId = randomUUID();

  await getQdrant().upsert(COLLECTIONS.WEEKLY_SUMMARIES, {
    wait: true,
    points: [
      {
        id: qdrantId,
        vector: embedding,
        payload: { userId, conditionId, weekStart, summaryText }
      }
    ]
  });

  await WeeklyHealthSummary.create({
    userId,
    conditionId,
    weekStart,
    weekEnd,
    summaryText,
    avgEnergy: Number(avgEnergy.toFixed(1)),
    avgFever: Number(avgFever.toFixed(1)),
    trend,
    qdrantId
  });

  console.info(`[weeklyDigest] Generated summary for ${conditionName} week ${weekStart}`);
}
