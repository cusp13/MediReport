import type { Report, Marker } from "../types/report";
import { parseValue, parseRange, healthDistance } from "./range";

export type TrendDirection = "improved" | "worsened" | "steady" | "unknown";

export type TrendRow = {
  name: string;
  unit: string;
  prevDisplay: string;
  currDisplay: string;
  arrow: "up" | "down" | "flat" | null;
  trend: TrendDirection;
  status: Marker["status"];
};

export type TrendResult = {
  rows: TrendRow[];
  improved: number;
  worsened: number;
  steady: number;
};

const normalize = (s: string) => s.trim().toLowerCase();
const EPS = 0.02;

function directionFor(curr: Marker, prev: Marker): {
  arrow: TrendRow["arrow"];
  trend: TrendDirection;
} {
  const currVal = parseValue(curr.value);
  const prevVal = parseValue(prev.value);
  const range = parseRange(curr.refRange) ?? parseRange(prev.refRange);

  if (currVal === null || prevVal === null) {
    return { arrow: null, trend: "unknown" };
  }

  const diff = currVal - prevVal;
  const arrow = diff > EPS ? "up" : diff < -EPS ? "down" : "flat";

  if (!range) return { arrow, trend: "unknown" };

  const currDist = healthDistance(currVal, range);
  const prevDist = healthDistance(prevVal, range);
  let trend: TrendDirection = "steady";
  if (currDist < prevDist - EPS) trend = "improved";
  else if (currDist > prevDist + EPS) trend = "worsened";
  return { arrow, trend };
}

// Matches markers common to both reports by name and reports how each changed.
// `current` is the report on screen; `previous` is the one just uploaded.
export function buildTrend(current: Report, previous: Report): TrendResult {
  const prevByName = new Map(
    previous.markers.map((m) => [normalize(m.name), m])
  );

  const rows: TrendRow[] = [];
  for (const curr of current.markers) {
    const prev = prevByName.get(normalize(curr.name));
    if (!prev) continue; // only markers present in both are comparable

    const { arrow, trend } = directionFor(curr, prev);
    rows.push({
      name: curr.name,
      unit: curr.unit,
      prevDisplay: `${prev.value} ${prev.unit}`.trim(),
      currDisplay: `${curr.value} ${curr.unit}`.trim(),
      arrow,
      trend,
      status: curr.status
    });
  }

  // Show changed markers first, steady/unknown after.
  const rank: Record<TrendDirection, number> = {
    worsened: 0,
    improved: 1,
    steady: 2,
    unknown: 3
  };
  rows.sort((a, b) => rank[a.trend] - rank[b.trend]);

  return {
    rows,
    improved: rows.filter((r) => r.trend === "improved").length,
    worsened: rows.filter((r) => r.trend === "worsened").length,
    steady: rows.filter((r) => r.trend === "steady").length
  };
}
