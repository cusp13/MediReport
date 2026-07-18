import { useState } from "react";
import type { SpecialtyId } from "../lib/specialties";
import { partnersForSpecialty, type PartnerClinic } from "../data/partnerClinics";
import { recordReferral } from "../api/client";
import { StarIcon } from "./icons";

function PartnerRow({ partner }: { partner: PartnerClinic }) {
  const [booked, setBooked] = useState(false);

  function book() {
    setBooked(true);
    // Fire-and-forget referral tracking (works anonymously).
    void recordReferral({
      partnerId: partner.id,
      partnerName: partner.name,
      specialty: partner.specialtyId
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-blue-200 bg-blue-50/40 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-gray-900">
            {partner.name}
          </span>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
            Partner
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
          <span className="flex items-center gap-0.5 font-medium text-amber-600">
            <StarIcon className="h-3 w-3" />
            {partner.rating}
          </span>
          <span className="text-gray-300">·</span>
          <span>{partner.reviews} reviews</span>
          <span className="text-gray-300">·</span>
          <span>{partner.city}</span>
          <span className="text-gray-300">·</span>
          <span>₹{partner.feeInr}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={book}
        disabled={booked}
        className={`shrink-0 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
          booked
            ? "bg-green-100 text-green-700"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {booked ? "Requested ✓" : "Book / Refer"}
      </button>
    </div>
  );
}

export function PartnerClinics({ specialties }: { specialties: SpecialtyId[] }) {
  // Unique partners across the recommended specialties.
  const seen = new Set<string>();
  const partners: PartnerClinic[] = [];
  for (const id of specialties) {
    for (const p of partnersForSpecialty(id)) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        partners.push(p);
      }
    }
  }
  if (partners.length === 0) return null;

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Featured partners
        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium normal-case text-gray-400">
          sample
        </span>
      </div>
      <div className="space-y-2">
        {partners.map((p) => (
          <PartnerRow key={p.id} partner={p} />
        ))}
      </div>
    </div>
  );
}
