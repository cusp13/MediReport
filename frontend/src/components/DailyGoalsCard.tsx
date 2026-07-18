import { useState, useEffect } from "react";
import { logDailyVitals, addExerciseLog } from "../api/client";
import type { DailyGoals, TodayStats } from "../api/client";

function ProgressBar({ value, target, color = "bg-blue-500" }: { value: number; target: number; color?: string }) {
  const pct = Math.min(100, target > 0 ? Math.round((value / target) * 100) : 0);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-gray-100">
        <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-xs tabular-nums text-gray-400">{pct}%</span>
    </div>
  );
}

function GoalRow({
  icon, label, current, target, unit, color
}: {
  icon: string; label: string; current: number; target: number; unit: string; color?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium text-gray-700">
          <span>{icon}</span> {label}
        </span>
        <span className="tabular-nums text-gray-500">
          <span className={current >= target ? "font-semibold text-green-600" : "font-semibold text-gray-800"}>
            {current % 1 === 0 ? current : current.toFixed(1)}
          </span>
          <span className="text-gray-400"> / {target}{unit}</span>
        </span>
      </div>
      <ProgressBar value={current} target={target} color={color} />
    </div>
  );
}

const MOOD_LABELS = ["", "Awful", "Poor", "Okay", "Good", "Great"];

export function DailyGoalsCard({
  goals,
  today,
  onVitalsLogged
}: Readonly<{
  goals: DailyGoals;
  today: TodayStats;
  onVitalsLogged: () => void;
}>) {
  const [water, setWater] = useState(today.waterLitres != null ? String(today.waterLitres) : "");
  const [sleep, setSleep] = useState(today.sleepHours != null ? String(today.sleepHours) : "");
  const [mood, setMood] = useState<number>(today.mood ?? 0);
  const [exMin, setExMin] = useState("");
  // Optimistic local total — syncs with prop on parent refresh
  const [exTotal, setExTotal] = useState(today.exerciseMinutes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Keep exTotal in sync when parent re-fetches daily goals
  useEffect(() => { setExTotal(today.exerciseMinutes); }, [today.exerciseMinutes]);

  async function handleLog(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    // Save vitals (water / sleep / mood) — non-fatal
    if (water || sleep || mood > 0) {
      try {
        await logDailyVitals({
          waterLitres: water ? Number(water) : undefined,
          sleepHours: sleep ? Number(sleep) : undefined,
          mood: mood > 0 ? mood : undefined
        });
      } catch { /* best-effort */ }
    }

    // Save exercise minutes — optimistically update bar immediately
    if (exMin) {
      const mins = Number(exMin);
      // Truncate to 60 chars to satisfy the route schema
      const exType = goals.exerciseType.slice(0, 60);
      setExTotal((prev) => prev + mins);
      setExMin("");
      try {
        await addExerciseLog({ type: exType, durationMin: mins });
      } catch { /* best-effort */ }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onVitalsLogged();
  }

  const waterLogged = today.waterLitres ?? (water ? Number(water) : 0);
  const sleepLogged = today.sleepHours ?? (sleep ? Number(sleep) : 0);

  const inputClass = "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400";

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-gray-900">🎯 Today's Health Goals</h2>
          {goals.reportBased && goals.reportDate ? (
            <p className="text-xs text-blue-600 mt-0.5">
              Personalised from your {new Date(goals.reportDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} lab report
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5">
              General guidelines · Upload a lab report for personalised targets
            </p>
          )}
        </div>
      </div>

      {/* Progress rows */}
      <div className="space-y-3">
        <GoalRow
          icon="💧" label="Water" color="bg-cyan-500"
          current={waterLogged} target={goals.waterTargetL} unit="L"
        />
        <GoalRow
          icon="👣" label="Steps" color="bg-violet-500"
          current={today.steps} target={goals.stepsTarget} unit=""
        />
        <GoalRow
          icon="🏃" label="Exercise" color="bg-green-500"
          current={exTotal} target={goals.exerciseMinutes} unit=" min"
        />
        <GoalRow
          icon="😴" label="Sleep" color="bg-indigo-400"
          current={sleepLogged} target={goals.sleepHours} unit="h"
        />
      </div>

      {/* Exercise type */}
      <div className="rounded-xl bg-green-50 px-4 py-2.5 text-sm text-green-800">
        <span className="font-medium">Recommended: </span>{goals.exerciseType}
      </div>

      {/* Diet */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-emerald-50 px-3 py-2.5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">Eat today</p>
          <p className="text-emerald-800">{goals.foodsToEat.join(", ")}</p>
        </div>
        <div className="rounded-xl bg-red-50 px-3 py-2.5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-500">Avoid</p>
          <p className="text-red-700">{goals.foodsToAvoid.join(", ")}</p>
        </div>
      </div>

      {/* Tips */}
      {goals.tips.length > 0 && (
        <ul className="space-y-1">
          {goals.tips.map((tip) => (
            <li key={tip} className="flex items-start gap-2 text-xs text-gray-600">
              <span className="mt-0.5 text-blue-400">•</span>
              {tip}
            </li>
          ))}
        </ul>
      )}

      {/* Quick log */}
      <form onSubmit={handleLog} className="border-t border-gray-100 pt-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Log today's vitals</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="water-log" className="mb-1 block text-xs font-medium text-gray-600">
              Water (litres)
            </label>
            <input
              id="water-log"
              type="number"
              step="0.25"
              min="0"
              max="10"
              value={water}
              onChange={(e) => setWater(e.target.value)}
              placeholder={`target ${goals.waterTargetL}L`}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="sleep-log" className="mb-1 block text-xs font-medium text-gray-600">
              Sleep (hours)
            </label>
            <input
              id="sleep-log"
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={sleep}
              onChange={(e) => setSleep(e.target.value)}
              placeholder={`target ${goals.sleepHours}h`}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="exercise-log" className="mb-1 block text-xs font-medium text-gray-600">
              Exercise (min)
            </label>
            <input
              id="exercise-log"
              type="number"
              step="1"
              min="0"
              max="300"
              value={exMin}
              onChange={(e) => setExMin(e.target.value)}
              placeholder={`target ${goals.exerciseMinutes}`}
              className={inputClass}
            />
          </div>
        </div>

        {/* Mood picker */}
        <fieldset>
          <legend className="mb-1.5 text-xs font-medium text-gray-600">Mood today</legend>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setMood(v)}
                title={MOOD_LABELS[v]}
                className={`flex-1 rounded-xl border py-1.5 text-sm transition-colors ${
                  mood === v
                    ? "border-blue-500 bg-blue-50 font-semibold text-blue-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {["😞", "😕", "😐", "🙂", "😄"][v - 1]}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={saving || (!water && !sleep && !exMin && mood === 0)}
          className="w-full rounded-xl bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
        >
          {saved ? "✓ Saved" : saving ? "Saving…" : "Save today's vitals"}
        </button>
      </form>
    </div>
  );
}
