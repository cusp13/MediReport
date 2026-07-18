import mongoose, { Schema } from "mongoose";

const dailyHealthLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    conditionId: { type: Schema.Types.ObjectId, ref: "ConditionLog", required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    dayNumber: { type: Number, required: true }, // day since condition startDate
    fever: { type: Number, default: null }, // celsius e.g. 38.5
    energyLevel: { type: Number, min: 1, max: 10, default: null },
    nauseaLevel: { type: Number, min: 1, max: 5, default: null },
    sleepHours: { type: Number, default: null },
    hydrationLitres: { type: Number, default: null },
    symptoms: { type: [String], default: [] },
    medicationTaken: { type: Boolean, default: null },
    notes: { type: String, trim: true },
    // Composed natural-language string used for embedding
    logText: { type: String, required: true },
    // UUID of the corresponding Qdrant point
    qdrantId: { type: String, default: null }
  },
  { timestamps: true }
);

// One log per user per condition per date
dailyHealthLogSchema.index({ userId: 1, conditionId: 1, date: 1 }, { unique: true });

export const DailyHealthLog = mongoose.model("DailyHealthLog", dailyHealthLogSchema);
