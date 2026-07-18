import mongoose, { Schema } from "mongoose";

const conditionLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true }, // e.g. "typhoid", "dengue"
    startDate: { type: String, required: true }, // YYYY-MM-DD
    endDate: { type: String, default: null },
    stage: {
      type: String,
      enum: ["acute", "recovery", "resolved"],
      default: "acute"
    },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

export const ConditionLog = mongoose.model("ConditionLog", conditionLogSchema);
