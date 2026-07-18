import mongoose, { Schema } from "mongoose";

const exerciseLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: "FamilyMember", default: null },
    date: { type: String, required: true }, // YYYY-MM-DD
    type: { type: String, required: true, trim: true },
    durationMin: { type: Number },
    steps: { type: Number },
    done: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const ExerciseLog = mongoose.model("ExerciseLog", exerciseLogSchema);
