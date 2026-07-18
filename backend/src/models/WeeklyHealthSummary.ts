import mongoose, { Schema } from "mongoose";

const weeklyHealthSummarySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    conditionId: { type: Schema.Types.ObjectId, ref: "ConditionLog", required: true },
    weekStart: { type: String, required: true }, // YYYY-MM-DD (Monday)
    weekEnd: { type: String, required: true },   // YYYY-MM-DD (Sunday)
    summaryText: { type: String, required: true },
    avgEnergy: { type: Number, default: null },
    avgFever: { type: Number, default: null },
    trend: {
      type: String,
      enum: ["improving", "stable", "worsening"],
      default: "stable"
    },
    qdrantId: { type: String, default: null }
  },
  { timestamps: true }
);

weeklyHealthSummarySchema.index({ userId: 1, conditionId: 1, weekStart: 1 }, { unique: true });

export const WeeklyHealthSummary = mongoose.model("WeeklyHealthSummary", weeklyHealthSummarySchema);
