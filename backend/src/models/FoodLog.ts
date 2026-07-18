import mongoose, { Schema } from "mongoose";

const foodLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: "FamilyMember", default: null },
    date: { type: String, required: true }, // YYYY-MM-DD
    items: { type: [String], default: [] },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

export const FoodLog = mongoose.model("FoodLog", foodLogSchema);
