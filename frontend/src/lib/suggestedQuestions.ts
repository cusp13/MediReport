import type { Report } from "../types/report";

// Builds a short mix of tappable prompts: a couple derived from the user's own
// flagged markers, plus a few generics. Pure client logic — no API cost.
export function buildSuggestions(report: Report): string[] {
  const flagged = report.markers.filter((m) => m.status !== "normal");

  const derived = flagged.slice(0, 2).map((m) => {
    const direction = m.status === "low" ? "low" : "high";
    return `Why is my ${m.name} ${direction}?`;
  });

  const generic = [
    "Which result should I focus on first?",
    "What should I ask my doctor?",
    "Are any of these results serious?"
  ];

  // Fill up to 4 suggestions, derived first, without duplicates.
  const out: string[] = [];
  for (const q of [...derived, ...generic]) {
    if (out.length >= 4) break;
    if (!out.includes(q)) out.push(q);
  }
  return out;
}
