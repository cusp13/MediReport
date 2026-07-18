import { useEffect, useState } from "react";
import type { Marker } from "../types/report";
import { parseValue, parseRange, gaugeGeometry } from "../lib/range";

const MARKER_COLOR: Record<Marker["status"], string> = {
  low: "bg-amber-500",
  normal: "bg-green-500",
  high: "bg-red-500"
};

// Shows the value's position against the normal range. Renders nothing when the
// range/value can't be parsed, so odd formats never draw a misleading gauge.
export function MarkerGauge({ marker }: { marker: Marker }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const value = parseValue(marker.value);
  const range = parseRange(marker.refRange);
  if (value === null || !range) return null;

  const geo = gaugeGeometry(value, range);
  if (!geo) return null;

  return (
    <div className="mt-3">
      <div className="relative h-2 rounded-full bg-gray-100">
        <div
          className="absolute top-0 h-2 rounded-full bg-green-100"
          style={{
            left: `${geo.bandLeft}%`,
            width: `${geo.bandRight - geo.bandLeft}%`
          }}
        />
        <div
          className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white shadow-sm transition-all duration-700 ease-out ${MARKER_COLOR[marker.status]}`}
          style={{ left: mounted ? `${geo.markerPct}%` : "0%" }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-gray-400">
        <span>Low</span>
        <span className="text-green-600">Normal range</span>
        <span>High</span>
      </div>
    </div>
  );
}
