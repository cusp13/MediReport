import type { Report } from "../types/report";
import { buildTrend, type TrendDirection, type TrendRow } from "../lib/trend";

const TREND_STYLE: Record<TrendDirection, { pill: string; label: string }> = {
  improved: { pill: "bg-green-100 text-green-700", label: "Improved" },
  worsened: { pill: "bg-red-100 text-red-600", label: "Worsened" },
  steady: { pill: "bg-gray-100 text-gray-500", label: "Steady" },
  unknown: { pill: "bg-gray-100 text-gray-400", label: "—" }
};

function Arrow({ dir }: { dir: TrendRow["arrow"] }) {
  if (!dir || dir === "flat") return <span className="text-gray-300">→</span>;
  return dir === "up" ? (
    <span className="text-gray-500">↑</span>
  ) : (
    <span className="text-gray-500">↓</span>
  );
}

export function TrendView({
  current,
  previous,
  onClear
}: {
  current: Report;
  previous: Report;
  onClear: () => void;
}) {
  const { rows, improved, worsened, steady } = buildTrend(current, previous);

  return (
    <div className="animate-fade-in-up overflow-hidden rounded-2xl border border-blue-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 bg-blue-50/50 px-5 py-3.5">
        <div>
          <div className="text-sm font-semibold text-gray-900">
            Changes since your other report
          </div>
          <div className="mt-0.5 text-xs text-gray-500">
            {improved} improved · {worsened} worsened · {steady} steady
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-full px-2.5 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100"
        >
          Clear
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-6 text-center text-sm text-gray-500">
          No markers matched between the two reports, so there's nothing to
          compare.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {rows.map((row) => {
            const style = TREND_STYLE[row.trend];
            return (
              <div
                key={row.name}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-gray-800">
                    {row.name}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs tabular-nums text-gray-500">
                    <span>{row.prevDisplay}</span>
                    <Arrow dir={row.arrow} />
                    <span className="font-medium text-gray-700">
                      {row.currDisplay}
                    </span>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${style.pill}`}
                >
                  {style.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
