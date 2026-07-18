import mongoose, { Schema } from "mongoose";

// Records a click on a partner clinic — the B2B "track clicks → revenue" signal.
// userId is optional so referrals work for anonymous visitors too.
const referralClickSchema = new Schema(
  {
    partnerId: { type: String, required: true },
    partnerName: { type: String, required: true },
    specialty: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

export const ReferralClick = mongoose.model("ReferralClick", referralClickSchema);
