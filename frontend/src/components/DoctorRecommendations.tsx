import type { Report } from "../types/report";
import { recommendSpecialties } from "../lib/specialties";
import { NearbyClinics } from "./NearbyClinics";
import { PartnerClinics } from "./PartnerClinics";
import { StethoscopeIcon } from "./icons";

// Suggests which specialist to see based on flagged results (our logic), then
// lists real nearby clinics/hospitals from OpenStreetMap to visit.
export function DoctorRecommendations({
  report,
  autoStartClinics
}: {
  report: Report;
  autoStartClinics?: boolean;
}) {
  const recommendations = recommendSpecialties(report);
  if (recommendations.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center gap-2.5 border-b border-gray-100 bg-blue-50/50 px-5 py-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 text-white">
          <StethoscopeIcon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">
            Who to see next
          </div>
          <div className="text-xs text-gray-500">
            Suggested specialists based on your results
          </div>
        </div>
      </div>

      <div className="space-y-3 px-5 py-4">
        {recommendations.map((rec) => (
          <div
            key={rec.specialty.id}
            className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3"
          >
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h3 className="font-semibold text-gray-900">
                {rec.specialty.name}
              </h3>
              <span className="text-xs text-gray-400">
                {rec.specialty.blurb}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {rec.markers.length > 0 ? (
                <>
                  For your{" "}
                  <span className="font-medium text-gray-800">
                    {rec.markers.join(", ")}
                  </span>
                  .
                </>
              ) : (
                "A good first stop for a routine check of your overall health."
              )}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-4 border-t border-gray-100 px-5 py-4">
        <PartnerClinics
          specialties={recommendations.map((r) => r.specialty.id)}
        />
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Clinics & hospitals near you
          </div>
          <NearbyClinics autoStart={autoStartClinics} />
        </div>
      </div>

      <p className="border-t border-gray-100 px-5 py-3 text-[11px] text-gray-400">
        Suggested specialties are informational, not a referral. Clinic listings
        come from OpenStreetMap.
      </p>
    </div>
  );
}
