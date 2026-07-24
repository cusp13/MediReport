import mongoose, { Schema } from "mongoose";

const familyMemberSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    relation: { type: String, trim: true },
    age: { type: String, trim: true },
    // Medical context used to personalise AI recovery advice for this member.
    preExistingConditions: { type: String, trim: true },
    currentMedications: { type: String, trim: true },
    medicalNotes: { type: String, trim: true }
  },
  { timestamps: true }
);

export const FamilyMember = mongoose.model("FamilyMember", familyMemberSchema);
