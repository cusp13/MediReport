import { useEffect, useState } from "react";
import type { DashboardData } from "../types/account";
import type { DailyGoals, TodayStats } from "../api/client";
import { getDashboard, getDailyGoals } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { LogPanel } from "./LogPanel";
import { ExerciseHeatmap } from "./ExerciseHeatmap";
import { DailyGoalsCard } from "./DailyGoalsCard";
import { LeafIcon, AlertTriangleIcon, CheckCircleIcon } from "./icons";

export function DashboardView({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<DailyGoals | null>(null);
  const [today, setToday] = useState<TodayStats | null>(null);

  function reloadGoals() {
    getDailyGoals()
      .then(({ goals: g, today: t }) => { setGoals(g); setToday(t); })
      .catch(() => undefined);
  }

  function reload() {
    getDashboard()
      .then(setData)
      .catch(() => undefined)
      .finally(() => setLoading(false));
    reloadGoals();
  }

  useEffect(reload, []);

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        ← Back
      </button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Hi{user ? `, ${user.name.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="text-sm text-gray-500">Your health at a glance</p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : !data ? (
        <p className="text-sm text-gray-500">Couldn't load your dashboard.</p>
      ) : (
        <>
          {/* Stat tiles */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-4">
              <div className="text-2xl">🔥</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                {data.streak}
              </div>
              <div className="text-xs text-gray-500">
                day{data.streak === 1 ? "" : "s"} streak
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-2xl">👣</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                {data.totals.steps.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">total steps</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="text-2xl">⏱️</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                {data.totals.minutes}
              </div>
              <div className="text-xs text-gray-500">total minutes</div>
            </div>
          </div>

          {/* Profile chips */}
          {Boolean(
            data.profile?.conditions?.length || data.profile?.dietPreference
          ) && (
            <div className="flex flex-wrap items-center gap-2">
              {data.profile?.conditions?.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                >
                  {c}
                </span>
              ))}
              {data.profile?.dietPreference && (
                <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                  {data.profile.dietPreference}
                </span>
              )}
            </div>
          )}

          {/* Activity heatmap */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-gray-900">
              Exercise activity
            </h2>
            <ExerciseHeatmap heatmap={data.heatmap} />
          </div>

          {/* Major concerns from last report */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-amber-500" />
              <h2 className="font-semibold text-gray-900">Major concerns</h2>
              {data.reportDate && (
                <span className="text-xs text-gray-400">
                  from {new Date(data.reportDate).toLocaleDateString()}
                </span>
              )}
            </div>
            {data.concerns.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                {data.reportDate
                  ? "Nothing flagged in your last report."
                  : "No report saved yet — analyze one and save it."}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.concerns.map((c) => (
                  <span
                    key={c.name}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-sm text-amber-800"
                  >
                    {c.name}: {c.value} {c.unit} ({c.status})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Daily health goals */}
          {goals && today && (
            <DailyGoalsCard goals={goals} today={today} onVitalsLogged={reloadGoals} />
          )}

          {/* Recommended yoga / exercise */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <LeafIcon className="h-5 w-5 text-green-500" />
              <h2 className="font-semibold text-gray-900">
                Recommended for you
              </h2>
            </div>
            <div className="space-y-3">
              {data.guide.map((g) => (
                <div key={g.condition}>
                  <div className="text-sm font-medium text-gray-800">
                    {g.condition}
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    <span className="text-gray-400">Yoga:</span>{" "}
                    {g.yoga.join(", ")}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="text-gray-400">Exercise:</span>{" "}
                    {g.exercises.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity — type · duration · steps */}
          {data.recentExercise.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="mb-3 font-semibold text-gray-900">
                Recent activity
              </h2>
              <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-1.5 text-sm">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Exercise
                </div>
                <div className="text-right text-xs font-medium uppercase tracking-wide text-gray-400">
                  Time
                </div>
                <div className="text-right text-xs font-medium uppercase tracking-wide text-gray-400">
                  Steps
                </div>
                {data.recentExercise.map((ex) => (
                  <div key={ex.id} className="contents">
                    <div className="text-gray-800">
                      {ex.type}
                      <span className="ml-2 text-xs text-gray-400">
                        {new Date(ex.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-right tabular-nums text-gray-600">
                      {ex.durationMin ? `${ex.durationMin} min` : "—"}
                    </div>
                    <div className="text-right tabular-nums text-gray-600">
                      {ex.steps ? ex.steps.toLocaleString() : "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick logging */}
          <LogPanel onLogged={reload} />
        </>
      )}
    </div>
  );
}
