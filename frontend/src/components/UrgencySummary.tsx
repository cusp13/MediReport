import type { Urgency } from "../types/report";
import { CheckCircleIcon, AlertTriangleIcon, AlertCircleIcon } from "./icons";

const STYLES: Record<Urgency, { card: string; icon: string; chip: string }> = {
  green: {
    card: "bg-gradient-to-br from-green-50 to-white border-green-200",
    icon: "bg-green-100 text-green-600",
    chip: "bg-green-100 text-green-700"
  },
  yellow: {
    card: "bg-gradient-to-br from-amber-50 to-white border-amber-200",
    icon: "bg-amber-100 text-amber-600",
    chip: "bg-amber-100 text-amber-700"
  },
  red: {
    card: "bg-gradient-to-br from-red-50 to-white border-red-200",
    icon: "bg-red-100 text-red-500",
    chip: "bg-red-100 text-red-600"
  }
};

const ICON: Record<Urgency, typeof CheckCircleIcon> = {
  green: CheckCircleIcon,
  yellow: AlertTriangleIcon,
  red: AlertCircleIcon
};

// Calm-first framing: the headline reassures where it can, and pairs any
// concern with the fact that there's a clear next step.
const LABEL: Record<Urgency, string> = {
  green: "Everything looks in range",
  yellow: "Mostly fine — a couple of things to review",
  red: "Mostly fine — one clear thing to ask about"
};

type Props = {
  overallUrgency: Urgency;
  totalCount: number;
  lowCount: number;
  highCount: number;
};

// Builds a sub-line that always matches the real counts, so the summary can
// never contradict the marker cards below it.
function buildSummary(total: number, low: number, high: number): string {
  const flagged = low + high;
  if (flagged === 0) {
    return `All ${total} markers are within their normal ranges.`;
  }
  const parts: string[] = [];
  if (low > 0) parts.push(`${low} below range`);
  if (high > 0) parts.push(`${high} above range`);
  const normal = total - flagged;
  return `${parts.join(" and ")} · ${normal} in the normal range.`;
}

export function UrgencySummary({
  overallUrgency,
  totalCount,
  lowCount,
  highCount
}: Props) {
  const styles = STYLES[overallUrgency];
  const Icon = ICON[overallUrgency];
  const flaggedCount = lowCount + highCount;

  return (
    <div className={`rounded-2xl border p-6 ${styles.card}`}>
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${styles.icon}`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {LABEL[overallUrgency]}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {buildSummary(totalCount, lowCount, highCount)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
              {totalCount} marker{totalCount === 1 ? "" : "s"} checked
            </span>
            {flaggedCount > 0 && (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles.chip}`}
              >
                {flaggedCount} need{flaggedCount === 1 ? "s" : ""} attention
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
