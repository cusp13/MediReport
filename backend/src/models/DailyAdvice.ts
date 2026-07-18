import mongoose, { Schema } from "mongoose";

const dietPlanSchema = new Schema(
  {
    breakfast: { type: String },
    lunch: { type: String },
    dinner: { type: String },
    snacks: { type: String },
    avoid: { type: [String], default: [] }
  },
  { _id: false }
);

const dailyAdviceSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    conditionId: { type: Schema.Types.ObjectId, ref: "ConditionLog", required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    recoveryAssessment: { type: String, required: true },
    dietPlan: { type: dietPlanSchema, required: true },
    hydrationTarget: { type: String, required: true },
    exerciseAdvice: { type: String, required: true },
    warningFlags: { type: [String], default: [] },
    tomorrowGoal: { type: String, required: true }
  },
  { timestamps: true }
);

dailyAdviceSchema.index({ userId: 1, conditionId: 1, date: 1 }, { unique: true });

export const DailyAdvice = mongoose.model("DailyAdvice", dailyAdviceSchema);
