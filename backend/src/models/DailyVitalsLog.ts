import mongoose, { Schema } from "mongoose";

const dailyVitalsSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: "FamilyMember", default: null },
    date: { type: String, required: true }, // YYYY-MM-DD
    waterLitres: { type: Number },
    sleepHours: { type: Number },
    mood: { type: Number, min: 1, max: 5 }
  },
  { timestamps: true }
);

dailyVitalsSchema.index({ userId: 1, memberId: 1, date: 1 }, { unique: true });

export const DailyVitalsLog = mongoose.model("DailyVitalsLog", dailyVitalsSchema);
