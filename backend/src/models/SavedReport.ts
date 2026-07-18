import mongoose, { Schema } from "mongoose";

const savedReportSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // null = the account owner themselves.
    memberId: { type: Schema.Types.ObjectId, ref: "FamilyMember", default: null },
    title: { type: String, trim: true },
    // The full analyzed Report JSON (see backend/src/schemas/report.ts).
    report: { type: Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

export const SavedReport = mongoose.model("SavedReport", savedReportSchema);
