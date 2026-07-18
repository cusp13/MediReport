import type { Report } from "../schemas/report.js";

// ARCHITECTURE.md §7 — backend-level guard against diagnostic phrasing
// slipping through despite the system prompt instructions.
const DIAGNOSTIC_PHRASES = [
  /\byou have\b/i,
  /\bdiagnosed with\b/i,
  /\bthis confirms\b/i,
  /\byou are suffering from\b/i,
  /\bproves you have\b/i
];

export function findUnsafeLanguage(report: Report): string[] {
  const offenders: string[] = [];
  for (const marker of report.markers) {
    const fields = [marker.plainExplanation, ...marker.mayIndicate];
    for (const field of fields) {
      if (DIAGNOSTIC_PHRASES.some((re) => re.test(field))) {
        offenders.push(`${marker.name}: "${field}"`);
      }
    }
  }
  return offenders;
}
