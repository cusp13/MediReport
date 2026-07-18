import type { DailyHealthLog } from "../types/account";

interface Props {
  logs: DailyHealthLog[];
}

function Sparkline({
  values,
  color,
  min,
  max
}: {
  values: (number | null)[];
  color: string;
  min: number;
  max: number;
}) {
  const W = 300;
  const H = 60;
  const filled = values.filter((v): v is number => v != null);
  if (filled.length < 2) return null;

  const range = max - min || 1;
  const step = W / (values.length - 1);

  const points = values
    .map((v, i) => {
      if (v == null) return null;
      const x = i * step;
      const y = H - ((v - min) / range) * H;
      return `${x},${y}`;
    })
    .filter(Boolean);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: H }}
      preserveAspectRatio="none"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {values.map((v, i) => {
        if (v == null) return null;
        const x = i * step;
        const y = H - ((v - min) / range) * H;
        return (
          <circle key={i} cx={x} cy={y} r="3" fill={color} />
        );
      })}
    </svg>
  );
}

export function RecoveryChart({ logs }: Props) {
  if (logs.length < 2) return null;

  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const labels = sorted.map((l) => l.date.slice(5)); // MM-DD
  const energyVals = sorted.map((l) => l.energyLevel);
  const feverVals = sorted.map((l) =>
    l.fever != null ? +(l.fever * 9 / 5 + 32).toFixed(1) : null
  );

  const hasFever = feverVals.some((v) => v != null);
  const hasEnergy = energyVals.some((v) => v != null);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        Recovery trend (last {sorted.length} days)
      </h3>

      <div className="space-y-4">
        {hasEnergy && (
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-xs font-medium text-gray-500">
                Energy (1–10)
              </span>
            </div>
            <Sparkline values={energyVals} color="#3b82f6" min={1} max={10} />
          </div>
        )}

        {hasFever && (
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-400" />
              <span className="text-xs font-medium text-gray-500">
                Fever (°F)
              </span>
            </div>
            <Sparkline
              values={feverVals}
              color="#fb923c"
              min={96.8}
              max={105.8}
            />
          </div>
        )}
      </div>

      {/* X-axis labels */}
      <div className="mt-2 flex justify-between">
        {labels.map((l, i) =>
          i === 0 || i === labels.length - 1 || i === Math.floor(labels.length / 2) ? (
            <span key={i} className="text-xs text-gray-400">
              {l}
            </span>
          ) : (
            <span key={i} />
          )
        )}
      </div>
    </div>
  );
}
