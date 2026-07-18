import type { HeatmapDay } from "../types/account";

// Sequential single-hue ramp (light → dark by exercise minutes). Level 0 is the
// empty-day surface; 1–4 are increasing activity. Monotonic lightness → CVD-safe.
const LEVELS = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
const WEEKS = 13;

// A day with *any* logged activity is at least level 1. Intensity combines
// minutes and steps (~1000 steps ≈ 10 min of credit), so logging only steps
// still lights the cell.
function levelFor(minutes: number, steps: number): number {
  const score = minutes + steps / 100;
  if (score <= 15) return 1;
  if (score <= 30) return 2;
  if (score <= 60) return 3;
  return 4;
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Columns of 7 days (Sun→Sat), ending today, aligned so column 0 starts a Sunday.
function buildColumns(): (Date | null)[][] {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - (WEEKS * 7 - 1));
  start.setDate(start.getDate() - start.getDay());

  const columns: (Date | null)[][] = [];
  const cur = new Date(start);
  while (cur <= today) {
    const week: (Date | null)[] = [];
    for (let dow = 0; dow < 7; dow++) {
      if (cur <= today) {
        week.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      } else {
        week.push(null);
      }
    }
    columns.push(week);
  }
  return columns;
}

export function ExerciseHeatmap({ heatmap }: { heatmap: HeatmapDay[] }) {
  const byDate = new Map(heatmap.map((d) => [d.date, d]));
  const columns = buildColumns();

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-[3px]">
          {columns.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => {
                if (!day) {
                  return <div key={di} className="h-3 w-3" />;
                }
                const ds = dateStr(day);
                const entry = byDate.get(ds);
                const minutes = entry?.minutes ?? 0;
                const steps = entry?.steps ?? 0;
                // Any logged entry lights the cell; empty days stay level 0.
                const lvl = entry ? levelFor(minutes, steps) : 0;
                const label = entry
                  ? `${ds}: ${minutes} min` +
                    (steps ? `, ${steps.toLocaleString()} steps` : "")
                  : `${ds}: no activity`;
                return (
                  <div
                    key={di}
                    title={label}
                    aria-label={label}
                    className="h-3 w-3 rounded-[3px]"
                    style={{ backgroundColor: LEVELS[lvl] }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
        <span>Less</span>
        {LEVELS.map((c) => (
          <span
            key={c}
            className="h-3 w-3 rounded-[3px]"
            style={{ backgroundColor: c }}
          />
        ))}
        <span>More</span>
        <span className="ml-auto">Last {WEEKS} weeks · hover a day</span>
      </div>
    </div>
  );
}
