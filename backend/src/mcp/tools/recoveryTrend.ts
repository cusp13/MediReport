import mongoose from "mongoose";
import { DailyHealthLog } from "../../models/DailyHealthLog.js";

export const recoveryTrendSchema = {
  name: "get_recovery_trend",
  description:
    "Returns the patient's energy and fever readings over the last N days, plus an overall trend assessment.",
  inputSchema: {
    type: "object" as const,
    properties: {
      userId: { type: "string", description: "MongoDB user ID" },
      conditionId: { type: "string", description: "MongoDB condition ID" },
      days: { type: "number", description: "Number of past days to include (default 7)" }
    },
    required: ["userId", "conditionId"]
  }
};

export async function getRecoveryTrend(args: {
  userId: string;
  conditionId: string;
  days?: number;
}): Promise<{ energy: (number | null)[]; fever: (number | null)[]; trend: string }> {
  const limit = args.days ?? 7;
  const logs = await DailyHealthLog.find({
    userId: new mongoose.Types.ObjectId(args.userId),
    conditionId: new mongoose.Types.ObjectId(args.conditionId)
  })
    .sort({ date: -1 })
    .limit(limit);

  const sorted = logs.reverse();
  const energy = sorted.map((l) => l.energyLevel ?? null);
  const fever = sorted.map((l) => l.fever ?? null);

  const energyVals = energy.filter((e): e is number => e != null);
  let trend = "stable";
  if (energyVals.length >= 2) {
    const half = Math.floor(energyVals.length / 2);
    const early = energyVals.slice(0, half).reduce((a, b) => a + b, 0) / half;
    const late = energyVals.slice(half).reduce((a, b) => a + b, 0) / (energyVals.length - half);
    if (late - early > 0.5) trend = "improving";
    else if (early - late > 0.5) trend = "worsening";
  }

  return { energy, fever, trend };
}
