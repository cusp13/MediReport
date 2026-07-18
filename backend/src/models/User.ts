import mongoose, { Schema } from "mongoose";

// Embedded health profile captured at signup — feeds the dashboard and, later,
// personalized suggestions.
const healthProfileSchema = new Schema(
  {
    age: { type: String, trim: true },
    sex: { type: String, trim: true },
    conditions: { type: [String], default: [] },
    dietPreference: { type: String, trim: true },
    activityLevel: { type: String, trim: true },
    heightCm: { type: String, trim: true },
    weightKg: { type: String, trim: true }
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    healthProfile: { type: healthProfileSchema, default: null }
  },
  { timestamps: true }
);

export type UserDoc = mongoose.InferSchemaType<typeof userSchema>;
export const User = mongoose.model("User", userSchema);
