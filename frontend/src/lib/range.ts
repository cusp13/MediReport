// Lab reference ranges come in many shapes: "13.0–17.0", "> 50", "< 100",
// "0.4-4.049". Parse defensively — anything we can't confidently read returns
// null so the card falls back to plain text instead of drawing a wrong gauge.

export type ParsedRange = { low: number | null; high: number | null };

function normalize(s: string): string {
  return s
    .replace(/[–—−]/g, "-") // en/em dash, minus sign → hyphen
    .replace(/≤/g, "<=")
    .replace(/≥/g, ">=")
    .replace(/,/g, "")
    .trim();
}

export function parseValue(raw: string): number | null {
  const m = normalize(raw).match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

export function parseRange(raw: string): ParsedRange | null {
  const s = normalize(raw);

  // One-sided: "> 50", ">= 50", "< 100", "<= 100"
  const cmp = s.match(/^([<>])=?\s*(-?\d+(?:\.\d+)?)/);
  if (cmp) {
    const n = Number(cmp[2]);
    return cmp[1] === ">" ? { low: n, high: null } : { low: null, high: n };
  }

  // Two-sided: "13.0-17.0", "0.4 to 4.049"
  const two = s.match(
    /(-?\d+(?:\.\d+)?)\s*(?:to|-)\s*(-?\d+(?:\.\d+)?)/i
  );
  if (two) {
    const low = Number(two[1]);
    const high = Number(two[2]);
    if (high >= low) return { low, high };
  }

  return null;
}

// How far a value sits outside its normal range, normalized by the range span.
// 0 means healthy (inside the range); larger means further out. Lets us compare
// two readings and say whether a marker improved or worsened, not just moved.
export function healthDistance(value: number, range: ParsedRange): number {
  const { low, high } = range;
  if (low !== null && high !== null) {
    const span = high - low || Math.abs(high) || 1;
    if (value < low) return (low - value) / span;
    if (value > high) return (value - high) / span;
    return 0;
  }
  if (low !== null) {
    return value < low ? (low - value) / (Math.abs(low) || 1) : 0;
  }
  if (high !== null) {
    return value > high ? (value - high) / (Math.abs(high) || 1) : 0;
  }
  return 0;
}

export type GaugeGeometry = {
  markerPct: number;
  bandLeft: number;
  bandRight: number;
};

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

// Builds the 0–100% positions for the value marker and the normal-range band.
// Handles two-sided and one-sided ranges; returns null if there isn't enough
// numeric information to place a marker.
export function gaugeGeometry(
  value: number,
  range: ParsedRange
): GaugeGeometry | null {
  const { low, high } = range;
  let min: number;
  let max: number;
  let bandFrom: number;
  let bandTo: number;

  if (low !== null && high !== null) {
    const span = high - low || Math.abs(high) || 1;
    const pad = span * 0.5;
    min = Math.min(low - pad, value);
    max = Math.max(high + pad, value);
    bandFrom = low;
    bandTo = high;
  } else if (low !== null) {
    // Normal is at or above `low`.
    min = 0;
    max = Math.max(low, value) * 1.5 || low + 1;
    bandFrom = low;
    bandTo = max;
  } else if (high !== null) {
    // Normal is at or below `high`.
    min = 0;
    max = Math.max(high, value) * 1.5 || high + 1;
    bandFrom = 0;
    bandTo = high;
  } else {
    return null;
  }

  const span = max - min || 1;
  const pct = (x: number) => clamp(((x - min) / span) * 100, 3, 97);

  return {
    markerPct: pct(value),
    bandLeft: pct(bandFrom),
    bandRight: pct(bandTo)
  };
}
