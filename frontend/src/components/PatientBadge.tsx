import type { Report } from "../types/report";

// Shows only when a name was confidently extracted — a wrong or garbled name
// would hurt trust more than showing nothing.
export function PatientBadge({ report }: { report: Report }) {
  const name = report.patientName?.trim();
  if (!name) return null;

  const initial = name.charAt(0).toUpperCase();
  const age = report.patientAge?.trim();

  return (
    <div className="animate-fade-in flex items-center gap-2.5 rounded-full border border-gray-200 bg-white/80 py-1 pl-1 pr-3.5 backdrop-blur">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-teal-500 text-sm font-semibold text-white">
        {initial}
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-gray-900">{name}</div>
        {age && <div className="text-[11px] text-gray-400">Age {age}</div>}
      </div>
    </div>
  );
}
