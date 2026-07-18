import { useEffect, useState } from "react";
import { PREVIEW_GAUGES, type PreviewGauge } from "../data/sampleReport";
import { SparkleIcon } from "./icons";

const STATUS_STYLE: Record<PreviewGauge["status"], { pill: string; marker: string }> = {
  low: { pill: "bg-amber-100 text-amber-700", marker: "bg-amber-500" },
  normal: { pill: "bg-green-100 text-green-700", marker: "bg-green-500" },
  high: { pill: "bg-red-100 text-red-600", marker: "bg-red-500" }
};

const STATUS_LABEL: Record<PreviewGauge["status"], string> = {
  low: "Low",
  normal: "Normal",
  high: "High"
};

// Clamps the value onto a track that extends a little beyond the reference
// range on both sides, so a low/high value still sits visibly inside the bar.
function positionPct(g: PreviewGauge): number {
  const span = g.high - g.low;
  const min = g.low - span * 0.5;
  const max = g.high + span * 0.5;
  const pct = ((g.value - min) / (max - min)) * 100;
  return Math.max(4, Math.min(96, pct));
}

function rangePct(g: PreviewGauge): { left: number; width: number } {
  const span = g.high - g.low;
  const min = g.low - span * 0.5;
  const max = g.high + span * 0.5;
  const left = ((g.low - min) / (max - min)) * 100;
  const right = ((g.high - min) / (max - min)) * 100;
  return { left, width: right - left };
}

function Gauge({ gauge, mounted, delay }: { gauge: PreviewGauge; mounted: boolean; delay: number }) {
  const style = STATUS_STYLE[gauge.status];
  const range = rangePct(gauge);
  const pos = positionPct(gauge);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-gray-700">{gauge.name}</span>
        <span className="flex items-center gap-2 text-xs">
          <span className="tabular-nums text-gray-400">{gauge.display}</span>
          <span
            className={`rounded-full px-2 py-0.5 font-semibold transition-opacity duration-500 ${style.pill}`}
            style={{ opacity: mounted ? 1 : 0, transitionDelay: `${delay + 400}ms` }}
          >
            {STATUS_LABEL[gauge.status]}
          </span>
        </span>
      </div>
      <div className="relative mt-2 h-2 rounded-full bg-gray-100">
        {/* Normal-range band */}
        <div
          className="absolute top-0 h-2 rounded-full bg-green-100"
          style={{ left: `${range.left}%`, width: `${range.width}%` }}
        />
        {/* Value marker slides to its position on mount */}
        <div
          className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white transition-all duration-[900ms] ease-out ${style.marker}`}
          style={{ left: mounted ? `${pos}%` : "0%", transitionDelay: `${delay}ms` }}
        />
      </div>
    </div>
  );
}

export function HeroPreview({ onTry }: { onTry: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 250);
    return () => clearTimeout(t);
  }, []);

  return (
    <button
      type="button"
      onClick={onTry}
      className="group w-full rounded-3xl border border-gray-200/80 bg-white/80 p-6 text-left shadow-sm backdrop-blur transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Sample result
        </span>
        <span className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-gray-200" />
          <span className="h-2 w-2 rounded-full bg-gray-200" />
          <span className="h-2 w-2 rounded-full bg-gray-200" />
        </span>
      </div>

      <div className="mt-5 space-y-5">
        {PREVIEW_GAUGES.map((gauge, i) => (
          <Gauge key={gauge.name} gauge={gauge} mounted={mounted} delay={i * 180} />
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white transition-transform group-hover:scale-[1.02]">
        <SparkleIcon className="h-4 w-4" />
        Try this sample report
      </div>
    </button>
  );
}
